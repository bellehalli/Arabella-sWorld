import {test} from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';import {blank,record} from '../core.mjs';import {auditRecordLinks,previewLinkRepair} from '../record-integrity.mjs';import {makeVerifiedBackup} from '../record-backup.mjs';import {dryRunRestore} from '../restore-drill.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
test('link audit reports missing, deleted, duplicate and self references without mutation',()=>{
 const state=blank(),a=record('note',{title:'A'}),b=record('task',{title:'B',deletedAt:new Date().toISOString()});a.links=[b.id,'missing',a.id,b.id];state.records=[a,b];const before=JSON.stringify(state),result=auditRecordLinks(state);assert.equal(result.broken.length,1);assert.equal(result.deletedTargets.length,2);assert.equal(result.selfLinks.length,1);assert.equal(result.duplicateLinks.length,1);assert.equal(JSON.stringify(state),before);assert.equal(previewLinkRepair(state).requiresApproval,true);
});
test('verified backup restores exactly to isolated store without touching current records',async()=>{
 const state=blank(),a=record('journal',{title:'First',body:'private'}),b=record('note',{title:'Second',links:[a.id]});state.records=[a,b];const archive=await makeVerifiedBackup(state),result=await dryRunRestore(archive);assert.equal(result.ok,true);assert.equal(result.expectedRecords,2);assert.equal(result.restoredRecords,2);
});
test('restore drill reports orphaned links instead of claiming success',async()=>{
 const state=blank();state.records=[record('note',{links:['missing']})];const result=await dryRunRestore(await makeVerifiedBackup(state));assert.equal(result.ok,false);assert.equal(result.brokenLinks.length,1);
});
