import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQuoteLines,parseStudioMilestones,studioLedger,checklistItems,updateChecklist} from '../studio-workflows.mjs';

test('Studio quotes use exact cents and reject malformed scope or overflowing totals',()=>{
 const quote=parseQuoteLines('Design | 2 | 1250.25\nBuild | 1 | 3000');
 assert.deepEqual(quote.items.map(x=>x.lineTotalCents),[250050,300000]);assert.equal(quote.totalCents,550050);
 assert.throws(()=>parseQuoteLines('Design | 1.5 | 20'),/whole quantity/i);
 assert.throws(()=>parseQuoteLines('Design | 1 | -1'),/nonnegative/i);
 assert.throws(()=>parseQuoteLines('Design | 1 | 1000000000.00'),/nonnegative amount/i);
});

test('Studio delivery milestones validate dates and stay within accepted scope',()=>{
 const plan=parseStudioMilestones('Discovery | 1000.00 | 2026-11-01\nLaunch | 1500 | 2026-12-01',{maximumCents:250000});
 assert.equal(plan.totalCents,250000);assert.deepEqual(plan.milestones.map(x=>x.status),['Planned','Planned']);
 assert.throws(()=>parseStudioMilestones('Launch | 1 | 2026-02-30'),/valid due date/i);
 assert.throws(()=>parseStudioMilestones('A | 1500 | 2026-11-01\nB | 1500 | 2026-12-01',{maximumCents:250000}),/cannot exceed/i);
});

test('Studio ledger keeps estimates, invoices and received income in separate totals',()=>{
 const records=[{type:'proposal',title:'Estimate',tags:['Studio Estimate'],data:{amount:500000}},{type:'invoice',title:'Invoice',tags:[],data:{amount:300000}},{type:'transaction',title:'Received',tags:[],data:{scope:'Studio',direction:'Income',amount:125000}},{type:'transaction',title:'Personal',tags:[],data:{scope:'Personal',direction:'Income',amount:90000}},{type:'proposal',title:'Deleted quote',tags:['Studio Estimate'],deletedAt:'2026-10-01',data:{amount:1000000}}];
 const ledger=studioLedger(records);assert.equal(ledger.estimateCents,500000);assert.equal(ledger.invoiceCents,300000);assert.equal(ledger.receivedCents,125000);
});

test('Home and Studio checklists reject duplicates and update only selected completion state',()=>{
 const items=checklistItems('Review mobile\nTest contact form');assert.deepEqual(items,['Review mobile','Test contact form']);
 assert.throws(()=>checklistItems('Same\nsame'),/unique/i);
 const record={data:{items,completed:[]}},next=updateChecklist(record,1,true);assert.deepEqual(next.data.completed,[1]);assert.deepEqual(record.data.completed,[]);
 assert.throws(()=>updateChecklist(record,2,true),/no longer exists/i);
});
