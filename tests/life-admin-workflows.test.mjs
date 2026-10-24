import test from 'node:test';import assert from 'node:assert/strict';
import {createMealPlan,createGroceryItem,groceryRestockNeeded,createAdminFollowup,attachTransportContingency,careFollowupTasks,ingredientNames,createTripReadinessTasks,overdueAdminReview} from '../life-admin-workflows.mjs';
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

test('renewal follow-up produces a linked due task',()=>{const followup=createAdminFollowup({title:'Renew license',date,category:'Renewal'});assert.equal(followup.task.date,date);assert.deepEqual(followup.task.links,[followup.item.id]);});
test('transport details become planner buffers and healthcare follow-ups are idempotent',()=>{
 const event=record('event',{date,data:{category:'Healthcare',time:'14:00',endTime:'15:00'}}),attached=attachTransportContingency(event,{mode:'DDOT',route:'Plan A',backupPlan:'Call family',travelMinutes:40});assert.equal(attached.data.travelMinutes,40);assert.equal(attached.data.transportFallback,'Call family');
 const first=careFollowupTasks([event],event);assert.equal(first.length,3);assert.deepEqual(first[0].links,[event.id]);assert.equal(careFollowupTasks([event,...first],event).length,0);
});

test('trip readiness creates private, linked, dated suggestions once and remains editable',()=>{
 const trip=record('travel',{id:'trip-ready',title:'Japan',date,startDate:'2027-04-20',data:{startDate:'2027-04-20'}}),tasks=createTripReadinessTasks(trip,{today:'2026-10-24'});
 assert.equal(tasks.length,13);assert(tasks.every(x=>x.sensitive&&x.links.includes(trip.id)&&x.date>='2026-10-24'));assert(tasks.some(x=>/visa|entry/i.test(x.title)));assert.equal(createTripReadinessTasks(trip,{existing:tasks,today:'2026-10-24'}).length,0);
 const undated=createTripReadinessTasks(record('travel',{title:'Someday',date:'',data:{}}),{today:'2026-10-24'});assert(undated.every(x=>x.date===''));
});

test('overdue admin review deduplicates linked records, respects dependencies, and excludes completed items',()=>{
 const old='2026-10-20',dueTask=record('task',{id:'overdue-task',title:'Buy supplies',date:old,links:['g1'],data:{}}),grocery=record('grocery',{id:'g1',title:'Cat food',date:old,data:{neededBy:old}}),admin=record('homeAdmin',{id:'admin1',title:'Renew registration',date:old,data:{dueDate:old}}),taskForAdmin=record('task',{title:'Review registration',date:old,links:[admin.id],data:{}}),done=record('task',{title:'Already done',date:old,status:'Done'});
 const review=overdueAdminReview([dueTask,grocery,admin,taskForAdmin,done],'2026-10-24');assert.deepEqual(review.map(x=>x.id),[dueTask.id,taskForAdmin.id]);assert.deepEqual(overdueAdminReview([grocery,{...dueTask,status:'Done'}],'2026-10-24'),[]);assert.deepEqual(overdueAdminReview([grocery,{...dueTask,deletedAt:'2026-10-23T00:00:00Z'}],'2026-10-24').map(x=>x.id),[grocery.id]);
});

test('Day Director stress plan makes meal prep, errands, restocks and travel buffers compete visibly',()=>{
 const date='2026-11-05',appointment=record('event',{title:'Dental appointment',date,status:'Next',data:{category:'Healthcare',time:'11:00',endTime:'12:00',travelMinutes:25,prepMinutes:15,recoveryMinutes:20}}),shift=record('shift',{title:'Evening shift',date,data:{start:'17:00',end:'22:00',shiftStatus:'Confirmed',travelMinutes:30,prepMinutes:20,recoveryMinutes:20}}),tasks=[['Meal prep',35],['Grocery run',40],['Renew paperwork',25],['Restock Freyja',20]].map(([title,minutes])=>record('task',{title,date,minutes,data:{dueMode:'on',priority:'Important'}}));
 const plan=scheduleDay([appointment,shift,...tasks],date,{start:'08:00',end:'23:00',capacityMinutes:120,includeWorkout:false,protectRest:true,timezone:'America/Detroit'}),selected=plan.blocks.filter(x=>x.kind==='task'),deferred=plan.skipped;
 assert(plan.fixed.some(x=>x.id===appointment.id&&x.kind==='appointment'));assert(plan.fixed.some(x=>x.id===appointment.id+'-travel-out'));assert(plan.fixed.some(x=>x.id===shift.id&&x.kind==='work shift'));assert(selected.length>0);assert(selected.length<tasks.length);assert.equal(selected.reduce((n,x)=>n+x.minutes,0),plan.capacityMinutes-plan.remainingCapacity);assert.equal(new Set([...selected,...deferred].map(x=>x.id)).size,tasks.length);assert.deepEqual(plan.conflicts,[]);
});
