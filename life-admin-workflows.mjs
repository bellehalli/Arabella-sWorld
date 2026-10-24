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

export function createCareCoverage({title,date,start,end,helper='',contact='',backupPlan='',travelMinutes=0}={}){
 const name=titleText(title)||'Caregiving coverage';if(!validDate(date)||!timeOK(start)||!timeOK(end)||start===end)throw Error('Enter a valid coverage date and distinct start/end times.');
 if(!Number.isInteger(travelMinutes)||travelMinutes<0||travelMinutes>360)throw Error('Travel buffer must be 0–360 minutes.');
 return record('event',{title:name,date,status:'Confirmed',sensitive:true,tags:['Caregiving','Coverage'],body:[helper&&`Coverage: ${helper}`,contact&&`Contact: ${contact}`,backupPlan&&`Backup: ${backupPlan}`].filter(Boolean).join('\n'),data:{category:'Caregiving',time:start,endTime:end,travelMinutes,coverageConfirmed:true,transportFallback:String(backupPlan||'').slice(0,500)}});
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
