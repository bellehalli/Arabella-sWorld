import test from 'node:test';import assert from 'node:assert/strict';
import {requestedTripTemplates,tripBudget,tripBudgetStatus,monthlySavingNeeded,createTripFund,astroActivitySuggestions} from '../travel-workflows.mjs';
import {record} from '../core.mjs';

test('requested travel drafts include all four named trips without assumed dates or costs',()=>{
 assert.deepEqual(requestedTripTemplates.map(x=>x.key),['europe-christmas-markets','japan','china','indonesia']);assert.equal(requestedTripTemplates[0].place,'Europe · choose cities');
 const zero=tripBudget({});assert.equal(zero.totalCents,0);assert.throws(()=>tripBudget({lodging:-1}),/nonnegative/i);
});

test('trip budgets and savings targets use entered cents only',()=>{
 const trip=record('travel',{title:'Japan trip',data:{budgetItems:{transport:50000,lodging:120000,food:45000,activities:30000,buffer:20000},tripSavedCents:50000,tripSpentCents:10000,endDate:'2027-06-15'}});
 assert.deepEqual(tripBudgetStatus(trip),{budgetCents:265000,savedCents:50000,spentCents:10000,remainingCents:255000,gapCents:215000,fundedPercent:19});
 assert.deepEqual(monthlySavingNeeded(120000,20000,new Date('2026-10-24T12:00:00'),'2027-02-10'),{remainingCents:100000,months:4,monthlyCents:25000});
 const fund=createTripFund(trip,{savedCents:50000,goalDate:'2027-06-15'});assert.equal(fund.data.target,265000);assert.equal(fund.data.amount,50000);assert.deepEqual(fund.links,[trip.id]);
});

test('astrocartography prompts require a user-selected line and avoid predictive claims',()=>{
 const ideas=astroActivitySuggestions({planet:'Venus',place:'Kyoto',interests:'gardens'});assert.equal(ideas.suggestions.length,3);assert.match(ideas.suggestions[0],/gardens/i);assert.match(ideas.note,/does not calculate or verify/i);assert.throws(()=>astroActivitySuggestions({planet:'Unknown'}),/your own astrocartography map/i);
});
