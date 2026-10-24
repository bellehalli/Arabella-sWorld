import {record,validDate} from './core.mjs';

const titleText=(v,max=160)=>String(v||'').trim().slice(0,max);
const timeOK=v=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''));

export function ingredientNames(text=''){
 const rows=String(text).split(/[,\n]/).map(x=>x.trim()).filter(Boolean);
 if(rows.length>60||rows.some(x=>x.length>120))throw Error('Keep a grocery list to 60 ingredients, each under 120 characters.');
 const unique=new Map();for(const name of rows)if(!unique.has(name.toLocaleLowerCase()))unique.set(name.toLocaleLowerCase(),name);return [...unique.values()];
}

export function createMealPlan({title,date,mealType='Dinner',ingredients='',servings=1,prepMinutes=0,includePrepTask=false}={}){
 const name=titleText(title);if(!name||!validDate(date)||!['Breakfast','Lunch','Dinner','Snack'].includes(mealType))throw Error('Enter a meal name, valid date, and meal type.');
 if(!Number.isInteger(servings)||servings<1||servings>30||!Number.isInteger(prepMinutes)||prepMinutes<0||prepMinutes>480)throw Error('Servings must be 1–30 and prep time 0–480 minutes.');
 const list=ingredientNames(ingredients),meal=record('mealPlan',{title:name,date,sensitive:true,tags:['Meal plan'],data:{mealType,ingredients:list,servings,prepMinutes}});
 const task=includePrepTask?record('task',{title:'Prep: '+name,date,status:'Next',minutes:Math.max(5,prepMinutes||15),sensitive:true,tags:['Meal prep','Day Director'],links:[meal.id],data:{mealPlanId:meal.id,priority:'Normal',dueMode:'on'}}):null;
 return {meal,task,ingredients:list};
}

export function createGroceryItem({title,quantity='',category='Other',needBy='',onHand=null,reorderAt=null,unit=''}={}){
 const name=titleText(title,120);if(!name||!['Produce','Protein','Dairy','Pantry','Household','Pet','Other'].includes(category))throw Error('Enter an item name and a supported grocery category.');
 if(needBy&&!validDate(needBy))throw Error('Choose a valid needed-by date.');
 for(const n of [onHand,reorderAt])if(n!==null&&(!Number.isFinite(n)||n<0||n>100000))throw Error('Stock amounts must be nonnegative values.');
 return record('grocery',{title:name,date:needBy||'',status:'Next',sensitive:true,tags:['Groceries',category],data:{category,quantity:String(quantity).slice(0,80),unit:String(unit).slice(0,40),onHand,reorderAt,neededBy:needBy,checked:false}});
}

export function groceryRestockNeeded(item){return !!item&&!item.deletedAt&&item.type==='grocery'&&item.status!=='Done'&&item.data?.checked!==true&&Number.isFinite(item.data?.onHand)&&Number.isFinite(item.data?.reorderAt)&&item.data.onHand<=item.data.reorderAt;}

export function createAdminFollowup({title,date,category='Renewal',details='',amountCents=0,provider=''}={}){
 const name=titleText(title);if(!name||!validDate(date)||!['Maintenance','Errand','Document checklist','Renewal','Warranty follow-up','Transportation contingency'].includes(category))throw Error('Enter a follow-up name, valid due date, and category.');
 if(!Number.isSafeInteger(amountCents)||amountCents<0)throw Error('Estimated cost must be nonnegative whole cents.');
 const item=record('homeAdmin',{title:name,date,sensitive:true,tags:['Life admin',category],data:{category,dueDate:date,details:String(details||'').slice(0,3000),amount:amountCents,vendor:String(provider||'').slice(0,160)}});
 const task=record('task',{title:'Review: '+name,date,status:'Next',sensitive:true,tags:['Life admin','Day Director'],links:[item.id],data:{homeAdminId:item.id,priority:'Important',dueMode:'on'}});
 return {item,task};
}

export function attachTransportContingency(event,{mode='',route='',backupPlan='',travelMinutes=0}={}){
 if(!event||event.type!=='event'||event.deletedAt)throw Error('Choose an active calendar event.');
 if(!Number.isInteger(travelMinutes)||travelMinutes<0||travelMinutes>360)throw Error('Travel buffer must be 0–360 minutes.');
 return {...event,sensitive:true,data:{...event.data,transportMode:String(mode||'').slice(0,80),transportRoute:String(route||'').slice(0,300),transportFallback:String(backupPlan||'').slice(0,500),travelMinutes}};
}

