import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateWorkflowRecord,migrateWorkflowState,validateWorkflowRecord} from '../workflow-schemas.mjs';
import {blank,record,Store,validate} from '../core.mjs';

test('versioned workflow migration preserves legacy entries without inventing confirmation or pay',()=>{
 const shift=migrateWorkflowRecord({id:'shift',type:'shift',title:'Restaurant',date:'2026-10-25',data:{start:'16:00',end:'22:00'}});
 assert.equal(shift.data.workflowVersion,1);assert.equal(shift.data.shiftStatus,'Tentative');assert.equal(shift.data.breakMinutes,0);assert.equal(shift.data.start,'16:00');
 const pay=migrateWorkflowRecord({id:'pay',type:'earnings',title:'Old earnings',date:'2026-10-25',data:{amount:4000}});
 assert.equal(pay.data.payoutStatus,'Unverified');assert.equal(pay.data.netPaidCents,null);assert.equal(pay.data.amount,4000);
 const lead=migrateWorkflowRecord({id:'lead',type:'lead',title:'Prospect',data:{score:7}});
 assert.equal(lead.data.pipelineStage,'sourced');assert.equal(lead.data.contactVerified,false);assert.equal(lead.data.score,7);
 assert.deepEqual(migrateWorkflowRecord(shift),shift);
});

test('workflow migrations are additive and idempotent across store load and save',async()=>{
 const legacy=blank();legacy.records=[record('shift',{id:'legacy-shift',data:{start:'17:00',end:'21:00'}})];
 const storage={value:JSON.stringify(legacy),getItem(){return this.value},setItem(k,v){this.value=v;}};
 const store=new Store(storage);assert.equal(store.state.records[0].data.workflowVersion,1);assert.equal(store.state.records[0].data.shiftStatus,'Tentative');
 await store.update(s=>s.records[0].data.transitMode='bus');
 const saved=JSON.parse(storage.value);assert.equal(saved.records[0].data.transitMode,'bus');assert.equal(saved.records[0].data.workflowVersion,1);assert.doesNotThrow(()=>validate(saved));
});

test('versioned workflow validation rejects impossible payroll amounts and invalid lead stages',()=>{
 assert.throws(()=>validateWorkflowRecord({type:'earnings',data:{workflowVersion:1,wagesCents:-1,cashTipsCents:null,cardTipsCents:null,tipOutCents:null,withheldCents:null,netPaidCents:null}}),/nonnegative whole cents/i);
 assert.throws(()=>validateWorkflowRecord({type:'lead',data:{workflowVersion:1,pipelineStage:'sent-money',contactVerified:false,suppressContact:false}}),/invalid pipeline stage/i);
 assert.throws(()=>validateWorkflowRecord({type:'studioOutreach',data:{workflowVersion:1,sendApproved:true,optedOut:false,bounced:false}}),/unsent/i);
});


test('meal and grocery records migrate with bounded, noninvented workflow fields',()=>{
 const migrated=migrateWorkflowRecord(record('mealPlan',{title:'Dinner',data:{}}));assert.equal(migrated.data.workflowVersion,1);assert.equal(migrated.data.mealType,'Dinner');assert.deepEqual(migrated.data.ingredients,[]);assert.equal(migrated.data.servings,1);
 const grocery=migrateWorkflowRecord(record('grocery',{title:'Rice',data:{category:'Pantry',onHand:2,reorderAt:1}}));assert.equal(grocery.data.checked,false);assert.equal(grocery.data.quantity,'');assert.equal(grocery.data.unit,'');assert.equal(grocery.data.neededBy,'');assert.equal(validateWorkflowRecord(grocery),true);
 const invalid={...grocery,data:{...grocery.data,onHand:-1}};assert.throws(()=>validateWorkflowRecord(invalid),/Grocery stock fields/i);
 assert.throws(()=>validateWorkflowRecord({...grocery,data:{...grocery.data,neededBy:'2026-02-30'}}),/date is invalid/i);
});
