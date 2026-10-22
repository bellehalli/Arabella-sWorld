// Local reminders: read-only evaluation. Browser notifications require explicit permission
// and work only while the page is open. No push service or background worker.
const time=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s))?s:null;
export function upcomingReminders(records,now=new Date(),leadMinutes=30){
 const horizon=now.getTime()+Math.max(0,Math.min(1440,leadMinutes))*60000;
 return records.filter(r=>!r.deletedAt&&r.status!=='Done'&&['event','bill','application','task'].includes(r.type)).map(r=>{
 const t=time(r.data?.time);const date=r.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const at=new Date(date+'T'+(t||'09:00')+':00');if(Number.isNaN(at.getTime()))return null;
 return {id:r.id,title:r.title,at:at.getTime(),kind:r.type,hasTime:!!t};
 }).filter(Boolean).filter(x=>x.at>=now.getTime()&&x.at<=horizon).sort((a,b)=>a.at-b.at);
}
export function overdueItems(records,date){return records.filter(r=>!r.deletedAt&&r.status!=='Done'&&['task','bill','application'].includes(r.type)&&r.date<date).sort((a,b)=>a.date.localeCompare(b.date));}
