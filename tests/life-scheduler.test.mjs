import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleDay,validateDayPlan,measurementSeries,weeklyWorkoutDates} from '../life-scheduler.mjs';
import {movementForDate} from '../movement-garden.mjs';
const base={deletedAt:null,status:'Next',data:{}};
test('scheduler avoids existing appointments with buffers',()=>{
 const records=[{...base,id:'meeting',type:'event',title:'Appointment',date:'2026-10-23',data:{time:'10:00',endTime:'11:00'}},{...base,id:'task1',type:'task',title:'Client follow-up',date:'2026-10-22',minutes:30,favorite:true}];
 const p=scheduleDay(records,'2026-10-23',{start:'10:00',end:'13:00',buffer:10,includeWorkout:false});
 assert.equal(p.blocks.length,1);assert.ok(p.blocks[0].start>=670);
});
test('scheduler flags overlapping appointments',()=>{
 const events=[{...base,id:'1',type:'event',title:'A',date:'2026-10-23',data:{time:'10:00',endTime:'11:00'}},{...base,id:'2',type:'event',title:'B',date:'2026-10-23',data:{time:'10:30',endTime:'11:30'}}];
 assert.equal(scheduleDay(events,'2026-10-23').conflicts.length,1);
});
test('Day Director protects confirmed shifts, commute, preparation, recovery, and tentative-shift choice',()=>{
 const date='2026-10-23',records=[{...base,id:'shift',type:'shift',title:'Serving shift',date,data:{start:'12:00',end:'16:00',shiftStatus:'Confirmed',travelMinutes:30,prepMinutes:30,recoveryMinutes:30}},{...base,id:'maybe',type:'shift',title:'Possible shift',date,data:{start:'09:00',end:'10:00',shiftStatus:'Tentative'}},{...base,id:'task',type:'task',title:'Send proposal',date,minutes:45,favorite:true,data:{dueMode:'on',priority:'Important'}}];
 const p=scheduleDay(records,date,{start:'09:00',end:'18:00',includeWorkout:false,travel:20,capacityMinutes:120,protectRest:false});
 assert.equal(p.unconfirmedShifts[0].id,'maybe');assert.ok(p.fixed.some(x=>x.title==='Get ready for Serving shift'));assert.ok(p.fixed.some(x=>x.title==='Travel to Serving shift'));assert.ok(p.fixed.some(x=>x.title==='Recover after Serving shift'));assert.equal(p.blocks[0].id,'task');assert.ok(p.blocks[0].end<=660||p.blocks[0].start>=1030);assert.equal(records.find(x=>x.id==='task').date,date);
});
test('Day Director accounts for caregiving, all-day commitments, task dependencies, deadlines, and focus capacity',()=>{
 const date='2026-10-23',records=[{...base,id:'care',type:'event',title:'Caregiving',date,data:{category:'Caregiving',time:'11:00',endTime:'13:00'}},{...base,id:'all',type:'event',title:'All day appointment',date,data:{category:'Healthcare'}},{...base,id:'blocked',type:'task',title:'Blocked step',date,minutes:20,data:{dueMode:'on',dependsOn:['missing']}},{...base,id:'later',type:'task',title:'Tomorrow only',date:'2026-10-24',minutes:30,data:{dueMode:'on'}}];
 const p=scheduleDay(records,date,{start:'09:00',end:'18:00',includeWorkout:false,capacityMinutes:60,protectRest:false});
 assert.ok(p.fixed.some(x=>x.kind==='caregiving'));assert.ok(p.fixed.some(x=>x.kind==='all-day commitment'));assert.equal(p.blocked[0].id,'blocked');assert.equal(p.blocks.some(x=>x.id==='later'),false);assert.equal(p.blocks.length,0);assert.match(p.blocked[0].reason,/prerequisite/i);
});
test('adjusted Day Director blocks reject overlap with fixed commitments and each other',()=>{
 const fixed=[{id:'appointment',title:'Appointment',start:600,end:660}];
 assert.equal(validateDayPlan([{id:'a',title:'Focus',start:630,end:690}],fixed).length,1);
 assert.equal(validateDayPlan([{id:'a',title:'One',start:500,end:540},{id:'b',title:'Two',start:530,end:570}],[]).length,1);
 assert.throws(()=>validateDayPlan([{id:'a',title:'Bad',start:700,end:690}],[]),/valid start and end/i);
});

test('Day Director converts event timezones and blocks ambiguous or nonexistent daylight-saving times',()=>{
 const base={id:'event',type:'event',title:'Appointment',date:'2026-06-12',status:'Next',data:{time:'09:00',endTime:'10:00',timeZone:'America/Los_Angeles',category:'Personal'}};
 const converted=scheduleDay([base],'2026-06-12',{start:'10:00',end:'18:00',timezone:'America/Detroit',includeWorkout:false,capacityMinutes:0,protectRest:false});
 assert.equal(converted.appointments[0].start,12*60);
 assert.equal(converted.appointments[0].end,13*60);
 const gap=scheduleDay([{...base,date:'2026-03-08',data:{...base.data,time:'02:30',endTime:'03:30'}}],'2026-03-08',{timezone:'America/Los_Angeles',includeWorkout:false,capacityMinutes:0,protectRest:false});
 assert.equal(gap.timeIssues[0].reason,'nonexistent local time');
 assert.ok(gap.fixed.some(x=>x.kind==='time review'&&x.start===0&&x.end===1440));
 const repeated={...base,date:'2026-11-01',data:{...base.data,time:'01:30',endTime:'02:30'}};
 const unresolved=scheduleDay([repeated],'2026-11-01',{timezone:'America/Los_Angeles',includeWorkout:false,capacityMinutes:0,protectRest:false});
 assert.equal(unresolved.timeIssues[0].reason,'ambiguous repeated local time');
 const resolved=scheduleDay([{...repeated,data:{...repeated.data,timeFold:'later'}}],'2026-11-01',{timezone:'America/Los_Angeles',includeWorkout:false,capacityMinutes:0,protectRest:false});
 assert.equal(resolved.timeIssues.length,0);
 assert.equal(resolved.appointments[0].start,90);
});
test('private measurement series ignores nonmeasurement notes',()=>{
 const records=[{type:'note',date:'2026-10-01',data:{weight:230},tags:[],deletedAt:null},{type:'note',date:'2026-10-02',data:{weight:229},tags:['Private body measurements'],deletedAt:null}];
 assert.deepEqual(measurementSeries(records,'weight'),[{date:'2026-10-02',value:229}]);
});
test('workout dates and weekly routine are deterministic',()=>{assert.equal(weeklyWorkoutDates('2026-10-19',7).length,7);assert.equal(movementForDate('2026-10-19').kind,'strength')});
