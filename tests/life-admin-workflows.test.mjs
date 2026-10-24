import test from 'node:test';import assert from 'node:assert/strict';
import {createMealPlan,createGroceryItem,groceryRestockNeeded,createAdminFollowup,createCareCoverage,attachTransportContingency,careFollowupTasks,ingredientNames} from '../life-admin-workflows.mjs';
import {record} from '../core.mjs';import {scheduleDay} from '../life-scheduler.mjs';
const date='2026-11-05';

test('meal plans normalize duplicate ingredients and optionally create a dated Day Director task',()=>{
 const result=createMealPlan({title:'Jacob birthday breakfast',date,mealType:'Breakfast',ingredients:'Eggs, orange juice\neggs',servings:2,prepMinutes:35,includePrepTask:true});
 assert.deepEqual(result.ingredients,['Eggs','orange juice']);assert.equal(result.task.date,date);assert.deepEqual(result.task.links,[result.meal.id]);assert.equal(result.meal.sensitive,true);
 assert.throws(()=>createMealPlan({title:'',date}),/meal name/i);assert.throws(()=>ingredientNames(Array(61).fill('item').join(',')),/60 ingredients/i);
});

test('grocery inventory supports stock thresholds and date validation',()=>{
 const item=createGroceryItem({title:'Freyja food',category:'Pet',quantity:'2 cans',needBy:date,onHand:1,reorderAt:2});assert.equal(groceryRestockNeeded(item),true);assert.equal(groceryRestockNeeded({...item,data:{...item.data,checked:true}}),false);assert.throws(()=>createGroceryItem({title:'Milk',needBy:'2026-02-31'}),/valid needed-by/i);
});

test('renewal follow-up produces a linked due task and confirmed caregiving block',()=>{
 const admin=createAdminFollowup({title:'Renew transit pass',date,category:'Renewal',details:'Check eligibility'});assert.deepEqual(admin.task.links,[admin.item.id]);assert.equal(admin.task.date,date);
 const coverage=createCareCoverage({date,start:'08:00',end:'12:00',helper:'Auntie',travelMinutes:20});assert.equal(coverage.status,'Confirmed');assert.equal(coverage.data.category,'Caregiving');
 assert.throws(()=>createCareCoverage({date,start:'not time',end:'12:00'}),/valid coverage date/i);
});

test('transport details become planner buffers and healthcare follow-ups are idempotent',()=>{
 const event=record('event',{date,data:{category:'Healthcare',time:'14:00',endTime:'15:00'}}),attached=attachTransportContingency(event,{mode:'DDOT',route:'Plan A',backupPlan:'Call family',travelMinutes:40});assert.equal(attached.data.travelMinutes,40);assert.equal(attached.data.transportFallback,'Call family');
 const first=careFollowupTasks([event],event);assert.equal(first.length,3);assert.deepEqual(first[0].links,[event.id]);assert.equal(careFollowupTasks([event,...first],event).length,0);
});


test('confirmed coverage and an appointment contingency are fixed blocks for the Day Director',()=>{
 const coverage=createCareCoverage({date,start:'08:00',end:'09:00',travelMinutes:15}),appointment=record('event',{title:'Dental visit',date,data:{category:'Healthcare',time:'11:00',endTime:'12:00',travelMinutes:25,prepMinutes:10,recoveryMinutes:15}});
 const plan=scheduleDay([coverage,appointment],date,{start:'07:00',end:'15:00',protectRest:false,includeWorkout:false,capacityMinutes:0,timezone:'America/Detroit'});
 assert(plan.fixed.some(x=>x.id===coverage.id&&x.kind==='caregiving'));assert(plan.fixed.some(x=>x.id===appointment.id&&x.kind==='appointment'));assert(plan.fixed.some(x=>x.id===appointment.id+'-travel-out'&&x.kind==='travel'));assert(plan.fixed.some(x=>x.id===appointment.id+'-prep'&&x.kind==='preparation'));
});
