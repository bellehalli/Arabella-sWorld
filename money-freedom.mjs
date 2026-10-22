// DreamHub Money Garden · private, local-first financial planning helpers
export const FREEDOM_AGE=30;
export const starterBills=[
 {name:'Chase credit card minimum A',amount:4000,cadence:'Monthly',category:'Debt',verified:'user-reported'},
 {name:'Chase credit card minimum B',amount:6500,cadence:'Monthly',category:'Debt',verified:'user-reported'},
 {name:'Afterpay installments (approximately)',amount:5000,cadence:'Every two weeks',category:'Debt',verified:'user-reported',note:'Check remaining installments and exact dates'},
 {name:'Canva',amount:3000,cadence:'Monthly',category:'Studio tools',verified:'historical—confirm active'},
 {name:'ChatGPT Plus',amount:2000,cadence:'Monthly',category:'Tools',verified:'historical—confirm active'},
 {name:'Vercel Pro',amount:2000,cadence:'Monthly',category:'Studio tools',verified:'historical—confirm active'}
];
export const starterVaults=[
 ['Starter emergency',100000],['Full emergency reserve',0],['Apartment',650000],['Car',900000],['Travel',300000],['Future house',2500000],['Annual expenses',0],['Health & beauty',0],['Opportunity fund',250000],['Investments',0]
];
export const moneyFormat=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
export function availableForGoals({income,unpaidEssentials=0,taxes=0,minimums=0,buffer=0}){
 const entries=[income,unpaidEssentials,taxes,minimums,buffer];
 if(entries.some(x=>!Number.isSafeInteger(x)||x<0))throw Error('Use nonnegative amounts in cents.');
 const reserved=unpaidEssentials+taxes+minimums+buffer;
 return {reserved,remaining:Math.max(0,income-reserved),shortfall:Math.max(0,reserved-income)};
}
export function allocateIncome(input,weights={debt:40,emergency:20,apartment:15,car:10,travel:10,house:5}){
 const {reserved,remaining,shortfall}=availableForGoals(input);
 const pairs=Object.entries(weights);
 if(pairs.some(([,v])=>!Number.isFinite(v)||v<0)||Math.abs(pairs.reduce((s,[,v])=>s+v,0)-100)>.001)throw Error('Allocation weights must add up to 100%.');
 let rest=remaining;const allocation={};
 pairs.forEach(([key,pct],i)=>{const cents=i===pairs.length-1?rest:Math.floor(remaining*pct/100);allocation[key]=cents;rest-=cents;});
 return {reserved,remaining,shortfall,allocation};
}
export function cardPaydown(balance,limit,target=.30){if(![balance,limit,target].every(Number.isFinite)||balance<0||limit<=0||target<0||target>1)return null;return Math.max(0,balance-Math.floor(limit*target));}
export function futureValue(monthlyCents,years,annualRate=.07){if(monthlyCents<0||years<0||annualRate<0)return 0;const months=Math.floor(years*12),rate=annualRate/12;return Math.round(rate?monthlyCents*(Math.pow(1+rate,months)-1)/rate:monthlyCents*months);}
