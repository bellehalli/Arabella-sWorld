import {validateAttachment,attachmentPath,safeAttachmentList} from './attachment-policy.mjs';
const BUCKET='dreamhub-private';
function checkContext(client,ownerId){if(!client||!/^[0-9a-f-]{36}$/i.test(ownerId))throw Error('Sign in to your private vault first.');}
export async function listAttachments(client,ownerId,recordId){
 checkContext(client,ownerId);
 const {data,error}=await client.from('dreamhub_attachments').select('id,record_id,name,mime,size,created_at,deleted_at').eq('owner_id',ownerId).eq('record_id',recordId).is('deleted_at',null).order('created_at',{ascending:false});
 if(error)throw Error('Could not load attachments: '+error.message);
 return safeAttachmentList(data,recordId);
}
export async function uploadAttachment(client,ownerId,recordId,file){
 checkContext(client,ownerId);const meta=validateAttachment(file),id=crypto.randomUUID(),path=attachmentPath(ownerId,recordId,id);
 // Private bucket and RLS policies must be installed first. No public URLs are generated.
 const result=await client.storage.from(BUCKET).upload(path,file,{contentType:meta.mime,upsert:false,cacheControl:'0'});
 if(result.error)throw Error('Private upload failed: '+result.error.message);
 const row={id,owner_id:ownerId,record_id:recordId,name:meta.name,mime:meta.mime,size:meta.size,storage_path:path};
 const inserted=await client.from('dreamhub_attachments').insert(row);
 if(inserted.error){
  const cleanup=await client.storage.from(BUCKET).remove([path]);
  throw Error('Attachment metadata could not be saved. '+(cleanup.error?'The uploaded file needs cleanup; contact support.':'The upload was rolled back.'));
 }
 return {id,...meta};
}
export async function downloadAttachment(client,ownerId,recordId,id){
 checkContext(client,ownerId);
 const {data,error}=await client.from('dreamhub_attachments').select('id,storage_path,name,mime').eq('id',id).eq('owner_id',ownerId).eq('record_id',recordId).is('deleted_at',null).single();
 if(error||!data)throw Error('Attachment not found or access denied.');
 const result=await client.storage.from(BUCKET).download(data.storage_path);
 if(result.error)throw Error('Private download failed: '+result.error.message);
 return {blob:result.data,name:data.name,mime:data.mime};
}
export async function deleteAttachment(client,ownerId,recordId,id){
 checkContext(client,ownerId);
 const {data,error}=await client.from('dreamhub_attachments').select('storage_path').eq('id',id).eq('owner_id',ownerId).eq('record_id',recordId).is('deleted_at',null).single();
 if(error||!data)throw Error('Attachment not found or access denied.');
 const removed=await client.storage.from(BUCKET).remove([data.storage_path]);
 if(removed.error)throw Error('File deletion failed; metadata was kept so you can retry.');
 const updated=await client.from('dreamhub_attachments').update({deleted_at:new Date().toISOString()}).eq('id',id).eq('owner_id',ownerId).eq('record_id',recordId).is('deleted_at',null);
 if(updated.error)throw Error('File removed, but metadata cleanup failed. Please retry cleanup.');
}
