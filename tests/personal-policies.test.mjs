import test from 'node:test';import assert from 'node:assert/strict';
import {evaluateSpendingPolicy} from '../personal-policies.mjs';
import {record} from '../core.mjs';
import {upcomingReminders,overdueItems} from '../reminder-engine.mjs';

const policy=(opts={})=>record('policy',{id:'policy',title:'Pause before fun spending',data:{category:'Money',spendingCategory:'Fun',limit:10000,period:'Monthly',review:'2026-04-24',...opts}});
const expense=(id,amount,date='2026-04-10',category='Fun')=>record('transaction',{id,date,data:{amount,direction:'Expense',category}});

test('money guardrail calculates per purchase, weekly and monthly projected totals',()=>{
 const transactions=[expense('a',3000,'2026-04-06'),expense('b',2500,'2026-04-09'),expense('other',9000,'2026-04-09','Home'),expense('old',7000,'2026-03-31')],candidate=expense('new',5000);
 const monthly=evaluateSpendingPolicy(policy(),transactions,{candidate,date:'2026-04-10'});assert.equal(monthly.spent,5500);assert.equal(monthly.projected,10500);assert.equal(monthly.exceeded,true);assert.equal(monthly.remaining,0);
 assert.equal(evaluateSpendingPolicy(policy({period:'Weekly'}),transactions,{candidate,date:'2026-04-10'}).spent,5500);
 assert.equal(evaluateSpendingPolicy(policy({period:'Per purchase',limit:4000}),transactions,{candidate,date:'2026-04-10'}).projected,5000);
});

test('money guardrail ignores candidate duplicates and rejects invalid or non-money policies',()=>{
 const candidate=expense('same',1200),result=evaluateSpendingPolicy(policy(),[candidate],{candidate,date:'2026-04-10'});assert.equal(result.spent,0);assert.equal(result.projected,1200);assert.equal(evaluateSpendingPolicy(policy({limit:0}),[],{date:'2026-04-10'}),null);assert.equal(evaluateSpendingPolicy(record('policy',{data:{category:'Career',limit:1000}}),[],{date:'2026-04-10'}),null);
});

test('policy reminders are opt-in and due reviews appear on the selected local date',()=>{
 const item=policy();assert.equal(upcomingReminders([item],new Date('2026-04-24T18:00:00'),30).length,0);item.data.remind=true;const reminders=upcomingReminders([item],new Date('2026-04-24T18:00:00'),30);assert.equal(reminders.length,1);assert.equal(reminders[0].title,'Review my policy: Pause before fun spending');assert.deepEqual(overdueItems([item],'2026-04-25').map(x=>x.id),['policy']);item.data.remind=false;assert.deepEqual(overdueItems([item],'2026-04-25'),[]);
});
