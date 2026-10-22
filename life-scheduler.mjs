// All calculations are local, deterministic and approval-based.
// Dates/times use the device's local timezone. No server scheduler is implied.
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s))&&!Number.isNaN(new Date(s+'T12:00:00').getTime());
export function toMinutes(s){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s)))return null;const [h,m]=s.split(':').map(Number);return h*60+m;}
export const hhmm=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
export function scheduleDay(records,date,{start='10:00',end='19:00',energy='steady',includeWorkout=true,workout=null,buffer=10}={}){
 if(!validDate(date))throw Error('Choose a valid date.');
 const from=toMinutes(start),until=toMinutes(end);if(from===null||until===null||until<=from||until-from>960)throw Error('Choose a daytime window up to 16 hours.');
 const gap=Math.max(0,Math.min(60,Number(buffer)||0));
 const events=records.filter(r=>!r.deletedAt&&r.date===date&&r.type==='event'&&r.status!=='Done').map(r=>({id:r.id,title:r.title,start:toMinutes(r.data?.time),end:toMinutes(r.data?.endTime)})).filter(x=>x.start!==null).map(x=>({...x,end:x.end!==null&&x.end>x.start?x.end:x.start+45}));
 const occupied=events.map(x=>({...x,kind:'appointment'})).sort((a,b)=>a.start-b.start);
 const conflicts=[];for(let i=1;i<occupied.length;i++)if(occupied[i].start<occupied[i-1].end)conflicts.push([occupied[i-1].title,occupied[i].title]);
 const tasks=records.filter(r=>!r.deletedAt&&r.type==='task'&&r.status!=='Done'&&r.date<=date).sort((a,b)=>(b.favorite?1:0)-(a.favorite?1:0)||(a.data?.priority==='Time-sensitive'?-1:0)-(b.data?.priority==='Time-sensitive'?-1:0)||a.date.localeCompare(b.date));
 const limit=energy==='low'?2:energy==='high'?5:3,selected=tasks.slice(0,limit).map(r=>({id:r.id,title:r.title,minutes:Math.max(5,Math.min(90,Number(r.minutes)||25)),kind:'task'}));
 if(includeWorkout&&workout&&workout.minutes>0&&workout.kind!=='rest')selected.push({id:'movement-'+date,title:workout.name,minutes:energy==='low'?Math.min(15,workout.minutes):workout.minutes,kind:'workout'});
 const blocks=[],skipped=[];for(const task of selected){let cursor=from,placed=false;const busy=[...occupied,...blocks].sort((a,b)=>a.start-b.start);for(const slot of [...busy,{start:until+gap,end:until+gap}]){if(cursor+task.minutes<=Math.min(until,slot.start-gap)){blocks.push({...task,start:cursor,end:cursor+task.minutes});placed=true;break;}cursor=Math.max(cursor,slot.end+gap);}if(!placed)skipped.push(task);}
 return {date,window:{start,end},blocks:blocks.sort((a,b)=>a.start-b.start),appointments:occupied,conflicts,skipped,unselected:tasks.length-Math.min(tasks.length,limit),buffer:gap};
}
export function weeklyWorkoutDates(date,days=7){if(!validDate(date))throw Error('Invalid start date');const start=new Date(date+'T12:00:00');return Array.from({length:Math.max(1,Math.min(28,days))},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});}
export function measurementSeries(records,key){const allowed=['weight','neck','leftArm','rightArm','waist','lowerWaist','hips','leftThigh','rightThigh','leftCalf','rightCalf','bust'];if(!allowed.includes(key))throw Error('Unknown measurement');return records.filter(r=>r.type==='note'&&r.tags?.includes('Private body measurements')&&!r.deletedAt&&Number.isFinite(Number(r.data?.[key]))&&r.data?.[key]!==''&&r.data?.[key]!=null).sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({date:r.date,value:Number(r.data[key])}));}
export const exerciseSwaps={'Chair squat':['Sit-to-stand','Goblet squat'],'Glute bridge':['Floor hip thrust','Single-leg bridge (advanced)'],'Dumbbell Romanian deadlift':['Hip hinge without weights','Kettlebell deadlift'],'Supported reverse lunge':['Supported split squat','Step-back tap'],'Step-up on stable low step':['Chair squat','Supported reverse lunge'],'Wall or incline push-up':['Wall push-up','Countertop push-up'],'Dumbbell row':['Supported one-arm row','Resistance band row'],'Bird dog':['Standing bird dog','Dead bug']};
