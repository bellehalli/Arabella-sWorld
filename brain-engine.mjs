// ADHD-friendly deterministic day planning: no AI API, no silent calendar writes.
export function planDay(records,date,energy='steady',availableMinutes=180){
 const cap=Math.max(15,Math.min(720,Math.floor(Number(availableMinutes)||180)));
 const appointments=records.filter(r=>!r.deletedAt&&r.type==='event'&&r.date===date).sort((a,b)=>(a.data?.time||'').localeCompare(b.data?.time||''));
 const tasks=records.filter(r=>!r.deletedAt&&r.type==='task'&&r.status!=='Done'&&r.date<=date);
 const weight=r=>(r.favorite?5:0)+(r.data?.priority==='Time-sensitive'?4:r.data?.priority==='Important'?2:0)+(r.date<date?1:0);
 tasks.sort((a,b)=>weight(b)-weight(a)||a.date.localeCompare(b.date));
 const maxTasks=energy==='low'?2:3;
 const focus=energy==='low'?15:energy==='high'?40:25;
 let remaining=cap;const blocks=[];
 for(const task of tasks){if(blocks.length>=maxTasks)break;const requested=Number(task.minutes)||focus;const minutes=Math.min(remaining,Math.max(5,Math.min(90,requested)));if(minutes<5)break;blocks.push({id:task.id,title:task.title,minutes,kind:'focus'});remaining-=minutes;if(remaining>=5){const pause=Math.min(energy==='low'?10:5,remaining);blocks.push({title:'Reset & breathe',minutes:pause,kind:'break'});remaining-=pause;}}
 return {date,energy,appointments,blocks,unscheduled:Math.max(0,tasks.length-blocks.filter(b=>b.kind==='focus').length),availableMinutes:cap,remaining};
}
export function parseCapture(text){const s=String(text||'').trim();if(!s||s.length>240)throw Error('Enter a thought between 1 and 240 characters.');const match=s.match(/\b(\d{4}-\d{2}-\d{2})\b/);return {title:s.replace(/\b\d{4}-\d{2}-\d{2}\b/,'').trim()||s,date:match?.[1]||null,needsReview:true};}
