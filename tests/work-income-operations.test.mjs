import test from 'node:test';import assert from 'node:assert/strict';
import {record} from '../core.mjs';
import {createPayRecords,expectedShiftEarnings,payrollSummary,shiftDurationMinutes,validateActualPay} from '../work-income-operations.mjs';

test('shift duration handles overnight work and subtracts only entered unpaid breaks',()=>{
 const shift=record('shift',{id:'s',title:'Closing shift',data:{start:'18:00',end:'01:00',breakMinutes:30,hourlyRateCents:1800}});
 assert.equal(shiftDurationMinutes(shift),390);assert.deepEqual(expectedShiftEarnings(shift),{minutesWorked:390,expectedWagesCents:11700,tipsEstimated:false});
 assert.throws(()=>shiftDurationMinutes({...shift,data:{start:'18:00',end:'17:00',breakMinutes:0}}),/1–960 minutes/i);
});

test('actual pay is separate from expected estimates and only received net pay becomes personal income',()=>{
 const shift=record('shift',{id:'s',title:'Dinner shift',date:'2026-10-24',data:{start:'17:00',end:'23:00',shiftStatus:'Confirmed'}}),input={wagesCents:9000,cashTipsCents:2500,cardTipsCents:7000,tipOutCents:1500,withheldCents:1200,netPaidCents:null,payoutStatus:'Expected'};
 const expected=createPayRecords({shift,payrollId:'period-1',payPeriod:'Oct 19–25',...input},[]);assert.equal(expected.transaction,null);assert.equal(expected.earningsRecord.data.grossCents,18500);assert.equal(expected.earningsRecord.data.expectedNetCents,15800);
 const received=createPayRecords({shift,payrollId:'period-1',payPeriod:'Oct 19–25',paidDate:'2026-10-27',...input,netPaidCents:15800,payoutStatus:'Received'},[]);assert.equal(received.transaction.data.amount,15800);assert.equal(received.transaction.data.scope,'Personal');assert.equal(received.transaction.date,'2026-10-27');
 assert.throws(()=>createPayRecords({shift,payrollId:'period-1',...input,netPaidCents:15800,payoutStatus:'Received'},[received.earningsRecord]),/already has/i);
 assert.throws(()=>validateActualPay({...input,payoutStatus:'Received'}),/actually reached/i);
 assert.throws(()=>createPayRecords({shift,payrollId:'wrongly-entered',...input,netPaidCents:15800,payoutStatus:'Expected'},[]),/cannot include an amount received/i);
 assert.deepEqual(payrollSummary([expected.earningsRecord,received.earningsRecord]),{receivedCents:15800,expectedCents:15800,unverifiedCount:0,items:[expected.earningsRecord,received.earningsRecord]});
});

test('tips, withholding, and payroll arithmetic reject invalid or non-whole cents',()=>{
 assert.throws(()=>validateActualPay({wagesCents:10,cashTipsCents:0,cardTipsCents:0,tipOutCents:11,withheldCents:0,payoutStatus:'Expected'}),/cannot exceed/i);
 assert.throws(()=>validateActualPay({wagesCents:10.5,cashTipsCents:0,cardTipsCents:0,tipOutCents:0,withheldCents:0,payoutStatus:'Expected'}),/whole cents/i);
});
