import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interviewPrepLog,validateCareerAsset,dueCareerFollowups,compareCompensationOffers} from '../career-workflows.mjs';
import {record} from '../core.mjs';

test('interview preparation creates a linked, structured private note payload',()=>{
 const application=record('application',{title:'Product Designer',data:{company:'Northstar'}});
 const prep=interviewPrepLog({application,questions:'Tell me about your process.',evidence:'Shipped an accessible redesign.',questionsToAsk:'How does critique work?',reflection:'Ask about team size.',followupDraft:'Thank you for the conversation.',outcome:'Interviewed',date:'2026-11-02'});
 assert.equal(prep.title,'Interview preparation · Northstar');
 assert.deepEqual(prep.links,[application.id]);
 assert.equal(prep.data.careerApplicationId,application.id);
 assert.equal(prep.data.outcome,'Interviewed');
 assert.match(prep.body,/Shipped an accessible redesign/);
 assert(prep.tags.includes('Interview preparation'));
});

test('interview preparation rejects inactive applications, unsupported outcomes, malformed dates and oversized fields',()=>{
 const application=record('application',{title:'A role'});
 assert.throws(()=>interviewPrepLog({application:{...application,deletedAt:'2026-01-01'}}),/active career application/);
 assert.throws(()=>interviewPrepLog({application,outcome:'Sent'}),/supported interview outcome/);
 assert.throws(()=>interviewPrepLog({application,date:'2026-02-30'}),/valid interview date/);
 assert.throws(()=>interviewPrepLog({application,questions:'x'.repeat(5001)}),/5,000 characters/);
});

test('versioned career assets and due follow-ups are validated and dated',()=>{
 assert.deepEqual(validateCareerAsset({title:'Portfolio · Spring',kind:'Portfolio',version:'v3',date:'2026-10-24',url:'https://example.test/work'}).version,'v3');
 assert.throws(()=>validateCareerAsset({title:'Bad link',url:'javascript:alert(1)'}),/HTTP or HTTPS/i);
 const rows=[{id:'a',type:'application',title:'Role A',status:'Interview',deletedAt:null,data:{followup:'2026-10-23'}},{id:'b',type:'application',title:'Role B',status:'Closed',deletedAt:null,data:{followup:'2026-10-23'}}];
 assert.deepEqual(dueCareerFollowups(rows,{today:'2026-10-24'}).map(x=>x.id),['a']);
 assert.throws(()=>dueCareerFollowups(rows,{today:'bad'}),/valid review date/i);
});

test('compensation comparison annualizes salary and hourly offers with visible assumptions',()=>{
 const [salary,hourly]=compareCompensationOffers([{name:'Role A',kind:'salary',amount:52000,hoursPerWeek:40,paidWeeks:52,unpaidWeeks:0,benefits:'Health plan'},{name:'Role B',kind:'hourly',amount:25,hoursPerWeek:40,paidWeeks:48,unpaidWeeks:4}]);
 assert.equal(salary.annualGrossCents,5200000);assert.equal(hourly.annualGrossCents,4800000);assert.equal(hourly.effectiveHourlyCents,2308);assert.equal(salary.benefits,'Health plan');
 assert.throws(()=>compareCompensationOffers([{name:'Same',amount:1},{name:'same',amount:2}]),/unique name/i);
});
