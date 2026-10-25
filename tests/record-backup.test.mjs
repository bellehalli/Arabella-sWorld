import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {blank,record} from '../core.mjs';
import {makeVerifiedBackup,verifyBackup,inspectLinks,inventory} from '../record-backup.mjs';
globalThis.crypto??=webcrypto;
test('verified archive survives JSON serialization',async()=>{
 const state=blank();const a=record('journal',{title:'First',body:'Remember',links:[]});const b=record('task',{title:'Second',links:[a.id]});state.records.push(a,b);
 const archive=await makeVerifiedBackup(state);const result=await verifyBackup(JSON.parse(JSON.stringify(archive)));
 assert.equal(result.inventory.records,2);assert.equal(result.inventory.links,1);assert.deepEqual(result.brokenLinks,[]);
});
test('tampering fails before import',async()=>{
 const state=blank();state.records.push(record('journal',{title:'Private'}));const archive=await makeVerifiedBackup(state);
 archive.state.records[0].title='Changed';await assert.rejects(()=>verifyBackup(archive),/checksum mismatch/);
});
test('orphaned record links are reported',()=>{
 const state=blank();state.records.push(record('task',{links:['missing']}));assert.deepEqual(inspectLinks(state).map(x=>x.to),['missing']);assert.equal(inventory(state).links,1);
});
