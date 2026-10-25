import {test} from 'node:test';import assert from 'node:assert/strict';
import {uploadAttachment,downloadAttachment,deleteAttachment,listAttachments} from '../attachment-vault.mjs';
const owner='12345678-1234-1234-1234-123456789abc';
function mock({uploadError=null,insertError=null,removeError=null}={}){
 const calls=[];const storage={upload:async(path,file)=>{calls.push(['upload',path]);return {error:uploadError};},remove:async(paths)=>{calls.push(['remove',paths]);return {error:removeError};},download:async(path)=>{calls.push(['download',path]);return {data:new Blob(['hello']),error:null}}};
 const row={id:'file1',record_id:'record1',name:'memo.pdf',mime:'application/pdf',size:20,storage_path:owner+'/record1/file1'};
 const query={eq(){return this;},is(){return this;},order:async()=>({data:[row],error:null}),single:async()=>({data:row,error:null})};
 return {calls,client:{storage:{from:()=>storage},from:()=>({...query,select:()=>query,insert:async data=>{calls.push(['insert',data]);return {error:insertError};},update:()=>({...query,eq(){return this;},is:async()=>({error:null})})})}};
}
test('successful upload writes owner-scoped object and metadata',async()=>{const {client,calls}=mock();await uploadAttachment(client,owner,'record1',{name:'memo.pdf',size:20,type:'application/pdf'});assert.equal(calls[0][0],'upload');assert.ok(calls[0][1].startsWith(owner+'/record1/'));assert.equal(calls[1][0],'insert');});
test('metadata failure rolls back uploaded object',async()=>{const {client,calls}=mock({insertError:{message:'denied'}});await assert.rejects(()=>uploadAttachment(client,owner,'record1',{name:'memo.pdf',size:20,type:'application/pdf'}),/rolled back/);assert.deepEqual(calls.map(x=>x[0]),['upload','insert','remove']);});
test('delete failure preserves metadata',async()=>{const {client,calls}=mock({removeError:{message:'no'}});await assert.rejects(()=>deleteAttachment(client,owner,'record1','file1'),/File deletion failed/);assert.equal(calls.some(x=>x[0]==='remove'),true);});
test('private download returns a Blob',async()=>{const {client}=mock();const file=await downloadAttachment(client,owner,'record1','file1');assert.equal(await file.blob.text(),'hello');});
test('list returns only matching records',async()=>{const {client}=mock();const rows=await listAttachments(client,owner,'record1');assert.equal(rows.length,1);});
