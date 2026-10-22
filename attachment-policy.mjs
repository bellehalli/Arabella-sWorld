// Client-side file preflight. This is not a substitute for server-side validation.
export const MAX_ATTACHMENT_BYTES=10*1024*1024;
export const ALLOWED_MIME=new Set(['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','text/markdown']);
export function validateAttachment(file){
 if(!file||typeof file.name!=='string'||!Number.isSafeInteger(file.size)||file.size<0)throw Error('Invalid file.');
 if(file.size>MAX_ATTACHMENT_BYTES)throw Error('Attachment exceeds the 10 MB limit.');
 if(!ALLOWED_MIME.has(file.type))throw Error('Unsupported file type. Choose an image, PDF or plain-text document.');
 if(file.name.length>180||/[\\/\u0000-\u001f]/.test(file.name))throw Error('Unsafe attachment filename.');
 return {name:file.name,size:file.size,mime:file.type};
}
export function attachmentPath(ownerId,recordId,attachmentId){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const id=/^[a-zA-Z0-9_-]{1,100}$/;
 if(!uuid.test(ownerId)||!id.test(recordId)||!id.test(attachmentId))throw Error('Invalid attachment identity.');
 return ownerId+'/'+recordId+'/'+attachmentId;
}
export function safeAttachmentList(rows,recordId){
 return (rows||[]).filter(x=>x&&x.record_id===recordId&&!x.deleted_at).map(x=>({id:x.id,name:x.name,mime:x.mime,size:x.size,createdAt:x.created_at}));
}
