export const ATTACHMENT_BUCKET = 'dreamhub-attachments';
export const ATTACHMENT_TABLE = 'dreamhub_attachments';
export const ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;
export const ATTACHMENT_MAX_PER_RECORD = 10;
const TYPES = Object.freeze({
  pdf: {mimeType:'application/pdf', preview:'pdf'},
  jpg: {mimeType:'image/jpeg', preview:'image'},
  jpeg: {mimeType:'image/jpeg', preview:'image'},
  png: {mimeType:'image/png', preview:'image'},
  webp: {mimeType:'image/webp', preview:'image'},
  txt: {mimeType:'text/plain', preview:'text'},
  docx: {mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', preview:'download'}
});
const encoder = new TextEncoder();

export function safeAttachmentName(value) {
  const name = String(value ?? '').normalize('NFKC').replace(/[\\/\u0000-\u001f\u007f]/g, '').trim();
  if (!name || name.length > 180 || name === '.' || name === '..') throw Error('Choose a file with a valid name under 180 characters.');
  return name;
}

function fileExtension(name) {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) throw Error('Choose a PDF, JPG, PNG, WebP, TXT, or DOCX file.');
  return name.slice(dot + 1).toLowerCase();
}

export async function validateAttachmentFile(file) {
  if (!file || typeof file.arrayBuffer !== 'function' || !Number.isSafeInteger(file.size)) throw Error('Choose a file to upload.');
  if (file.size < 1) throw Error('That file is empty. Choose a file with content.');
  if (file.size > ATTACHMENT_MAX_BYTES) throw Error('Choose a file smaller than 15 MB.');
  const fileName = safeAttachmentName(file.name);
  const extension = fileExtension(fileName);
  const type = TYPES[extension];
  if (!type) throw Error('Only PDF, JPG, PNG, WebP, TXT, or DOCX files are supported.');
  if (file.type && file.type !== type.mimeType && !(extension === 'jpg' && file.type === 'image/pjpeg')) throw Error('The selected file type does not match its file extension.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ascii = (start, length) => String.fromCharCode(...bytes.slice(start, start + length));
  const valid = extension === 'pdf' ? ascii(0, 5) === '%PDF-'
    : extension === 'jpg' || extension === 'jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : extension === 'png' ? ascii(0, 8) === '\x89PNG\r\n\x1a\n'
    : extension === 'webp' ? ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP'
    : extension === 'txt' ? (() => { try { new TextDecoder('utf-8', {fatal:true}).decode(bytes); return !bytes.includes(0); } catch { return false; } })()
    : extension === 'docx' ? ascii(0, 4) === 'PK\x03\x04'
    : false;
  if (!valid) throw Error('The file contents do not match a supported file type.');
  const mimeType = type.mimeType;
  return {fileName, extension, mimeType, preview:type.preview, byteSize:file.size};
}

function checkOwner(client, user) {
  if (!client?.from || !client?.storage || !user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) throw Error('Sign in to your invited DreamHub account to use the attachment vault.');
}

export class AttachmentVault {
  constructor(client, user) { checkOwner(client, user); this.client=client; this.user=user; }

  async list({recordId}={}) {
    let query=this.client.from(ATTACHMENT_TABLE).select('id,owner_id,record_id,file_name,mime_type,byte_size,storage_path,created_at').eq('owner_id',this.user.id).order('created_at',{ascending:false});
    if (recordId) query=query.eq('record_id',String(recordId));
    const {data,error}=await query;
    if (error) throw Error('Your private attachments could not be loaded. '+error.message);
    return Array.isArray(data)?data:[];
  }

  async add(file, recordId) {
    const metadata=await validateAttachmentFile(file);
    const linkedId=String(recordId??'').trim();
    if (!linkedId || linkedId.length>128) throw Error('Choose a DreamHub record to attach this file to.');
    const existing=await this.list({recordId:linkedId});
    if (existing.length>=ATTACHMENT_MAX_PER_RECORD) throw Error('This record already has 10 attachments. Remove one before adding another.');
    const id=crypto.randomUUID(), path=`${this.user.id}/${id}.${metadata.extension}`;
    const {error:uploadError}=await this.client.storage.from(ATTACHMENT_BUCKET).upload(path,file,{contentType:metadata.mimeType,upsert:false,cacheControl:'0'});
    if (uploadError) throw Error('The private file upload failed. '+uploadError.message);
    const row={id,owner_id:this.user.id,record_id:linkedId,file_name:metadata.fileName,mime_type:metadata.mimeType,byte_size:metadata.byteSize,storage_path:path};
    const {data,error}=await this.client.from(ATTACHMENT_TABLE).insert(row).select('id,owner_id,record_id,file_name,mime_type,byte_size,storage_path,created_at').single();
    if (error) {
      const cleanup=await this.client.storage.from(ATTACHMENT_BUCKET).remove([path]);
      if (cleanup.error) throw Error('The file uploaded but its private attachment record could not be saved or cleaned up. Contact the project owner before retrying.');
      throw Error('The private attachment record could not be saved. The uploaded file was removed. '+error.message);
    }
    return data;
  }
  async download(attachment) {
    this.#assertOwnedPath(attachment);
    const {data,error}=await this.client.storage.from(ATTACHMENT_BUCKET).download(attachment.storage_path);
    if (error || !data) throw Error('The private file could not be downloaded. '+(error?.message||''));
    if (data.size!==attachment.byte_size || data.type&&data.type!==attachment.mime_type) throw Error('The downloaded file did not match its saved attachment details.');
    await validateAttachmentFile({name:attachment.file_name,type:attachment.mime_type,size:data.size,arrayBuffer:()=>data.arrayBuffer()});
    return data;
  }

  async remove(attachment) {
    this.#assertOwnedPath(attachment);
    const {error:storageError}=await this.client.storage.from(ATTACHMENT_BUCKET).remove([attachment.storage_path]);
    if (storageError) throw Error('The private file could not be deleted from storage. '+storageError.message);
    const {error:rowError}=await this.client.from(ATTACHMENT_TABLE).delete().eq('id',attachment.id).eq('owner_id',this.user.id);
    if (rowError) throw Error('The file is gone, but its attachment record needs cleanup. Retry deletion from this page. '+rowError.message);
  }

  #assertOwnedPath(attachment) {
    if (!attachment || attachment.owner_id!==this.user.id || typeof attachment.id!=='string' || typeof attachment.storage_path!=='string' || !attachment.storage_path.startsWith(`${this.user.id}/`) || !Number.isSafeInteger(attachment.byte_size) || attachment.byte_size<1 || attachment.byte_size>ATTACHMENT_MAX_BYTES || !Object.values(TYPES).some(type=>type.mimeType===attachment.mime_type)) throw Error('That attachment is not valid for this account.');
  }
}

export function attachmentPreviewKind(mimeType) {
  return Object.values(TYPES).find(type=>type.mimeType===mimeType)?.preview||'download';
}
