// Manual-first planning helpers. All scheduling is a proposal until the user saves it.
export const validPlanningDate = value => {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;
 const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
};
const dateAt=(date,days)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
const cmp=(a,b)=>a.localeCompare(b);
const validZone=zone=>{try{new Intl.DateTimeFormat('en',{timeZone:zone}).format(new Date());return true;}catch{return false;}};
const partsAt=(instant,zone)=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const civil=(date,time)=>{if(!validPlanningDate(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))throw Error('Choose a valid local date and time.');const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number);return {y,m,d,h,min};};

// Returns zero, one, or two possible instants for a wall-clock time. A missing
// instant is a DST spring gap; two instants are a fall-back ambiguity.
export function zonedInstants(date,time,zone){
 if(!validZone(zone))throw Error('Choose a valid IANA timezone.');const want=civil(date,time),naive=Date.UTC(want.y,want.m-1,want.d,want.h,want.min),offsets=new Set();
 for(let hours=-18;hours<=18;hours+=3){const p=partsAt(new Date(naive+hours*3600000),zone);const wall=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute);offsets.add(wall-(naive+hours*3600000));}
 const found=[];for(const offset of offsets){const t=new Date(naive-offset),p=partsAt(t,zone);if(+p.year===want.y&&+p.month===want.m&&+p.day===want.d&&+p.hour===want.h&&+p.minute===want.min)found.push(t.toISOString());}
 return [...new Set(found)].sort();
}
export function taskReadiness(task,records){
 const required=Array.isArray(task?.data?.dependsOn)?[...new Set(task.data.dependsOn)]:[],lookup=new Map(records.filter(r=>!r.deletedAt).map(r=>[r.id,r]));
 const missing=required.filter(id=>!lookup.has(id)),pending=required.map(id=>lookup.get(id)).filter(r=>r&&r.status!=='Done');
 return {ready:!missing.length&&!pending.length,missing,pending,dependsOn:required};
}
export function validateTaskDependencies(taskId,dependsOn,records){
 const ids=[...new Set((dependsOn||[]).map(String))];if(ids.length>50||ids.includes(taskId))throw Error('A task cannot depend on itself or more than 50 tasks.');
 const map=new Map(records.filter(r=>r.type==='task'&&!r.deletedAt).map(r=>[r.id,r]));for(const id of ids)if(!map.has(id))throw Error('Every dependency must be an active saved task.');
 const walk=(id,path)=>{if(path.has(id))return true;const r=map.get(id);if(!r)return false;const next=new Set(path);next.add(id);return (r.data?.dependsOn||[]).some(x=>x===taskId||walk(x,next));};
 if(ids.some(id=>walk(id,new Set())))throw Error('Those dependencies would create a task cycle.');return ids;
}
export function taskDueWindow(task){
 const d=task?.data||{},mode=d.dueMode|| (task?.date?'on':'someday'),start=d.dueStart||task?.date||'',end=d.dueEnd||start;
 if(!['on','before','window','someday'].includes(mode))throw Error('Unsupported due-date flexibility.');
 if(mode==='someday')return {mode,start:'',end:'',flexible:true};
 if(!validPlanningDate(start)||!validPlanningDate(end)||start>end)throw Error('Choose a valid due date or date window.');
 if(mode==='on'&&start!==end)throw Error('A fixed due date must use one date.');
 if(mode==='before'&&end!==start)throw Error('A due-before date uses one end date.');
 return {mode,start,end,flexible:mode!=='on'};
}
export function flexibleDueStatus(task,today){
 if(!validPlanningDate(today))throw Error('Choose a valid current date.');const w=taskDueWindow(task);
 if(w.mode==='someday')return {state:'open',window:w};if(w.mode==='window'&&today<w.start)return {state:'upcoming',window:w};
 if(w.mode==='window'&&today<=w.end)return {state:'due',window:w};
 const limit=w.mode==='window'?w.end:w.start;return {state:today>limit?'overdue':today===limit?'due':'upcoming',window:w};
}
export function calendarRange(view,anchor){
 if(!validPlanningDate(anchor)||!['day','week','month'].includes(view))throw Error('Choose a supported calendar view and date.');
 if(view==='day')return {from:anchor,to:anchor};
 if(view==='week'){const d=new Date(anchor+'T12:00:00Z'),offset=(d.getUTCDay()+6)%7;return {from:dateAt(anchor,-offset),to:dateAt(anchor,6-offset)};}
 const [y,m]=anchor.slice(0,7).split('-').map(Number);return {from:`${y}-${String(m).padStart(2,'0')}-01`,to:`${y}-${String(m).padStart(2,'0')}-${new Date(Date.UTC(y,m,0)).getUTCDate()}`};
}
export function calendarOccurrences(records,{from,to,timezone='America/Detroit'}={}){
 if(!validPlanningDate(from)||!validPlanningDate(to)||from>to||!validZone(timezone))throw Error('Choose a valid date range and timezone.');
 const out=[];for(const r of records){if(!r||r.deletedAt||!['event','task','bill','application','assignment','exam','study','experiencePlan','followup','shift'].includes(r.type))continue;
  const dates=[];if(r.type==='task'&&r.data?.dueMode==='window'&&validPlanningDate(r.data.dueStart)&&validPlanningDate(r.data.dueEnd)){for(let d=r.data.dueStart;d<=r.data.dueEnd&&dates.length<32;d=dateAt(d,1))dates.push(d);}else dates.push(r.data?.followup||r.date);
  for(const date of dates){if(!validPlanningDate(date)||date<from||date>to)continue;const time=/^([01]\d|2[0-3]):[0-5]\d$/.test(r.data?.time||'')?r.data.time:null,endTime=/^([01]\d|2[0-3]):[0-5]\d$/.test(r.data?.endTime||'')?r.data.endTime:null,zone=r.data?.timeZone||timezone,foldSet=['earlier','later'].includes(r.data?.timeFold);let instants=[],dst='';if(time){instants=zonedInstants(date,time,zone);const ends=endTime?zonedInstants(date,endTime,zone):[];dst=instants.length===0?'nonexistent':ends.length===0&&endTime?'nonexistent end time':instants.length===2&&!foldSet?'ambiguous':ends.length===2&&!foldSet?'ambiguous end time':'';}
   out.push({id:r.id,type:r.type,title:r.title,date,time,endTime,timezone:zone,instants,dst,fold:r.data?.timeFold==='later'?1:0,allDay:!time,location:r.data?.location||r.data?.place||'',status:r.status||'Next'});
  }
 }
 return out.sort((a,b)=>cmp(a.date+(a.time||''),b.date+(b.time||''))||cmp(a.title,b.title));
}
export function calendarConflicts(items){
 const timed=items.filter(x=>x.time&&x.endTime&&!x.dst),conflicts=[];
 for(let i=0;i<timed.length;i++)for(let j=i+1;j<timed.length;j++){
  const a=timed[i],b=timed[j],as=zonedInstants(a.date,a.time,a.timezone)[a.fold||0],ae=zonedInstants(a.date,a.endTime,a.timezone)[a.fold||0],bs=zonedInstants(b.date,b.time,b.timezone)[b.fold||0],be=zonedInstants(b.date,b.endTime,b.timezone)[b.fold||0];
  if(as&&ae&&bs&&be&&Date.parse(as)<Date.parse(be)&&Date.parse(bs)<Date.parse(ae))conflicts.push({ids:[a.id,b.id],date:a.date,reason:'overlap'});
 }
 for(const x of items.filter(x=>x.dst))conflicts.push({ids:[x.id],date:x.date,reason:x.dst});return conflicts;
}
export function recurrenceDates(rule,{from,to}={}){
 const start=rule?.start,frequency=rule?.frequency||'weekly',interval=rule?.interval??1,days=rule?.weekdays||[];
 if(!validPlanningDate(start)||!validPlanningDate(from)||!validPlanningDate(to)||from>to||to<start||Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z')>366*86400000||!['daily','weekly','monthly'].includes(frequency)||!Number.isInteger(interval)||interval<1||interval>365||!Array.isArray(days)||days.some(x=>!Number.isInteger(x)||x<0||x>6)||days.length>7)throw Error('Invalid recurrence rule or range.');
 if(rule.paused===true)return [];const until=rule.until||'',skip=new Set(rule.skippedDates||[]);if(until&&!validPlanningDate(until))throw Error('Invalid recurrence end date.');
 const first=new Date(start+'T12:00:00Z'),out=[];for(let d=new Date(from+'T12:00:00Z');d<=new Date(to+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1)){
  const date=d.toISOString().slice(0,10);if(date<start||until&&date>until||skip.has(date))continue;const elapsed=Math.round((d-first)/86400000),monthDelta=(d.getUTCFullYear()-first.getUTCFullYear())*12+d.getUTCMonth()-first.getUTCMonth(),last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
  const match=frequency==='daily'?elapsed%interval===0:frequency==='weekly'?Math.floor(elapsed/7)%interval===0&&(days.length?days.includes(d.getUTCDay()):d.getUTCDay()===first.getUTCDay()):monthDelta%interval===0&&d.getUTCDate()===Math.min(first.getUTCDate(),last);
  if(match)out.push(date);
 }
 return out;
}
export function recurrenceOccurrences(rule,{from,to,timezone=rule?.timezone||'America/Detroit'}={}){
 if(rule?.paused)return [];if(!validZone(timezone))throw Error('Choose a valid IANA timezone.');const time=rule?.time||null,foldSet=['earlier','later'].includes(rule?.timeFold);const dates=recurrenceDates(rule,{from,to});return dates.map(date=>{const instants=time?zonedInstants(date,time,timezone):[];return {ruleId:rule.id,date,time,timezone,instants,dst:time?(instants.length===0?'nonexistent':instants.length===2&&!foldSet?'ambiguous':''):''};});
}
export function habitTemplate({name,rhythm='Daily',target=1,weekdays=[]}){
 const title=String(name||'').trim();if(!title||title.length>120||!['Daily','Weekly','Ongoing'].includes(rhythm)||!Number.isInteger(target)||target<1||target>100||!Array.isArray(weekdays)||weekdays.some(x=>!Number.isInteger(x)||x<0||x>6))throw Error('Check the habit name, rhythm, target and selected weekdays.');return {id:`habit-${Date.now().toString(36)}`,name:title,rhythm,target,weekdays:[...new Set(weekdays)].sort(),paused:false,createdAt:new Date().toISOString()};
}
export function habitWeekProgress(habit,logs,weekOf){
 const range=calendarRange('week',weekOf),dates=[...new Set((logs||[]).filter(validPlanningDate).filter(d=>d>=range.from&&d<=range.to))];return {from:range.from,to:range.to,completed:dates.length,target:habit?.target||1,paused:habit?.paused===true,remaining:Math.max(0,(habit?.target||1)-dates.length)};
}
export function pauseHabit(habit,paused=true,at=new Date().toISOString()){
 if(!habit||typeof paused!=='boolean'||!Number.isFinite(Date.parse(at)))throw Error('Invalid habit pause change.');return {...habit,paused,pausedAt:paused?at:null};
}
export function weeklyResetSummary(records,{weekOf,capacityMinutes=600,energy='Medium'}={}){
 const {from,to}=calendarRange('week',weekOf);if(!Number.isInteger(capacityMinutes)||capacityMinutes<0||capacityMinutes>10080||!['Low','Medium','High'].includes(energy))throw Error('Choose a supported weekly capacity and energy level.');
 const tasks=records.filter(r=>!r.deletedAt&&r.type==='task'&&r.status!=='Done'&&(!r.date||r.date<=to)),minutes=tasks.reduce((n,r)=>n+(Number(r.minutes)||15),0),fixed=records.filter(r=>!r.deletedAt&&r.type==='event'&&r.date>=from&&r.date<=to).length;
 return {from,to,capacityMinutes,energy,openTasks:tasks.length,estimatedTaskMinutes:minutes,fixedEvents:fixed,overCapacity:minutes>capacityMinutes,shortfallMinutes:Math.max(0,minutes-capacityMinutes),tasks:tasks.sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0)).slice(0,5)};
}
export function minimumViableDay(records,{date,capacityMinutes=60,energy='Low',choose=[]}={}){
 if(!validPlanningDate(date)||!Number.isInteger(capacityMinutes)||capacityMinutes<0||capacityMinutes>480||!['Low','Medium','High'].includes(energy))throw Error('Choose a valid date, capacity and energy.');const open=records.filter(r=>!r.deletedAt&&r.type==='task'&&r.status!=='Done'&&(!r.date||r.date<=date)),eligible=open.filter(r=>taskReadiness(r,records).ready),tasks=choose.length?eligible.filter(r=>choose.includes(r.id)):eligible.filter(r=>r.favorite).slice(0,3);let remaining=capacityMinutes;const selected=[];for(const r of tasks){const m=Number(r.minutes)||15;if(m<=remaining){selected.push(r);remaining-=m;}}return {date,energy,capacityMinutes,selected,remaining,unselected:eligible.filter(x=>!selected.some(y=>y.id===x.id)),blocked:open.filter(r=>!taskReadiness(r,records).ready).map(r=>({task:r,readiness:taskReadiness(r,records)}))};
}
export function focusBreakPlan(minutes){if(!Number.isInteger(minutes)||minutes<1||minutes>240)throw Error('Focus length must be between 1 and 240 minutes.');return {focusMinutes:minutes,breakMinutes:minutes>=45?10:minutes>=25?5:Math.max(1,Math.round(minutes/5)),suggested:true};}
export function validateGoalParent(goalId,parentId,goals){if(!parentId)return null;if(goalId===parentId)throw Error('A dream cannot be its own parent.');const map=new Map(goals.filter(x=>x.type==='goal'&&!x.deletedAt).map(x=>[x.id,x]));if(!map.has(parentId)||!map.has(goalId))throw Error('Choose an active saved goal for this relationship.');let cursor=parentId,seen=new Set();while(cursor){if(cursor===goalId)throw Error('Those dream links would create a hierarchy cycle.');if(seen.has(cursor))throw Error('The current dream hierarchy has a cycle to review.');seen.add(cursor);cursor=map.get(cursor)?.data?.parentGoalId||'';}return parentId;}
export function draftDreamPlan(goal,{steps=[],milestones=[],dateWindow=null}={}){
 if(!goal||goal.type!=='goal'||goal.deletedAt||!String(goal.title||'').trim()||!Array.isArray(steps)||steps.length>30||!Array.isArray(milestones)||milestones.length>20)throw Error('Choose a saved active dream and a bounded plan.');if(steps.some(x=>!String(x||'').trim()||String(x).length>240))throw Error('Each plan step needs a short title.');if(milestones.some(x=>!String(x||'').trim()||String(x).length>240))throw Error('Each milestone needs a short title.');if(dateWindow&&(!validPlanningDate(dateWindow.start)||!validPlanningDate(dateWindow.end)||dateWindow.start>dateWindow.end))throw Error('Choose a valid planning window.');return {goalId:goal.id,title:goal.title,steps:steps.map((title,index)=>({title:String(title).trim(),order:index+1})),milestones:milestones.map((title,index)=>({title:String(title).trim(),order:index+1})),dateWindow:dateWindow||null,requiresApproval:true,approved:false};
}
export function approveDreamPlan(plan,goal,{makeRecord,firstDueDate='' }={}){
 if(!plan?.requiresApproval||plan.approved||!goal||goal.id!==plan.goalId||typeof makeRecord!=='function')throw Error('This dream plan needs an explicit approval for its current goal.');if(firstDueDate&&!validPlanningDate(firstDueDate))throw Error('Choose a valid first due date.');
 const tasks=plan.steps.map((step,index)=>makeRecord('task',{title:step.title,date:firstDueDate||'',links:[goal.id],data:{goalId:goal.id,planOrder:index+1}}));plan.approved=true;return {approved:true,goalId:goal.id,tasks,milestones:plan.milestones.map((title,index)=>({id:`${goal.id}-milestone-${index+1}`,title,goalId:goal.id,status:'planned'}))};
}
