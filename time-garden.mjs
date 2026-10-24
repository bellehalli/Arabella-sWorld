// Pure DreamHub scheduling and approval logic. No external network side effects.
const dated=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'));
const validTime=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function timeGarden(records,{from,to,types=['event','task','bill','application','assignment','exam','study','experiencePlan','followup','shift','scheduleDecision']}={}){
 if(!dated(from)||!dated(to)||from>to)throw Error('Invalid calendar range');
 const seen=new Set(),items=[];
 for(const r of records){if(!r||r.deletedAt||!types.includes(r.type))continue;
  const date=r.type==='scheduleDecision'?(r.data?.start||r.date):(r.data?.followup||r.date);
  if(!dated(date)||date<from||date>to||seen.has(r.id))continue;
  seen.add(r.id);items.push({id:r.id,type:r.type,title:r.title||'Untitled',date,time:validTime(r.data?.time)?r.data.time:null,endTime:validTime(r.data?.endTime)?r.data.endTime:null,status:r.status||'Next',source:r.data?.externalProvider?'connected':'dreamhub',externalId:r.data?.externalId||null});
 }
 return items.sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))||a.title.localeCompare(b.title));
}
export function timeConflicts(items){const conflicts=[];
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(a.date!==b.date||!a.time||!b.time||!a.endTime||!b.endTime)continue;if(a.time<b.endTime&&b.time<a.endTime)conflicts.push([a.id,b.id]);}
 return conflicts;
}
export function recurrenceInbox(proposals,records){
 const decisions=new Map(records.filter(r=>r.type==='scheduleDecision'&&!r.deletedAt&&r.data?.proposalId).map(r=>[r.data.proposalId,r]));
 return proposals.filter(p=>p.status==='pending'&&!decisions.has(p.proposalId));
}
export function decideRecurring(proposal,decision,records){
 if(!proposal||!['approve','reject'].includes(decision)||proposal.status!=='pending')throw Error('Invalid decision');
 if(records.some(r=>r.type==='scheduleDecision'&&!r.deletedAt&&r.data?.proposalId===proposal.proposalId))throw Error('This suggestion was already decided');
 const kind=proposal.kind==='event'?'event':'task';
 return {decision:{type:'scheduleDecision',title:proposal.title,date:proposal.date,status:decision==='approve'?'Done':'Closed',data:{proposalId:proposal.proposalId,ruleId:proposal.ruleId,decision,actionType:kind}},item:decision==='approve'?{type:kind,title:proposal.title,date:proposal.date,status:'Next',data:{sourceProposalId:proposal.proposalId}}:null};
}
export const actionTypes=['event','task','note','journal','expense','person','lead','assignment','experiencePlan'];
export function heartAction(type,title,date=''){if(!actionTypes.includes(type))throw Error('Unsupported capture type');if(!String(title||'').trim())throw Error('A title is required');if(date&&!dated(date))throw Error('Invalid date');return {type,title:String(title).trim().slice(0,240),date:date||'',status:'Next'};}
