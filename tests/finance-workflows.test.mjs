import test from 'node:test';
import assert from 'node:assert/strict';
import {statementRows,statementReview,forecastCashflow,affordabilityScenario,envelopeUsage} from '../finance-workflows.mjs';
const row=(type,title,data,date='2026-10-01')=>({id:title,type,title,date,data,deletedAt:null});

test('statement CSV parser handles quoted commas, debit/credit columns and rejects malformed rows',()=>{
 const rows=statementRows('Date,Description,Debit,Credit,Category\n2026-10-01,"Coffee, Cafe",4.50,,Food\n2026-10-02,Paycheck,,1200.00,Income');
 assert.equal(rows.length,2);assert.equal(rows[0].direction,'Expense');assert.equal(rows[0].amount,450);assert.equal(rows[0].description,'Coffee, Cafe');assert.equal(rows[1].direction,'Income');assert.equal(rows[1].amount,120000);
 assert.throws(()=>statementRows('Date,Description,Amount\n2026-02-30,Missing date,4.00'),/invalid date/i);
 assert.throws(()=>statementRows('Date,Description,Amount\n2026-10-01,"Unclosed,4.00'),/unclosed/i);
});

test('statement review marks both existing and within-file duplicates before import',()=>{
 const rows=statementRows('date,description,amount\n2026-10-01,Market,-18.22\n2026-10-01,Market,-18.22\n2026-10-02,Pay,120.00');
 const existing=row('transaction','Market',{amount:1822,direction:'Expense',statementFingerprint:rows[0].fingerprint});
 const review=statementReview(rows,[existing]);assert.deepEqual(review.map(x=>x.duplicate),[true,true,false]);assert.deepEqual(review.map(x=>x.selected),[false,false,true]);
});

test('cashflow forecast keeps manual balances, confirmed income, optional estimates and monthly bills distinct',()=>{
 const records=[row('account','Checking',{balance:50000,kind:'Checking'}),row('account','Checking',{balance:49000,kind:'Checking'},'2026-09-01'),row('account','Card',{balance:20000,kind:'Credit card'}),row('plannedIncome','Paycheck',{amount:120000,confidence:'Confirmed',status:'Expected'},'2026-10-15'),row('plannedIncome','Possible client',{amount:30000,confidence:'Expected',status:'Expected'},'2026-10-20'),row('bill','Rent',{amount:90000,cadence:'Monthly',dueDay:1},'2026-11-01')];
 const withExpected=forecastCashflow(records,{from:'2026-10-01',to:'2026-11-05'}),confirmedOnly=forecastCashflow(records,{from:'2026-10-01',to:'2026-11-05',includeExpected:false});
 assert.equal(withExpected.startingBalance,30000);assert.equal(withExpected.points.find(x=>x.date==='2026-10-15').balance,150000);assert.equal(withExpected.points.at(-1).balance,90000);assert.equal(confirmedOnly.points.at(-1).balance,60000);
});

test('envelope use includes only matching personal expense category in the selected window',()=>{const envelope=row('envelope','Food',{category:'Food',limit:25000}),rows=[row('transaction','Lunch',{amount:4500,direction:'Expense',category:'Food'},'2026-10-02'),row('transaction','Gas',{amount:5000,direction:'Expense',category:'Transport'},'2026-10-03'),row('transaction','Dinner',{amount:3500,direction:'Expense',category:'Food'},'2026-09-30')];const status=envelopeUsage(envelope,rows,{from:'2026-10-01',to:'2026-10-31'});assert.equal(status.spentCents,4500);assert.equal(status.remainingCents,20500);});

test('affordability scenario reports monthly obligations, expected income and visible shortfall without changing balances',()=>{
 const records=[row('account','Checking',{balance:45000}),row('bill','Rent',{amount:120000,cadence:'Monthly'}),row('bill','Insurance',{amount:12000,cadence:'Yearly'}),row('envelope','Food',{limit:35000,period:'Monthly'}),row('plannedIncome','Possible work',{amount:100000,confidence:'Expected',status:'Expected'})];
 const result=affordabilityScenario(records,{monthlyIncomeCents:200000,includeExpected:false,oneTimeCostsCents:300000,monthlyBufferCents:20000});assert.equal(result.monthlyBillsCents,121000);assert.equal(result.envelopeLimitsCents,35000);assert.equal(result.monthlyRemainderCents,24000);assert.equal(result.currentAccountBalancesCents,45000);assert.equal(result.monthsToOneTimeGoal,11);assert.equal(affordabilityScenario(records,{monthlyIncomeCents:100000,includeExpected:false}).shortfallCents,56000);
});
