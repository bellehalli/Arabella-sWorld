const BUCKET='dreamhub-attachments';
const TABLE='dreamhub_attachments';
export const ATTACHMENT_BUCKET=BUCKET;
export const ATTACHMENT_TABLE=TABLE;
export const ATTACHMENT_MAX_BYTES=15*1024*1024;
export const ATTACHMENT_MAX_PER_RECORD=10;
const OWNER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXTENSIONS=Object.freeze({'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp','text/plain':'txt','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx'});
function checkContext(client,ownerId){if(!client||!OWNER_ID.test(ownerId||''))throw Error('Sign in to your private vault first.');}
function checkRecordId(recordId){const value=String(recordId||'');if(!/^[a-zA-Z0-9_-]{1,128}$/.test(value))throw Error('Choose a valid record for this attachment.');return value;}
export async function validateAttachmentFile(file){
 if(!file||typeof file.name!=='string'||typeof file.arrayBuffer!=='function'||!Number.isSafeInteger(file.size)||file.size<1)throw Error('Choose a valid file.');
 if(file.size>ATTACHMENT_MAX_BYTES)throw Error('Attachment exceeds the 15 MB limit.');
 const extension=file.name.split('.').at(-1)?.toLowerCase(),expected=EXTENSIONS[file.type];
 if(!expected||extension!==expected&&!(file.type==='image/jpeg'&&extension==='jpeg'))throw Error('Unsupported file type or file extension.');
 if(file.name.length>180||/[\\/\u0000-\u001f]/.test(file.name))throw Error('Unsafe attachment filename.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const ascii=(offset,length)=>String.fromCharCode(...bytes.subarray(offset,offset+length));
 const valid=file.type==='application/pdf'?ascii(0,5)==='%PDF-'
  :file.type==='image/jpeg'?bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff
  :file.type==='image/png'?ascii(0,8)==='\x89PNG\r\n\x1a\n'
  :file.type==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP'
  :file.type==='text/plain'?(()=>{try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);return !bytes.includes(0)}catch{return false}})()
  :file.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'?ascii(0,4)==='PK\x03\x04'
  :false;
 if(!valid)throw Error('File contents do not match the selected file type.');
 return {file_name:file.name,mime_type:file.type,byte_size:file.size};
}
export function attachmentPreviewKind(mime){if(typeof mime!=='string')return 'download';if(mime.startsWith('image/'))return 'image';if(mime==='application/pdf')return 'pdf';if(mime==='text/plain')return 'text';return 'download';}
function ownedPath(path,ownerId){return typeof path==='string'&&path.startsWith(ownerId+'/')&&path.length>ownerId.length+1;}
export async function listAttachments(client,ownerId,recordId){
 checkContext(client,ownerId);
 let query=client.from(TABLE).select('id,record_id,file_name,mime_type,byte_size,storage_path,created_at').eq('owner_id',ownerId);
 if(recordId!==undefined)query=query.eq('record_id',checkRecordId(recordId));
 const {data,error}=await query.order('created_at',{ascending:false});
 if(error)throw Error('Could not load attachments: '+error.message);
 return (data||[]).filter(x=>x&&ownedPath(x.storage_path,ownerId));
}
export async function uploadAttachment(client,ownerId,recordId,file){
 checkContext(client,ownerId);const record=checkRecordId(recordId),meta=await validateAttachmentFile(file),id=crypto.randomUUID(),path=`${ownerId}/${id}.${meta.mime_type==='image/jpeg'&&file.name.toLowerCase().endsWith('.jpeg')?'jpeg':EXTENSIONS[meta.mime_type]}`;
 const uploaded=await client.storage.from(BUCKET).upload(path,file,{contentType:meta.mime_type,upsert:false,cacheControl:'0'});
 if(uploaded.error)throw Error('Private upload failed: '+uploaded.error.message);
 const inserted=await client.from(TABLE).insert({id,owner_id:ownerId,record_id:record,...meta,storage_path:path});
 if(inserted.error){const cleanup=await client.storage.from(BUCKET).remove([path]);throw Error('Attachment metadata could not be saved. '+(cleanup.error?'The uploaded file needs cleanup; contact support.':'The upload was rolled back.'));}
 return {id,record_id:record,...meta,storage_path:path};
}
export async function downloadAttachment(client,ownerId,recordId,id){
 checkContext(client,ownerId);const record=checkRecordId(recordId);
 const {data,error}=await client.from(TABLE).select('id,storage_path,file_name,mime_type').eq('id',id).eq('owner_id',ownerId).eq('record_id',record).single();
 if(error||!data||!ownedPath(data.storage_path,ownerId))throw Error('Attachment not found or access denied.');
 const result=await client.storage.from(BUCKET).download(data.storage_path);
 if(result.error)throw Error('Private download failed: '+result.error.message);
 return {blob:result.data,name:data.file_name,mime:data.mime_type};
}
export async function deleteAttachment(client,ownerId,recordId,id){
 checkContext(client,ownerId);const record=checkRecordId(recordId);
 const {data,error}=await client.from(TABLE).select('storage_path').eq('id',id).eq('owner_id',ownerId).eq('record_id',record).single();
 if(error||!data||!ownedPath(data.storage_path,ownerId))throw Error('Attachment not found or access denied.');
 const removed=await client.storage.from(BUCKET).remove([data.storage_path]);
 if(removed.error)throw Error('File deletion failed; metadata was kept so you can retry.');
 const deleted=await client.from(TABLE).delete().eq('id',id).eq('owner_id',ownerId).eq('record_id',record);
 if(deleted.error)throw Error('File removed, but metadata cleanup failed. Please retry cleanup.');
}
export class AttachmentVault{
 constructor(client,user){checkContext(client,user?.id);this.client=client;this.ownerId=user.id;}
 list(){return listAttachments(this.client,this.ownerId);}
 async add(file,recordId){return uploadAttachment(this.client,this.ownerId,recordId,file);}
 async download(item){if(!item?.record_id||!item?.id)throw Error('Attachment not found or access denied.');const result=await downloadAttachment(this.client,this.ownerId,item.record_id,item.id);return result.blob;}
 async remove(item){if(!item?.record_id||!item?.id)throw Error('Attachment not found or access denied.');return deleteAttachment(this.client,this.ownerId,item.record_id,item.id);}
}
