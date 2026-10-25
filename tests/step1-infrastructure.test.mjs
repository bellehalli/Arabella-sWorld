import {test} from 'node:test';import assert from 'node:assert/strict';
import {enqueueDraft,pendingDrafts,planReconciliation,removeQueuedDraft} from '../offline-drafts.mjs';
import {validateAttachment,attachmentPath} from '../attachment-policy.mjs';
const owner='12345678-1234-1234-1234-123456789abc';
function storage(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};}
test('attachment rejects executable content and traversal',()=>{assert.throws(()=>validateAttachment({name:'bad.html',size:20,type:'text/html'}));assert.throws(()=>attachmentPath(owner,'../evil','ok'));});
test('attachment accepts ordinary PDFs within limit',()=>assert.equal(validateAttachment({name:'notes.pdf',size:200,type:'application/pdf'}).mime,'application/pdf'));
test('offline queue keeps unsynced data and refuses duplicate overwrites',()=>{const s=storage();enqueueDraft(s,owner,{recordId:'r1',baseVersion:1,body:'My draft'});assert.throws(()=>enqueueDraft(s,owner,{recordId:'r1',baseVersion:1,body:'Replace'}),/already exists/);assert.equal(pendingDrafts(s,owner)[0].body,'My draft');});
test('reconciliation reports conflicts and never applies drafts',()=>{const s=storage();enqueueDraft(s,owner,{recordId:'r1',baseVersion:1,body:'Draft'});assert.equal(planReconciliation(pendingDrafts(s,owner),[{id:'r1',version:2}])[0].status,'conflict');assert.equal(pendingDrafts(s,owner).length,1);removeQueuedDraft(s,owner,'r1');assert.equal(pendingDrafts(s,owner).length,0);});
