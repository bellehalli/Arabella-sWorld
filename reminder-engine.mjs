// Local reminders: read-only evaluation. Browser notifications require explicit permission
// and work only while the page is open. No push service or background worker.
const time=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s))?s:null;
const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function upcomingReminders(records,now=new Date(),leadMinutes=30){
 const horizon=now.getTime()+Math.max(0,Math.min(1440,leadMinutes))*60000;
 return records.filter(r=>!r.deletedAt&&(r.type==='policy'?r.data?.remind===true&&!!r.data?.review:r.status!=='Done'&&['event','bill','application','task'].includes(r.type))).map(r=>{
 const t=time(r.data?.time);const date=r.type==='policy'?r.data?.review:r.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const at=new Date(date+'T'+(t||'09:00')+':00');if(Number.isNaN(at.getTime()))return null;
 return {id:r.id,title:r.type==='policy'?`Review my policy: ${r.title}`:r.title,at:at.getTime(),date,kind:r.type,hasTime:!!t};
 }).filter(Boolean).filter(x=>x.kind==='policy'&&x.date===localDay(now)||x.at>=now.getTime()&&x.at<=horizon).sort((a,b)=>a.at-b.at);
}
export function overdueItems(records,date){return records.filter(r=>!r.deletedAt&&(r.type==='policy'?r.data?.remind===true&&r.data?.review<date:r.status!=='Done'&&['task','bill','application'].includes(r.type)&&r.date<date)).sort((a,b)=>(a.type==='policy'?a.data.review:a.date).localeCompare(b.type==='policy'?b.data.review:b.date));}
