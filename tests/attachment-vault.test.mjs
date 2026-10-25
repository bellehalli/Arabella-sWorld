import {test} from 'node:test';import assert from 'node:assert/strict';
import {uploadAttachment,downloadAttachment,deleteAttachment,listAttachments,AttachmentVault,ATTACHMENT_BUCKET,validateAttachmentFile} from '../attachment-vault.mjs';
const owner='12345678-1234-4234-9234-123456789abc';
const pdfPrefix=new TextEncoder().encode('%PDF-1.7\\n');
const pdfFile=(overrides={})=>{const bytes=new Uint8Array(20);bytes.set(pdfPrefix);return {name:'memo.pdf',size:20,type:'application/pdf',arrayBuffer:async()=>bytes.buffer,...overrides};};
function mock({uploadError=null,insertError=null,removeError=null,deleteError=null}={}){
 const calls=[];const storage={upload:async(path,file)=>{calls.push(['upload',path]);return {error:uploadError};},remove:async(paths)=>{calls.push(['remove',paths]);return {error:removeError};},download:async(path)=>{calls.push(['download',path]);return {data:new Blob(['hello']),error:null}}};
 const row={id:'file1',record_id:'record1',file_name:'memo.pdf',mime_type:'application/pdf',byte_size:20,storage_path:owner+'/file1.pdf',created_at:'2026-10-25T12:00:00Z'};
 const query={eq(){return this;},order:async()=>({data:[row],error:null}),single:async()=>({data:row,error:null})};
 return {calls,row,client:{storage:{from:bucket=>{calls.push(['bucket',bucket]);return storage;}},from:()=>({...query,select:()=>query,insert:async data=>{calls.push(['insert',data]);return {error:insertError};},delete:()=>({eq:async()=>({error:deleteError})})})}};
}
test('successful upload uses the private bucket and owner-scoped metadata',async()=>{const {client,calls}=mock();const item=await uploadAttachment(client,owner,'record1',pdfFile());assert.equal(calls[0][0],'bucket');assert.equal(calls[0][1],ATTACHMENT_BUCKET);assert.equal(calls[1][0],'upload');assert.ok(calls[1][1].startsWith(owner+'/'));assert.equal(calls[2][0],'insert');assert.equal(item.file_name,'memo.pdf');});
test('metadata failure rolls back uploaded object',async()=>{const {client,calls}=mock({insertError:{message:'denied'}});await assert.rejects(()=>uploadAttachment(client,owner,'record1',pdfFile()),/rolled back/);assert.deepEqual(calls.filter(x=>['upload','insert','remove'].includes(x[0])).map(x=>x[0]),['upload','insert','remove']);});
test('delete failure preserves metadata when storage removal fails',async()=>{const {client,calls}=mock({removeError:{message:'no'}});await assert.rejects(()=>deleteAttachment(client,owner,'record1','file1'),/File deletion failed/);assert.equal(calls.some(x=>x[0]==='remove'),true);});
test('private download returns the authorized file blob',async()=>{const {client}=mock();const file=await downloadAttachment(client,owner,'record1','file1');assert.equal(await file.blob.text(),'hello');});
test('list returns owner-scoped metadata',async()=>{const {client}=mock();const rows=await listAttachments(client,owner,'record1');assert.equal(rows.length,1);assert.equal(rows[0].file_name,'memo.pdf');});
test('vault class provides the app interface and rejects unsafe files',async()=>{const {client,row}=mock();const vault=new AttachmentVault(client,{id:owner});assert.equal((await vault.list())[0].id,row.id);assert.equal(await (await vault.download(row)).text(),'hello');await assert.rejects(()=>validateAttachmentFile({name:'page.svg',size:20,type:'image/svg+xml',arrayBuffer:async()=>new ArrayBuffer(20)}),/Unsupported/);});
test('attachment validation checks bytes for each allowed file type',async()=>{
 const enc=new TextEncoder();
 const samples=[
  ['memo.pdf','application/pdf',enc.encode('%PDF-1.7')],
  ['photo.jpg','image/jpeg',Uint8Array.of(0xff,0xd8,0xff,0x00)],
  ['photo.png','image/png',Uint8Array.of(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a)],
  ['photo.webp','image/webp',enc.encode('RIFF0000WEBP')],
  ['notes.txt','text/plain',enc.encode('hello')],
  ['memo.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',Uint8Array.of(0x50,0x4b,0x03,0x04)]
 ];
 for(const [name,type,prefix] of samples){const bytes=new Uint8Array(20);bytes.set(prefix);const file={name,type,size:bytes.byteLength,arrayBuffer:async()=>bytes.buffer};assert.equal((await validateAttachmentFile(file)).mime_type,type,`valid signature should pass for ${name}`);}
});
test('attachment validation rejects mislabeled file bytes and mismatched sizes',async()=>{
 const wrong=new Uint8Array(20);wrong.set(new TextEncoder().encode('<html>'));
 await assert.rejects(()=>validateAttachmentFile(pdfFile({arrayBuffer:async()=>wrong.buffer})),/contents do not match/);
 await assert.rejects(()=>validateAttachmentFile(pdfFile({size:19})),/reported size/);
});
