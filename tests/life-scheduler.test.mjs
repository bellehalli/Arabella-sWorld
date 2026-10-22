import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleDay,measurementSeries,weeklyWorkoutDates} from '../life-scheduler.mjs';
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
test('private measurement series ignores nonmeasurement notes',()=>{
 const records=[{type:'note',date:'2026-10-01',data:{weight:230},tags:[],deletedAt:null},{type:'note',date:'2026-10-02',data:{weight:229},tags:['Private body measurements'],deletedAt:null}];
 assert.deepEqual(measurementSeries(records,'weight'),[{date:'2026-10-02',value:229}]);
});
test('workout dates and weekly routine are deterministic',()=>{assert.equal(weeklyWorkoutDates('2026-10-19',7).length,7);assert.equal(movementForDate('2026-10-19').kind,'strength')});
