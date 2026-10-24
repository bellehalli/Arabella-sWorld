import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interviewPrepLog} from '../career-workflows.mjs';
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
