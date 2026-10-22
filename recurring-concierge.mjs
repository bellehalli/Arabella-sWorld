// Deterministic recurrence planner. Produces proposals only, never side effects.
const iso=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));
const utc=s=>new Date(s+'T12:00:00Z');
const fmt=d=>d.toISOString().slice(0,10);
export function recurrenceDates({start,frequency='weekly',interval=1,until,weekdays=[]},from,to){
 if(![start,from,to].every(iso)||until&&!iso(until)||!['daily','weekly','monthly'].includes(frequency)||!Number.isInteger(interval)||interval<1||interval>365||from>to||Date.parse(to)-Date.parse(from)>366*86400000)throw Error('Invalid recurrence');
 const first=utc(start),dates=[];
 for(let d=utc(from);d<=utc(to);d.setUTCDate(d.getUTCDate()+1)){
  const date=fmt(d);if(date<start||until&&date>until)continue;
  const days=Math.round((d-first)/86400000);
  if(frequency==='daily'&&days%interval===0||frequency==='weekly'&&Math.floor(days/7)%interval===0&&(weekdays.length?weekdays.includes(d.getUTCDay()):d.getUTCDay()===first.getUTCDay())||frequency==='monthly'&&((d.getUTCFullYear()-first.getUTCFullYear())*12+d.getUTCMonth()-first.getUTCMonth())%interval===0&&d.getUTCDate()===Math.min(first.getUTCDate(),new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()))dates.push(date);
 }
 return dates;
}
export function recurringProposals(rules,{from,to,existing=[]}){
 const seen=new Set(existing.map(x=>x.proposalId)),out=[];
 for(const rule of rules){if(rule.enabled===false)continue;if(!rule.id||!rule.title||!rule.start)throw Error('Invalid recurrence rule');
  for(const date of recurrenceDates(rule,from,to)){const proposalId=rule.id+':'+date;if(!seen.has(proposalId))out.push({proposalId,ruleId:rule.id,date,title:rule.title,kind:rule.kind||'task',status:'pending',approved:false,requiresApproval:true});}
 }
 return out.sort((a,b)=>a.date.localeCompare(b.date)||a.proposalId.localeCompare(b.proposalId));
}
export function decideProposal(proposal,decision){if(!['approve','reject'].includes(decision)||proposal.status!=='pending')throw Error('Invalid proposal decision');return {...proposal,status:decision==='approve'?'approved':'rejected',approved:decision==='approve',decidedAt:null};}
