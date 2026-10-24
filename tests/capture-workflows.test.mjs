import test from 'node:test';import assert from 'node:assert/strict';
import {searchRecords,inboxItems,updateInboxState,snoozeInboxRecord,undoInboxChange,editInboxLabels,convertInboxRecord,undoInboxConversion} from '../capture-workflows.mjs';
import {record} from '../core.mjs';

test('global search filters type, date and labels while excluding private text and metadata',()=>{
 const rows=[record('journal',{id:'public',title:'Garden note',body:'Plant tulips',date:'2026-04-02',tags:['Spring']}),record('journal',{id:'private',title:'Private title',body:'secret tulips',date:'2026-04-03',tags:['PrivateTag'],sensitive:true}),record('task',{id:'old',title:'Tulips',date:'2025-01-01',tags:['Spring']}),record('note',{id:'deleted',title:'Tulips',deletedAt:'2026-04-04T00:00:00Z'})];
 assert.deepEqual(searchRecords(rows,{query:'tulips'}).map(x=>x.id).sort(),['old','public']);
 assert.deepEqual(searchRecords(rows,{query:'private',includePrivateTitles:true}).map(x=>x.id),['private']);
 assert.deepEqual(searchRecords(rows,{query:'secret',includePrivateTitles:true}).map(x=>x.id),[]);
 assert.deepEqual(searchRecords(rows,{query:'privatetag',includePrivateTitles:true}).map(x=>x.id),[]);
 assert.deepEqual(searchRecords(rows,{type:'journal',tag:'spring',from:'2026-04-01',to:'2026-04-30'}).map(x=>x.id),['public']);
 assert.deepEqual(searchRecords(rows,{scopeTypes:['journal'],query:'tulips'}).map(x=>x.id),['public']);
});

test('inbox supports new, sorted and archived states without deleting the record',()=>{
 const note=record('note',{id:'n',title:'Call the dentist',data:{inboxState:'new'}}),idea=record('idea',{id:'i',title:'A garden'}),archived=record('note',{id:'a',title:'Old note',data:{inboxState:'archived'}});
 assert.deepEqual(inboxItems([note,idea,archived]).map(x=>x.id).sort(),['i','n']);
 const sorted=updateInboxState(note,'sorted');assert.deepEqual(inboxItems([sorted,idea,archived],{state:'new'}).map(x=>x.id),['i']);assert.deepEqual(inboxItems([sorted,idea,archived],{state:'sorted'}).map(x=>x.id),['n']);assert.equal(sorted.id,note.id);assert.equal(updateInboxState(sorted,'archived').deletedAt,null);assert.throws(()=>updateInboxState(note,'erase'),/supported inbox action/);
});

test('inbox labels can be added, replaced, and removed without losing other record data',()=>{
 const item=record('note',{title:'A thought',tags:['Inbox','Old'],data:{inboxState:'new',kept:7}});
 assert.deepEqual(editInboxLabels(item,['New','Old'],{mode:'add'}).tags,['Inbox','Old','New']);
 assert.deepEqual(editInboxLabels(item,['Only'],{mode:'replace'}).tags,['Only']);
 const removed=editInboxLabels(item,['Old'],{mode:'remove'});assert.deepEqual(removed.tags,['Inbox']);assert.equal(removed.data.kept,7);
 assert.throws(()=>editInboxLabels(item,['x'.repeat(41)]),/1–20 labels/);
});

test('snoozed inbox items return on their due day and their move can be undone',()=>{
 const item=record('note',{title:'Later thought',tags:['Inbox'],data:{inboxState:'new'}});
 const snoozed=snoozeInboxRecord(item,'2026-11-02','2026-10-24');
 assert.equal(inboxItems([snoozed],{state:'new',today:'2026-10-24'}).length,0);
 assert.equal(inboxItems([snoozed],{state:'new',query:'later',today:'2026-11-02'}).length,1);
 const restored=undoInboxChange(snoozed);assert.equal(restored.data.inboxState,'new');assert.equal(restored.data.inboxSnoozedUntil,'');
 assert.throws(()=>snoozeInboxRecord(item,'2026-02-30','2026-02-01'),/future date/);
});

test('inbox conversions preserve source details, link both records, require expense amount and undo safely',()=>{
 const item=record('note',{id:'source',title:'Remember this',body:'A useful detail',date:'',tags:['Inbox'],sensitive:true,data:{inboxState:'new',custom:{x:1}}});
 assert.throws(()=>convertInboxRecord(item,'transaction'),/expense amount/);
 const result=convertInboxRecord(item,'memory');assert.equal(result.converted.body,item.body);assert.equal(result.converted.date,'');assert.deepEqual(result.converted.links,[item.id]);assert.equal(result.converted.sensitive,true);assert.equal(result.source.data.inboxState,'sorted');
 const undone=undoInboxConversion(result.source,{...result.converted,deletedAt:null});assert.equal(undone.source.data.inboxState,'new');assert(undone.target.deletedAt);
 const expense=convertInboxRecord(item,'transaction',{amountCents:1234});assert.equal(expense.converted.data.amount,1234);assert.equal(expense.converted.data.direction,'Expense');
});
