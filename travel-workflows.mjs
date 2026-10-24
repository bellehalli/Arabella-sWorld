import {record,validDate} from './core.mjs';

export const requestedTripTemplates=[
 {key:'europe-christmas-markets',title:'European Christmas market tour',place:'Europe · choose cities',region:'Europe',themes:['markets','winter lights','food','crafts']},
 {key:'japan',title:'Japan trip',place:'Japan · choose regions and cities',region:'Japan',themes:['food','gardens','design','history']},
 {key:'china',title:'China trip',place:'China · choose regions and cities',region:'China',themes:['food','architecture','history','nature']},
 {key:'indonesia',title:'Indonesia trip',place:'Indonesia · choose islands and cities',region:'Indonesia',themes:['food','nature','crafts','rest']}
];
const planets=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const titleText=v=>String(v||'').trim().slice(0,160);
export function tripBudget(items={}){
 const keys=['transport','lodging','food','activities','localTravel','accessibility','insurance','documents','petCare','buffer'];
 const values={};let totalCents=0;
 for(const key of keys){const value=items[key]??0;if(!Number.isSafeInteger(value)||value<0)throw Error('Trip budget lines must be nonnegative whole cents.');values[key]=value;totalCents+=value;if(!Number.isSafeInteger(totalCents))throw Error('Trip budget total is too large.');}
 return {items:values,totalCents};
}
export function tripBudgetStatus(trip){
 const budget=tripBudget(trip?.data?.budgetItems||{}),saved=Number(trip?.data?.tripSavedCents)||0,spent=Number(trip?.data?.tripSpentCents)||0;
 if(!Number.isSafeInteger(saved)||saved<0||!Number.isSafeInteger(spent)||spent<0)throw Error('Saved and spent amounts must be nonnegative cents.');
 return {budgetCents:budget.totalCents,savedCents:saved,spentCents:spent,remainingCents:Math.max(0,budget.totalCents-spent),gapCents:Math.max(0,budget.totalCents-saved),fundedPercent:budget.totalCents?Math.min(100,Math.round(saved/budget.totalCents*100)):0};
}
export function monthlySavingNeeded(targetCents,savedCents=0,from=new Date(),goalDate){
 if(!Number.isSafeInteger(targetCents)||targetCents<0||!Number.isSafeInteger(savedCents)||savedCents<0)throw Error('Savings amounts must be nonnegative whole cents.');
 if(!validDate(goalDate))throw Error('Choose a valid travel savings date.');
 const end=new Date(goalDate+'T12:00:00'),start=from instanceof Date?from:new Date(from);
 if(Number.isNaN(start.getTime()))throw Error('The savings start date is invalid.');
 const periods=Math.max(1,(end.getFullYear()-start.getFullYear())*12+end.getMonth()-start.getMonth());
 return {remainingCents:Math.max(0,targetCents-savedCents),months:periods,monthlyCents:Math.ceil(Math.max(0,targetCents-savedCents)/periods)};
}
export function createTripFund(trip,{savedCents=0,goalDate=trip?.data?.endDate||trip?.data?.startDate||''}={}){
 if(!trip||trip.type!=='travel'||trip.deletedAt)throw Error('Choose a saved trip.');
 const budget=tripBudgetStatus(trip),target=budget.budgetCents;if(!target)throw Error('Add trip budget estimates before creating a savings plan.');
 const monthly=goalDate?monthlySavingNeeded(target,savedCents,new Date(),goalDate):null;
 return record('fund',{title:`Travel fund · ${trip.title}`,date:goalDate||trip.date,sensitive:true,tags:['Sinking fund','Travel'],links:[trip.id],data:{target,amount:savedCents,monthlyContribution:monthly?.monthlyCents||0,goalDate,tripId:trip.id,tripBudgetCents:target}});
}
export function astroActivitySuggestions({planet='',place='',interests='',energy='Medium'}={}){
 if(!planets.includes(planet))throw Error('Choose a planet line from your own astrocartography map.');
 const sets={
  Sun:['Visit a landmark or viewpoint in daylight','Choose a performance, studio tour, or photo walk','Plan one activity where you can celebrate a personal milestone'],
  Moon:['Try a local comfort-food meal or cooking class','Choose a calm waterfront, garden, or neighborhood walk','Leave an unplanned rest window near your lodging'],
  Mercury:['Explore a market or walkable neighborhood','Visit a museum with a short guided audio tour','Try a language, writing, or craft workshop'],
  Venus:['Visit an art, fashion, or design collection','Choose a café, music, or local craft experience','Plan a relaxed outing with someone you care about'],
  Mars:['Choose a movement-based outing at a comfortable pace','Try a guided day walk with a clear return route','Schedule recovery time after a high-energy activity'],
  Jupiter:['Explore a cultural or history site with a guide','Attend a local performance or public lecture','Set aside time for a new food or learning experience'],
  Saturn:['Choose an architecture, heritage, or history walk','Build a structured half-day around one area','Add a quiet buffer before and after the main activity'],
  Uranus:['Explore contemporary art, design, or technology','Choose one unusual but accessible local experience','Keep a flexible alternative in case plans change'],
  Neptune:['Consider music, film, or a reflective arts experience','Choose a calm scenic place with a clear transport plan','Keep expectations practical and avoid booking on symbolism alone'],
  Pluto:['Explore a deeper history exhibit or cultural archive','Choose a focused, small-group learning experience','Plan an exit and rest option if the visit feels intense']
 };
 const extras=titleText(interests,180),where=titleText(place,120);
 return {planet,place:where,interests:extras,energy,suggestions:sets[planet].map(text=>extras?`${text} · with a focus on ${extras.toLowerCase()}`:text),note:'Reflective prompts based on the planet line you selected from your own map. DreamHub does not calculate or verify astrocartography, predict outcomes, or treat a line as a reason to spend or travel.'};
}
