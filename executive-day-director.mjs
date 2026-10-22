// Pure planning engine; recommendations are never executed automatically.
const time=s=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw Error('Invalid time');const [h,m]=s.split(':').map(Number);return h*60+m;};
export function planDay({date,start='10:00',end='22:00',fixed=[],tasks=[],buffer=10}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Invalid date');
 const from=time(start),until=time(end);if(until<=from||buffer<0||buffer>60)throw Error('Invalid window');
 const occupied=fixed.map(e=>({...e,from:time(e.start),until:time(e.end)})).sort((a,b)=>a.from-b.from);
 if(occupied.some(e=>e.until<=e.from))throw Error('Invalid event');
 const conflicts=[];for(let i=1;i<occupied.length;i++)if(occupied[i].from<occupied[i-1].until)conflicts.push([occupied[i-1].id,occupied[i].id]);
 const blocks=[],deferred=[];
 for(const task of [...tasks].sort((a,b)=>(b.priority||0)-(a.priority||0))){
  if(!Number.isInteger(task.minutes)||task.minutes<1||task.minutes>480)throw Error('Invalid duration');
  let cursor=from,placed=false;
  for(const slot of [...occupied,...blocks].sort((a,b)=>a.from-b.from).concat([{from:until+buffer,until:until+buffer}])){
   if(cursor+task.minutes<=Math.min(until,slot.from-buffer)){blocks.push({...task,from:cursor,until:cursor+task.minutes,approval:'proposed'});placed=true;break;}
   cursor=Math.max(cursor,slot.until+buffer);
  }
  if(!placed)deferred.push({...task,reason:'Not enough uncommitted time'});
 }
 return {date,occupied,blocks:blocks.sort((a,b)=>a.from-b.from),deferred,conflicts,requiresApproval:true};
}
export function shiftBlocks({id,start,end,travel=60,prep=45,recovery=30}){
 const a=time(start),b=time(end);if(b<=a||a<travel+prep||b+recovery>1440)throw Error('Shift outside supported same-day window');
 const fmt=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 return [{id:id+'-prep',start:fmt(a-travel-prep),end:fmt(a-travel)},{id:id+'-travel',start:fmt(a-travel),end:start},{id,start,end},{id:id+'-recovery',start:end,end:fmt(b+recovery)}];
}