import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseNextTask} from '../adhd-support.mjs';

const task=(id,overrides={})=>({id,type:'task',title:id,status:'Next',deletedAt:null,date:'',favorite:false,minutes:20,data:{},...overrides});

test('next-step nudge prefers actionable due work and leaves records untouched',()=>{
 const blocked=task('blocked',{date:'2026-10-24',data:{dependsOn:['prerequisite']}});
 const prerequisite=task('prerequisite',{status:'Next'});
 const future=task('future',{date:'2026-10-30',favorite:true});
 const due=task('due',{date:'2026-10-24',data:{nextAction:'Put the form in the envelope'}});
 const rows=[blocked,prerequisite,future,due];
 const before=structuredClone(rows);
 assert.equal(chooseNextTask(rows,'2026-10-24'),due);
 assert.deepEqual(rows,before);
});

test('next-step nudge falls back to ready unscheduled work and ignores deleted or completed tasks',()=>{
 const rows=[task('done',{status:'Done'}),task('deleted',{deletedAt:'2026-10-24T12:00:00Z'}),task('ready')];
 assert.equal(chooseNextTask(rows,'2026-10-24'),rows[2]);
 assert.equal(chooseNextTask([], '2026-10-24'),null);
 assert.throws(()=>chooseNextTask([], 'not-a-date'),/valid planning date/i);
});
