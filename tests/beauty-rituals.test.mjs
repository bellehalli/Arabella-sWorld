import test from 'node:test';
import assert from 'node:assert/strict';
import {beautyRituals,ritualFor,ritualFrequency,dueRituals,completedRituals} from '../beauty-rituals.mjs';
test('ritual library covers morning, evening, hair, body, oral and life admin',()=>{
 const names=beautyRituals.map(x=>x.id);
 for(const id of ['skin-am','skin-pm','hair-night','hair-week','body-daily','oral-am','oral-pm','monthly'])assert.ok(names.includes(id));
 assert.ok(ritualFor('skin-am').steps.some(x=>x.includes('SPF 30+')));
});
test('daily due rituals and weekly rhythm',()=>{
 const sunday=dueRituals('2026-10-25',[]);
 assert.ok(sunday.some(x=>x.id==='hair-week'));
 assert.ok(!dueRituals('2026-10-26',[]).some(x=>x.id==='hair-week'));
 assert.equal(ritualFrequency('Every evening'),'Evening');
});
test('completed rituals are private dated habits, not product records',()=>{
 const records=[{type:'habit',date:'2026-10-22',deletedAt:null,status:'Done',tags:['Beauty Ritual'],data:{ritualId:'skin-am'}},{type:'beauty',date:'2026-10-22',deletedAt:null,status:'Done',tags:['Beauty Ritual'],data:{ritualId:'skin-pm'}}];
 assert.ok(completedRituals(records,'2026-10-22').has('skin-am'));
 assert.ok(!completedRituals(records,'2026-10-22').has('skin-pm'));
});
