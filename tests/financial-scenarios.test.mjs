import test from 'node:test';import assert from 'node:assert/strict';
import {calculateMoveScenario} from '../financial-scenarios.mjs';

test('move scenario uses exact cents and reports monthly remainder and time to goal',()=>{
 const result=calculateMoveScenario({monthlyIncomeCents:500000,monthlyCosts:[{name:'Rent',amountCents:125000},{name:'Food',amountCents:50000}],currentSavingsCents:80000,oneTimeCostsCents:500000,monthlySavingsCents:70000});
 assert.equal(result.totalMonthlyCosts,175000);assert.equal(result.monthlyRemainder,325000);assert.equal(result.remainingMoveCost,420000);assert.equal(result.monthsToGoal,6);assert.equal(result.projectedSavings.find(x=>x.months===6).afterMoveCents,0);assert.match(result.assumption,/user-entered estimates/);
});

test('move scenario keeps shortfalls visible and does not invent saving capacity',()=>{
 const result=calculateMoveScenario({monthlyIncomeCents:100000,monthlyCosts:[{name:'Housing',amountCents:120000}],currentSavingsCents:0,oneTimeCostsCents:300000});assert.equal(result.monthlyRemainder,-20000);assert.equal(result.monthsToGoal,null);assert.equal(result.projectedSavings[0].afterMoveCents,-300000);assert.throws(()=>calculateMoveScenario({monthlyIncomeCents:1.5}),/valid non-negative/);assert.throws(()=>calculateMoveScenario({monthlyIncomeCents:1,monthlyCosts:[{name:'Rent',amountCents:-1}]}),/valid non-negative/);
});
