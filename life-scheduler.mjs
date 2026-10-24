// All calculations are local, deterministic and approval-based.
// Plans normalize each record from its IANA timezone into the chosen planning timezone.
// No server scheduler or external calendar sync is implied.
import {taskReadiness,taskDueWindow,zonedInstants} from './planning-engine.mjs';
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!Number.isNaN(new Date(s+'T12:00:00').getTime());
export function toMinutes(s){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s)))return null;const [h,m]=s.split(':').map(Number);return h*60+m;}
export const hhmm=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const shiftDate=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
function minuteInPlanZone(date,time,sourceZone,targetZone,fold,planDate=date){try{const instants=zonedInstants(date,time,sourceZone);if(!instants.length)return {issue:'nonexistent local time'};if(instants.length>1&&!['earlier','later'].includes(fold))return {issue:'ambiguous repeated local time'};const instant=instants[instants.length>1&&fold==='later'?1:0],parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:targetZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value])),localDate=parts.year+'-'+parts.month+'-'+parts.day,days=(Date.parse(localDate+'T00:00:00Z')-Date.parse(planDate+'T00:00:00Z'))/86400000;return {minute:days*1440+Number(parts.hour)*60+Number(parts.minute)};}catch{return {issue:'invalid timezone'};}}
const intersects=(a,b)=>a.start<b.end&&b.start<a.end;
export function validateDayPlan(blocks,fixed=[]){
 const selected=blocks.filter(x=>x.include!==false).map(x=>({id:x.id,title:x.title,start:Number(x.start),end:Number(x.end),fixed:false}));
 const anchors=fixed.map(x=>({id:x.id,title:x.title,start:Number(x.start),end:Number(x.end),fixed:true}));
 if(selected.some(x=>!Number.isInteger(x.start)||!Number.isInteger(x.end)||x.start<0||x.end>2880||x.end<=x.start))throw Error('Each selected block needs a valid start and end time.');
 const all=[...anchors,...selected].sort((a,b)=>a.start-b.start||a.end-b.end),conflicts=[];
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length&&all[j].start<all[i].end;j++)if(intersects(all[i],all[j]))conflicts.push({first:all[i],second:all[j]});
 return conflicts;
}
export function scheduleDay(records,date,{start='10:00',end='19:00',energy='Medium',includeWorkout=true,workout=null,buffer=10,travel=0,capacityMinutes=180,protectRest=true,timezone='America/Detroit'}={}){
 if(!validDate(date))throw Error('Choose a valid date.');
 try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format(new Date());}catch{throw Error('Choose a valid planning timezone.');}
 const from=toMinutes(start),until=toMinutes(end);if(from===null||until===null||until<=from||until-from>960)throw Error('Choose a daytime window up to 16 hours.');
 const gap=Math.max(0,Math.min(60,Number(buffer)||0)),defaultTravel=Math.max(0,Math.min(240,Number(travel)||0)),capacity=Math.max(0,Math.min(720,Math.floor(Number(capacityMinutes)||0)));
 const dayRecords=records.filter(r=>!r.deletedAt&&!['paused','skipped'].includes(r.data?.scheduleState)&&r.date>=shiftDate(date,-1)&&r.date<=shiftDate(date,1)&&r.status!=='Done'),oldBlocks=dayRecords.filter(r=>r.type==='event'&&r.date===date&&r.tags?.includes('Day Architect'));
 const commitments=[],unconfirmedShifts=[],timeIssues=[];
 for(const r of dayRecords){
  if(r.type==='shift'){
   const rawStart=toMinutes(r.data?.start),rawEnd=toMinutes(r.data?.end);if(rawStart===null||rawEnd===null)continue;
   const sourceZone=r.data?.timeZone||timezone,endDate=rawEnd<=rawStart?shiftDate(r.date,1):r.date,a=minuteInPlanZone(r.date,r.data.start,sourceZone,timezone,r.data?.timeFold,date),b=minuteInPlanZone(endDate,r.data.end,sourceZone,timezone,r.data?.timeFold,date);
   if(a.issue||b.issue){if(r.date===date){timeIssues.push({id:r.id,title:r.title,reason:a.issue||b.issue});commitments.push({id:r.id,title:r.title,start:0,end:1440,kind:'time review',travelMinutes:0,prepMinutes:0,recoveryMinutes:0});}continue;}
   const s=a.minute,e=b.minute;if(s>=1440||e<=0)continue;
   if(!(r.data?.shiftStatus==='Confirmed'||r.data?.confirmed===true||r.status==='Confirmed')){unconfirmedShifts.push(r);continue;}
   commitments.push({id:r.id,title:r.title,start:s,end:e,kind:'work shift',travelMinutes:Number(r.data?.travelMinutes)||defaultTravel,prepMinutes:Number(r.data?.prepMinutes)||0,recoveryMinutes:Number(r.data?.recoveryMinutes)||0});
  }else if(r.type==='event'&&!r.tags?.includes('Day Architect')){
   const s=toMinutes(r.data?.time);
   if(s===null){if(r.date===date)commitments.push({id:r.id,title:r.title,start:0,end:1440,kind:'all-day commitment',source:r,travelMinutes:0,prepMinutes:0,recoveryMinutes:0});continue;}
   const rawEnd=toMinutes(r.data?.endTime),sourceZone=r.data?.timeZone||timezone,endDate=rawEnd!==null&&rawEnd<=s?shiftDate(r.date,1):r.date,a=minuteInPlanZone(r.date,r.data.time,sourceZone,timezone,r.data?.timeFold,date),b=rawEnd===null?null:minuteInPlanZone(endDate,r.data.endTime,sourceZone,timezone,r.data?.timeFold,date);
   if(a.issue||b?.issue){if(r.date===date){const reason=a.issue||b.issue;timeIssues.push({id:r.id,title:r.title,reason});commitments.push({id:r.id,title:r.title,start:0,end:1440,kind:'time review',source:r,travelMinutes:0,prepMinutes:0,recoveryMinutes:0});}continue;}
   const startAt=a.minute,endAt=b?b.minute:startAt+45;if(startAt>=1440||endAt<=0)continue;
   commitments.push({id:r.id,title:r.title,start:startAt,end:endAt,kind:'appointment',source:r,travelMinutes:Number(r.data?.travelMinutes)||(r.data?.place?defaultTravel:0),prepMinutes:Number(r.data?.prepMinutes)||0,recoveryMinutes:Number(r.data?.recoveryMinutes)||0});
  }
 }
 const fixed=[];
 for(const c of commitments){
  if(c.prepMinutes)fixed.push({id:c.id+'-prep',title:'Get ready for '+c.title,start:c.start-c.travelMinutes-c.prepMinutes,end:c.start-c.travelMinutes,kind:'preparation',sourceId:c.id});
  if(c.travelMinutes)fixed.push({id:c.id+'-travel-out',title:'Travel to '+c.title,start:c.start-c.travelMinutes,end:c.start,kind:'travel',sourceId:c.id});
  fixed.push({id:c.id,title:c.title,start:c.start,end:c.end,kind:c.kind,sourceId:c.id});
  if(c.travelMinutes)fixed.push({id:c.id+'-travel-back',title:'Travel from '+c.title,start:c.end,end:c.end+c.travelMinutes,kind:'travel',sourceId:c.id});
  if(c.recoveryMinutes)fixed.push({id:c.id+'-recovery',title:'Recover after '+c.title,start:c.end+c.travelMinutes,end:c.end+c.travelMinutes+c.recoveryMinutes,kind:'recovery',sourceId:c.id});
 }
 let restBreakUnplaced=false;if(protectRest&&until-from>=300&&from<900&&until>660){const candidates=Array.from({length:17},(_,i)=>660+i*15).filter(x=>x>=from&&x+30<=until).sort((a,b)=>Math.abs(a-750)-Math.abs(b-750));const slot=candidates.find(start=>!fixed.some(x=>intersects({start,end:start+30},x)));if(slot===undefined)restBreakUnplaced=true;else fixed.push({id:'protected-lunch',title:'Meal & rest break',start:slot,end:slot+30,kind:'protected rest'});}
 const inWindow=fixed.filter(x=>x.start<until&&x.end>from),conflicts=validateDayPlan([],inWindow);
 const blocked=[],tasks=[];
 for(const task of records.filter(x=>!x.deletedAt&&!['paused','skipped'].includes(x.data?.scheduleState)&&x.type==='task'&&!['Done','Paused'].includes(x.status))){
  let due;try{due=taskDueWindow(task);}catch{continue;}
  const eligible=due.mode==='on'?due.end<=date:due.mode==='before'?due.end>=date:due.mode==='window'?due.start<=date:due.mode==='someday'&&(task.status==='Now'||task.favorite);
  if(!eligible)continue;
  const ready=taskReadiness(task,records);if(!ready.ready){blocked.push({...task,reason:ready.missing.length?'A prerequisite is missing':'Waiting on a prerequisite'});continue;}tasks.push(task);
 }
 const priority={'Time-sensitive':5,'Important':3,'Gentle':1};
 const energyFit=task=>energy==='Low'?(task.energy==='Low'?2:task.energy==='Medium'?1:0):energy==='High'?(task.energy==='High'?2:task.energy==='Medium'?1:0):(task.energy==='Medium'?2:1);
 tasks.sort((a,b)=>(a.date&&a.date<date?-1:0)-(b.date&&b.date<date?-1:0)||(b.favorite?1:0)-(a.favorite?1:0)||(priority[b.data?.priority]||0)-(priority[a.data?.priority]||0)||energyFit(b)-energyFit(a)||(a.date||'9999').localeCompare(b.date||'9999'));
 const limit=energy==='Low'?2:energy==='High'?5:3,selected=tasks.slice(0,limit).map(r=>({id:r.id,title:r.title,minutes:Math.max(5,Math.min(90,Number(r.minutes)||25)),kind:'task',dueDate:r.date||'',energy:r.energy,include:true}));
 if(includeWorkout&&workout&&workout.minutes>0&&workout.kind!=='rest')selected.push({id:'movement-'+date,title:workout.name,minutes:energy==='Low'?Math.min(15,workout.minutes):workout.minutes,kind:'workout',include:true});
 const occupied=[...inWindow];
 const blocks=[],skipped=[];let remaining=capacity,lastTaskEnd=null;
 for(const task of selected){
  if(task.kind==='task'&&task.minutes>remaining){skipped.push({...task,reason:'Outside the focus capacity you set'});continue;}
  let cursor=from,placed=false;const busy=[...occupied,...blocks].sort((a,b)=>a.start-b.start);
  for(const slot of [...busy,{start:until+gap,end:until+gap}]){
   if(cursor+task.minutes<=Math.min(until,slot.start-gap)){
    if(lastTaskEnd!==null&&cursor-lastTaskEnd>=90&&protectRest){const rest={id:'rest-'+date+'-'+blocks.length,title:'A little rest & reset',start:lastTaskEnd,end:lastTaskEnd+10,minutes:10,kind:'rest',include:true};if(rest.end<=cursor)blocks.push(rest);}
    blocks.push({...task,start:cursor,end:cursor+task.minutes});placed=true;if(task.kind==='task')remaining=Math.max(0,remaining-task.minutes);lastTaskEnd=cursor+task.minutes;break;
   }
   cursor=Math.max(cursor,slot.end+gap);
  }
  if(!placed)skipped.push({...task,reason:'Not enough open time before the day ends'});
 }
 const deferred=tasks.filter(t=>!blocks.some(b=>b.id===t.id)).map(t=>({...t,reason:blocked.find(x=>x.id===t.id)?.reason||skipped.find(x=>x.id===t.id)?.reason||'Outside today’s planning capacity'}));
 const visibleFixed=inWindow.filter(x=>x.kind!=='protected rest');
 return {date,window:{start,end},timezone,blocks:blocks.sort((a,b)=>a.start-b.start),appointments:commitments,fixed:inWindow,conflicts,skipped:deferred,blocked,unconfirmedShifts,timeIssues,unselected:Math.max(0,tasks.length-limit),buffer:gap,capacityMinutes:capacity,remainingCapacity:remaining,replacedBlocks:oldBlocks,protectedMinutes:inWindow.filter(x=>x.kind==='protected rest').reduce((n,x)=>n+x.end-x.start,0),restBreakUnplaced,fixedMinutes:visibleFixed.reduce((n,x)=>n+Math.max(0,Math.min(until,x.end)-Math.max(from,x.start)),0)};
}
export function weeklyWorkoutDates(date,days=7){if(!validDate(date))throw Error('Invalid start date');const start=new Date(date+'T12:00:00');return Array.from({length:Math.max(1,Math.min(28,days))},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});}
export function measurementSeries(records,key){const allowed=['weight','neck','leftArm','rightArm','waist','lowerWaist','hips','leftThigh','rightThigh','leftCalf','rightCalf','bust'];if(!allowed.includes(key))throw Error('Unknown measurement');return records.filter(r=>r.type==='note'&&r.tags?.includes('Private body measurements')&&!r.deletedAt&&Number.isFinite(Number(r.data?.[key]))&&r.data?.[key]!==''&&r.data?.[key]!=null).sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({date:r.date,value:Number(r.data[key])}));}
export const exerciseSwaps={'Chair squat':['Sit-to-stand','Goblet squat'],'Glute bridge':['Floor hip thrust','Single-leg bridge (advanced)'],'Dumbbell Romanian deadlift':['Hip hinge without weights','Kettlebell deadlift'],'Supported reverse lunge':['Supported split squat','Step-back tap'],'Step-up on stable low step':['Chair squat','Supported reverse lunge'],'Wall or incline push-up':['Wall push-up','Countertop push-up'],'Dumbbell row':['Supported one-arm row','Resistance band row'],'Bird dog':['Standing bird dog','Dead bug']};