export function careFollowupTasks(records,appointment){
 if(!appointment||appointment.type!=='event'||appointment.data?.category!=='Healthcare'||!validDate(appointment.date))return [];
 const choices=[['prepare','Prepare questions, records and medications'],['transport','Confirm ride, route, arrival and accessibility'],['followup','Review visit instructions and schedule next care']];
 return choices.filter(([key])=>!records.some(r=>!r.deletedAt&&r.type==='task'&&r.data?.appointmentId===appointment.id&&r.data?.healthStep===key)).map(([key,title])=>record('task',{title:`${title} · ${appointment.title}`,date:appointment.date,sensitive:true,tags:['Healthcare preparation','Day Director'],links:[appointment.id],data:{appointmentId:appointment.id,healthStep:key,dueMode:'on',priority:'Important'}}));
}

const readinessSteps=[
 ['passport','Check passport validity for every traveler and destination',90],
 ['entry','Review official entry, visa, and customs requirements for your passport and itinerary',90],
 ['transport','Review long-distance transportation options and arrival plans',60],
 ['lodging','Choose and verify lodging arrangements',60],
 ['reservations','Review reservations, activity confirmations, and cancellation dates',30],
 ['communications','Review phone, data, and payment access while traveling',14],
 ['insurance','Review travel insurance and cancellation terms',45],
 ['health','Review medication, health, and accessibility needs for the itinerary',30],
 ['documents','Save copies of reservations and essential travel documents securely',21],
 ['budget','Review trip budget, payment access, and emergency buffer',14],
 ['packing','Build and check a packing list for the planned weather and activities',7],
 ['emergency','Save emergency contacts, lodging details, and an offline itinerary copy',7],
 ['home','Prepare home and Freyja supplies for the time away',3]
];
const offsetDate=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-days);return d.toISOString().slice(0,10)};
export function createTripReadinessTasks(trip,{existing=[],today=new Date().toISOString().slice(0,10)}={}){
 if(!trip||trip.type!=='travel'||trip.deletedAt)throw Error('Choose an active saved trip.');
 if(!validDate(today))throw Error('Choose a valid review date.');
 const start=trip.data?.startDate||trip.date||'',tripId=trip.id;
 if(start&&!validDate(start))throw Error('The trip departure date is invalid.');
 return readinessSteps.filter(([key])=>!existing.some(x=>!x.deletedAt&&x.type==='task'&&x.data?.tripId===tripId&&x.data?.tripReadinessKey===key)).map(([key,title,offset])=>{
  const suggested=start?offsetDate(start,offset):'';
  const date=suggested? (suggested<today?today:suggested):'';
  return record('task',{title:`${title} · ${trip.title}`,date,status:'Next',sensitive:true,tags:['Travel readiness','Day Director'],links:[tripId],data:{tripId,tripReadinessKey:key,priority:'Important',dueMode:date?'on':'someday',suggestedDate:date||null}});
 });
}

export function overdueAdminReview(records,today){
 if(!validDate(today))throw Error('Choose a valid review date.');
 const all=records.filter(x=>!x.deletedAt),live=all.filter(x=>x.status!=='Done'),linkedTasks=new Set(all.filter(x=>x.type==='task').flatMap(x=>x.links||[]));
 const due=x=>x.type==='homeAdmin'?x.data?.dueDate:x.type==='petCare'?x.data?.next:x.type==='grocery'?x.data?.neededBy:x.date;
 return live.filter(x=>{
  const date=due(x);if(!validDate(date)||date>=today)return false;
  if(x.type==='task')return !x.data?.dependsOn?.some(id=>live.find(y=>y.id===id)?.status!=='Done');
  if(['grocery','homeAdmin','petCare','bill'].includes(x.type))return !linkedTasks.has(x.id);
  return false;
 }).map(x=>({...x,reviewDueDate:due(x)})).sort((a,b)=>a.reviewDueDate.localeCompare(b.reviewDueDate)||a.title.localeCompare(b.title));
}
