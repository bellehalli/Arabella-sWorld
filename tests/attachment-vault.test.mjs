import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AttachmentVault,ATTACHMENT_MAX_BYTES,attachmentPreviewKind,safeAttachmentName,validateAttachmentFile} from '../attachment-vault.mjs';

function file(name,type,content){const bytes=new TextEncoder().encode(content);return {name,type,size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}
const owner={id:'12345678-1234-1234-1234-123456789abc'};

test('accepts supported signed file types and assigns safe preview modes',async()=>{
  const pdf=await validateAttachmentFile(file('statement.pdf','application/pdf','%PDF-1.7\nprobe'));
  assert.equal(pdf.mimeType,'application/pdf');assert.equal(pdf.preview,'pdf');
  const text=await validateAttachmentFile(file('notes.txt','text/plain','private notes'));
  assert.equal(text.preview,'text');
  assert.equal(attachmentPreviewKind('application/vnd.openxmlformats-officedocument.wordprocessingml.document'),'download');
  assert.equal(attachmentPreviewKind('image/svg+xml'),'download');
});

test('rejects unsupported, mislabeled, empty, oversized, and non-UTF8 uploads',async()=>{
  await assert.rejects(validateAttachmentFile(file('active.svg','image/svg+xml','<svg/>')),/Only PDF/);
  await assert.rejects(validateAttachmentFile(file('fake.pdf','application/pdf','not a PDF')),/contents do not match/);
  await assert.rejects(validateAttachmentFile(file('wrong.txt','image/png','text')),/does not match its file extension/);
  await assert.rejects(validateAttachmentFile({name:'empty.txt',type:'text/plain',size:0,arrayBuffer:async()=>new ArrayBuffer(0)}),/empty/);
  await assert.rejects(validateAttachmentFile({name:'large.pdf',type:'application/pdf',size:ATTACHMENT_MAX_BYTES+1,arrayBuffer:async()=>new ArrayBuffer(0)}),/smaller than 15 MB/);
  await assert.rejects(validateAttachmentFile(file('bad.txt','text/plain','a\u0000b')),/contents do not match/);
});

test('filename cleanup removes path separators and control characters',()=>{
  assert.equal(safeAttachmentName('../private\u0000note.txt'),'..privatenote.txt');
  assert.throws(()=>safeAttachmentName('   '),/valid name/);
});

test('metadata-save failure removes the just-uploaded private object',async()=>{
  const calls=[];
  const client={
    storage:{from:bucket=>({upload:async(path)=>{calls.push(['upload',bucket,path]);return {error:null};},remove:async paths=>{calls.push(['remove',bucket,paths[0]]);return {error:null};}})},
    from:()=>({select(){return this;},eq(){return this;},order(){return this;},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject);},insert(){return {select(){return {single:async()=>({data:null,error:{message:'RLS denied'}})};}};}})
  };
  const vault=new AttachmentVault(client,owner);
  await assert.rejects(vault.add(file('note.txt','text/plain','safe text'),'record-1'),/uploaded file was removed/);
  assert.deepEqual(calls.map(call=>call[0]),['upload','remove']);
  assert.equal(calls[0][2].split('/')[0],owner.id);
  assert.equal(calls[0][2],calls[1][2]);
});

test('download refuses metadata for another owner before storage access',async()=>{
  let called=false;
  const client={from(){throw Error('unexpected metadata query');},storage:{from(){called=true;return {};}}};
  const vault=new AttachmentVault(client,owner);
  await assert.rejects(vault.download({id:'x',owner_id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',storage_path:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/x.pdf',byte_size:10,mime_type:'application/pdf'}),/not valid for this account/);
  assert.equal(called,false);
});

test('per-record attachment limit rejects the eleventh file before storage upload',async()=>{
  let uploaded=false;
  const client={
    storage:{from:()=>({upload:async()=>{uploaded=true;return {error:null};}})},
    from:()=>({select(){return this;},eq(){return this;},order(){return this;},then(resolve,reject){return Promise.resolve({data:Array.from({length:10},(_,i)=>({id:String(i)})),error:null}).then(resolve,reject);}})
  };
  const vault=new AttachmentVault(client,owner);
  await assert.rejects(vault.add(file('eleventh.txt','text/plain','safe text'),'record-1'),/already has 10 attachments/);
  assert.equal(uploaded,false);
});
