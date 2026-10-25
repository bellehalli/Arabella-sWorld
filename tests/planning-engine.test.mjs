import test from 'node:test';
import assert from 'node:assert/strict';
import {record} from '../core.mjs';
import {zonedInstants,taskReadiness,validateTaskDependencies,taskDueWindow,flexibleDueStatus,calendarRange,calendarOccurrences,calendarConflicts,recurrenceDates,recurrenceOccurrences,habitTemplate,habitWeekProgress,pauseHabit,weeklyResetSummary,minimumViableDay,focusBreakPlan,validateGoalParent,draftDreamPlan,approveDreamPlan} from '../planning-engine.mjs';

test('task dependencies gate completion candidates, reject missing references and cycles',()=>{
 const a=record('task',{id:'a',status:'Done'}),b=record('task',{id:'b',data:{dependsOn:['a']}}),records=[a,b];assert.equal(taskReadiness(b,records).ready,true);a.status='Next';assert.equal(taskReadiness(b,records).pending[0].id,'a');assert.deepEqual(validateTaskDependencies('b',['a','a'],records),['a']);assert.throws(()=>validateTaskDependencies('a',['b'],records),/cycle/i);assert.throws(()=>validateTaskDependencies('b',['missing'],records),/active saved task/);
});
test('flexible due windows distinguish fixed, before, range and someday tasks',()=>{
 const t=record('task',{date:'2026-10-30',data:{dueMode:'window',dueStart:'2026-10-28',dueEnd:'2026-10-30'}});assert.deepEqual(taskDueWindow(t),{mode:'window',start:'2026-10-28',end:'2026-10-30',flexible:true});assert.equal(flexibleDueStatus(t,'2026-10-27').state,'upcoming');assert.equal(flexibleDueStatus(t,'2026-10-29').state,'due');assert.equal(flexibleDueStatus(t,'2026-10-31').state,'overdue');assert.equal(taskDueWindow(record('task',{date:'',data:{dueMode:'someday'}})).mode,'someday');assert.throws(()=>taskDueWindow(record('task',{date:'2026-02-31'})),/valid/);
});
test('calendar day, Monday week and month ranges are stable across year boundaries',()=>{
 assert.deepEqual(calendarRange('week','2027-01-01'),{from:'2026-12-28',to:'2027-01-03'});assert.deepEqual(calendarRange('month','2028-02-10'),{from:'2028-02-01',to:'2028-02-29'});assert.deepEqual(calendarRange('day','2028-02-10'),{from:'2028-02-10',to:'2028-02-10'});
});
test('timezone resolution handles DST gaps and repeated wall times',()=>{
 assert.deepEqual(zonedInstants('2026-03-08','02:30','America/New_York'),[]);assert.equal(zonedInstants('2026-11-01','01:30','America/New_York').length,2);assert.equal(zonedInstants('2026-03-08','03:30','America/New_York').length,1);
 const a=record('event',{id:'gap',date:'2026-03-08',data:{time:'02:30',endTime:'03:30',timeZone:'America/New_York'}});assert.equal(calendarOccurrences([a],{from:'2026-03-08',to:'2026-03-08'} )[0].dst,'nonexistent');assert.equal(calendarConflicts(calendarOccurrences([a],{from:'2026-03-08',to:'2026-03-08'}))[0].reason,'nonexistent');
});
test('calendar conflict review compares real instants across event timezones and DST folds',()=>{
 const a=record('event',{id:'a',date:'2026-10-24',data:{time:'10:00',endTime:'11:00',timeZone:'America/Detroit'}}),b=record('event',{id:'b',date:'2026-10-24',data:{time:'10:30',endTime:'11:30',timeZone:'America/New_York'}});const items=calendarOccurrences([a,b],{from:'2026-10-24',to:'2026-10-24'});assert.equal(calendarConflicts(items).length,1);const early=record('event',{id:'early-fold',date:'2026-11-01',data:{time:'01:00',endTime:'01:30',timeZone:'America/New_York',timeFold:'earlier'}}),late=record('event',{id:'late-fold',date:'2026-11-01',data:{time:'01:00',endTime:'01:30',timeZone:'America/New_York',timeFold:'later'}});const foldConflicts=calendarConflicts(calendarOccurrences([early,late],{from:'2026-11-01',to:'2026-11-01'}));assert.equal(foldConflicts.length,0);const unresolved=record('event',{id:'unresolved-fold',date:'2026-11-01',data:{time:'01:30',endTime:'02:00',timeZone:'America/New_York'}});assert.equal(calendarConflicts(calendarOccurrences([unresolved],{from:'2026-11-01',to:'2026-11-01'}))[0].reason,'ambiguous');
});
test('recurrence pause, skip, weekday selection and timezone DST behavior are explicit',()=>{
 const rule={id:'r',start:'2026-03-01',frequency:'weekly',weekdays:[0],time:'02:30',timezone:'America/New_York',skippedDates:['2026-03-08']};assert.deepEqual(recurrenceDates(rule,{from:'2026-03-01',to:'2026-03-15'}),['2026-03-01','2026-03-15']);assert.deepEqual(recurrenceDates({...rule,paused:true},{from:'2026-03-01',to:'2026-03-15'}),[]);assert.equal(recurrenceOccurrences({...rule,skippedDates:[]},{from:'2026-03-08',to:'2026-03-08'})[0].dst,'nonexistent');
});
test('habit templates count unique weekly logs and pause without changing history',()=>{
 const t=habitTemplate({name:'Read a little',rhythm:'Weekly',target:3,weekdays:[1,3,5]});const logs=['2026-10-19','2026-10-19','2026-10-21'];assert.deepEqual(habitWeekProgress(t,logs,'2026-10-22'),{from:'2026-10-19',to:'2026-10-25',completed:2,target:3,paused:false,remaining:1});const paused=pauseHabit(t,true,'2026-10-22T12:00:00Z');assert(paused.paused);assert.equal(paused.pausedAt,'2026-10-22T12:00:00Z');assert.equal(t.paused,false);
});
test('weekly reset reports a visible capacity shortfall and minimum day only selects ready work',()=>{
 const prerequisite=record('project',{id:'prep',status:'Next',minutes:20}),ready=record('task',{id:'ready',date:'2026-10-24',minutes:15,favorite:true}),blocked=record('task',{id:'blocked',date:'2026-10-24',minutes:15,favorite:true,data:{dependsOn:['prep']}}),records=[prerequisite,ready,blocked];const summary=weeklyResetSummary(records,{weekOf:'2026-10-20',capacityMinutes:25});assert.equal(summary.overCapacity,true);assert.equal(summary.shortfallMinutes,5);const day=minimumViableDay(records,{date:'2026-10-24',capacityMinutes:20,choose:['ready','blocked']});assert.deepEqual(day.selected.map(x=>x.id),['ready']);assert.deepEqual(day.blocked.map(x=>x.task.id),['blocked']);
});
test('focus break flow offers bounded breaks for a completed focus interval',()=>{assert.deepEqual(focusBreakPlan(25),{focusMinutes:25,breakMinutes:5,suggested:true});assert.equal(focusBreakPlan(50).breakMinutes,10);assert.throws(()=>focusBreakPlan(241),/between/)});
test('dream conversion creates nothing before approval and links approved tasks to the source',()=>{
 const goal=record('goal',{id:'dream',title:'Build a studio'}),draft=draftDreamPlan(goal,{steps:['Choose a niche','Make a portfolio'],milestones:['First client']});assert.equal(draft.approved,false);let id=0;const approved=approveDreamPlan(draft,goal,{makeRecord:(type,values)=>record(type,{id:'created-'+(++id),...values}),firstDueDate:'2026-11-01'});assert.equal(approved.tasks.length,2);assert.deepEqual(approved.tasks[0].links,['dream']);assert.equal(approved.milestones[0].goalId,'dream');assert.throws(()=>approveDreamPlan(draft,goal,{makeRecord:record}),/approval/);
});

test('goal hierarchy allows nesting and rejects self or ancestor cycles',()=>{const a=record('goal',{id:'ga',data:{}}),b=record('goal',{id:'gb',data:{parentGoalId:'ga'}}),goals=[a,b];assert.equal(validateGoalParent('gb','ga',goals),'ga');assert.throws(()=>validateGoalParent('ga','gb',goals),/cycle/i);assert.throws(()=>validateGoalParent('ga','ga',goals),/own parent/i);});
