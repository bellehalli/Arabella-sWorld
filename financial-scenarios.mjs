const safeCents=value=>Number.isSafeInteger(value)&&value>=0;
export function calculateMoveScenario({monthlyIncomeCents,monthlyCosts=[],currentSavingsCents=0,oneTimeCostsCents=0,monthlySavingsCents=null}){
 if(!safeCents(monthlyIncomeCents)||!safeCents(currentSavingsCents)||!safeCents(oneTimeCostsCents)||!Array.isArray(monthlyCosts)||monthlyCosts.some(x=>!x||typeof x.name!=='string'||!x.name.trim()||!safeCents(x.amountCents)))throw Error('Enter valid non-negative money amounts and named monthly costs.');
 const totalMonthlyCosts=monthlyCosts.reduce((n,x)=>n+x.amountCents,0);if(!Number.isSafeInteger(totalMonthlyCosts))throw Error('Monthly costs exceed the safe calculation range.');
 const monthlyRemainder=monthlyIncomeCents-totalMonthlyCosts;
 const contribution=monthlySavingsCents===null?Math.max(0,monthlyRemainder):monthlySavingsCents;
 if(!safeCents(contribution))throw Error('Planned monthly saving must be a non-negative amount.');
 const remainingMoveCost=Math.max(0,oneTimeCostsCents-currentSavingsCents);
 const monthsToGoal=remainingMoveCost===0?0:contribution>0?Math.ceil(remainingMoveCost/contribution):null;
 return {monthlyIncomeCents,totalMonthlyCosts,monthlyRemainder,currentSavingsCents,oneTimeCostsCents,remainingMoveCost,plannedMonthlySavingsCents:contribution,monthsToGoal,projectedSavings:[1,3,6,12].map(months=>({months,totalCents:currentSavingsCents+contribution*months,afterMoveCents:currentSavingsCents+contribution*months-oneTimeCostsCents})),monthlyCosts:monthlyCosts.map(x=>({name:x.name.trim(),amountCents:x.amountCents})),assumption:'All values are user-entered estimates. Income is treated as monthly take-home only if the user entered it that way; no future income or tax result is verified.'};
}
