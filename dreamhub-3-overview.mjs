// One deterministic, read-only life overview. No notifications, purchases or outreach are executed.
import {planDay} from './executive-day-director.mjs';
import {spendingGuardrail} from './wealth-architect.mjs';
import {followupDrafts,qualifyLead} from './studio-operations.mjs';
import {semester,semesterHours} from './belle-academy.mjs';
import {validateLinks} from './executive-domain.mjs';
const active=records=>records.filter(r=>!r.deletedAt);
const due=(r,date)=>r.date===date||r.data?.followup===date;
const score=r=>({Important:2,'Time-sensitive':3,Gentle:1}[r.data?.priority]||1);
const cents=v=>Number.isSafeInteger(v)&&v>=0?v:0;
export function lifeOverview({records=[],date,receivedCents=0,essentialsCents=0,debtCents=0,taxesCents=0,reserveCents=0,committedCents=0}={}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Invalid overview date');
 const rs=active(records);
 const tasks=rs.filter(r=>r.type==='task'&&r.status!=='Done'&&(!r.date||r.date<=date)).map(r=>({id:r.id,title:r.title,minutes:r.minutes||15,priority:score(r)}));
 const fixed=rs.filter(r=>r.type==='event'&&r.date===date&&/^\d\d:\d\d$/.test(r.data?.time||'')&&/^\d\d:\d\d$/.test(r.data?.endTime||'')).map(r=>({id:r.id,title:r.title,start:r.data.time,end:r.data.endTime}));
 const agenda=planDay({date,start:'10:00',end:'22:00',fixed,tasks});
 const leads=rs.filter(r=>r.type==='lead'||r.type==='client').map(r=>({...r,score:Number(r.data?.score),website:r.data?.url||'',email:r.data?.contact||''}));
 const qualified=leads.filter(r=>Number.isFinite(r.score)&&r.score>=7&&r.score<=10).map(r=>qualifyLead(r));
 const followups=rs.filter(r=>r.type==='lead'&&r.data?.contactedDate).flatMap(r=>followupDrafts({date:r.data.contactedDate,replied:!!r.data.replied,optedOut:!!r.data.optedOut,bounced:!!r.data.bounced,existing:r.data.sentFollowups||[]}).filter(f=>f.date<=date).map(f=>({...f,leadId:r.id,title:r.title})));
 const experiences=rs.filter(r=>['experience','experiencePlan'].includes(r.type)&&due(r,date));
 const learning=rs.filter(r=>['course','lesson','assignment','exam','study','learning'].includes(r.type));
 const guardrail=spendingGuardrail({received:cents(receivedCents),essentials:cents(essentialsCents),debt:cents(debtCents),taxes:cents(taxesCents),reserve:cents(reserveCents),committed:cents(committedCents)});
 return {date,agenda,studio:{qualified,followups,all:leads.length},academy:{items:learning,weeklyHours:semesterHours(semester)},social:{today:experiences},money:guardrail,links:{issues:validateLinks(rs)},requiresApproval:true};
}
export function conciergeSuggestions(overview){
 const out=[];
 if(overview.agenda.conflicts.length)out.push({id:'calendar-conflicts',title:'Review overlapping appointments',reason:'Fixed commitments overlap',priority:'high',approved:false});
 if(overview.agenda.deferred.length)out.push({id:'deferred',title:'Reschedule unfinished priorities',reason:overview.agenda.deferred.length+' tasks need another time',priority:'medium',approved:false});
 if(overview.money.shortfallCents)out.push({id:'protect-essentials',title:'Review essentials before discretionary spending',reason:'Protected commitments exceed received cash',priority:'high',approved:false});
 if(overview.studio.followups.length)out.push({id:'studio-followups',title:'Review Studio follow-up drafts',reason:overview.studio.followups.length+' follow-ups are due; none will send automatically',priority:'medium',approved:false});
 if(!overview.social.today.length)out.push({id:'culture',title:'Plan a free cultural experience',reason:'No experience is planned today; confirm costs and availability yourself',priority:'gentle',approved:false});
 return out;
}
