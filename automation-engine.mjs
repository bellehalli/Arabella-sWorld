import {record,validDate} from './core.mjs';
const alive=records=>(records||[]).filter(r=>!r.deletedAt);
const energyLevel={Low:1,Medium:2,High:3};
const triggerKinds=new Set(['application-submitted','due-soon','goal-complete','low-energy-rescue','task-completed','mood-check-in','savings-target','record-created','record-updated','status-changed','date-arrived','scheduled-review']);
const actions=new Set(['create-task','prepare-review','create-note']);
const actionFor=rule=>rule?.actionType||'create-task';
const conditionFields=new Set(['status','category','priority','energy','type','tag','favorite']);
const dateAdd=(date,days)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
const hasRun=(runs,token)=>runs.some(x=>x.token===token);
const pad=x=>String(x).padStart(2,'0');
function localDate(at,timezone){try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone||undefined,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at),v=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${v.year}-${v.month}-${v.day}`;}catch{return at.toISOString().slice(0,10);}}
export function quietHoursActive(rule,at=new Date()){
 const start=rule?.quietStart||'',end=rule?.quietEnd||'';if(!start&&!end)return false;
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||start===end)return false;
 let hm;try{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:rule.timezone||undefined,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at),v=Object.fromEntries(parts.map(x=>[x.type,x.value]));hm=`${v.hour}:${v.minute}`;}catch{hm=`${pad(at.getHours())}:${pad(at.getMinutes())}`;}
 return start<end?hm>=start&&hm<end:hm>=start||hm<end;
}
export const automationTriggers=[
 {id:'application-submitted',label:'Application is marked Applied',sourceType:'application'},
 {id:'due-soon',label:'A saved task, bill or event is coming up',sourceType:'task, bill or event'},
 {id:'goal-complete',label:'A goal reaches 100% progress',sourceType:'goal'},
 {id:'low-energy-rescue',label:'I choose Low Energy preview',sourceType:'open tasks'},
 {id:'task-completed',label:'A task is completed',sourceType:'task'},
 {id:'mood-check-in',label:'A mood check-in is saved today',sourceType:'mood'},
 {id:'savings-target',label:'A savings wish reaches its target',sourceType:'savings'},
 {id:'record-created',label:'A supported record is added',sourceType:'nonprivate records'},
 {id:'record-updated',label:'A supported record is edited',sourceType:'nonprivate records'},
 {id:'status-changed',label:'A supported record changes status',sourceType:'nonprivate records'},
 {id:'date-arrived',label:'A saved date arrives',sourceType:'dated records'},
 {id:'scheduled-review',label:'A daily scheduled review time arrives',sourceType:'daily local schedule'}
];
export const automationActions=[
 {id:'create-task',label:'Create a linked task'},
 {id:'prepare-review',label:'Prepare a reflection page'},
 {id:'create-note',label:'Add a note to my inbox'}
];
export function parseAutomationConditions(text=''){
 const rows=String(text).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 return rows.map(line=>{const [field,operator,value,...extra]=line.split('|').map(x=>x.trim());if(extra.length||!conditionFields.has(field)||!['equals','contains'].includes(operator)||!value||field==='favorite'&&operator!=='equals')throw Error(`Invalid condition “${line}”. Use field | equals/contains | value.`);return {field,operator,value};});
}
const fieldValue=(source,field)=>field==='type'?source.type:field==='status'?source.status:field==='energy'?source.energy:field==='favorite'?String(!!source.favorite):field==='tag'?source.tags||[]:source.data?.[field];
function matchesConditions(source,rule){const cs=Array.isArray(rule.conditions)?rule.conditions:[];if(!cs.length)return true;const results=cs.map(c=>{const got=fieldValue(source,c.field);return c.operator==='contains'?Array.isArray(got)?got.includes(c.value):String(got??'').toLowerCase().includes(String(c.value).toLowerCase()):String(got??'').toLowerCase()===String(c.value).toLowerCase();});return rule.conditionMode==='any'?results.some(Boolean):results.every(Boolean);}
function sourceCandidates(rule,records,{today,energy,at=new Date()}={}){
 const within=Math.max(1,Math.min(30,Number(rule.withinDays)||3));
 let rows=rule.trigger==='application-submitted'?records.filter(r=>r.type==='application'&&r.status==='Applied'):
  rule.trigger==='due-soon'?records.filter(r=>['task','bill','event'].includes(r.type)&&r.status!=='Done'&&validDate(r.date)&&r.date>=today&&r.date<=dateAdd(today,within)):
  rule.trigger==='goal-complete'?records.filter(r=>r.type==='goal'&&Number(r.data?.progress)>=100):
  rule.trigger==='task-completed'?records.filter(r=>r.type==='task'&&r.status==='Done'):
  rule.trigger==='mood-check-in'?records.filter(r=>r.type==='mood'&&r.date===today):
  rule.trigger==='savings-target'?records.filter(r=>r.type==='saving'&&Number(r.data?.target)>0&&Number(r.data?.amount)>=Number(r.data.target)):
  rule.trigger==='record-created'?records.filter(r=>r.createdAt&&Date.parse(r.createdAt)>=Date.parse(rule.createdAt||0)&&!r.data?.automationRuleId):
  rule.trigger==='record-updated'?records.filter(r=>r.updatedAt&&Date.parse(r.updatedAt)>Date.parse(rule.createdAt||0)&&!r.data?.automationRuleId):
  rule.trigger==='status-changed'?records.filter(r=>r.data?.statusChangedAt&&Date.parse(r.data.statusChangedAt)>Date.parse(rule.createdAt||0)&&!r.data?.automationRuleId):
  rule.trigger==='date-arrived'?records.filter(r=>validDate(r.date)&&r.date===today):
  rule.trigger==='scheduled-review'?records.filter(r=>!r.sensitive&&r.type==='task'&&r.status!=='Done'&&validDate(r.date)&&r.date<=today):
  rule.trigger==='low-energy-rescue'?records.filter(r=>r.type==='task'&&r.status!=='Done'&&(energyLevel[r.energy]||2)<=(energyLevel[energy]||1)):[ ];
 rows=rows.filter(r=>!r.sensitive&&matchesConditions(r,rule));
 if(rule.trigger==='low-energy-rescue')rows.sort((a,b)=>(validDate(a.date)?a.date:'9999-12-31').localeCompare(validDate(b.date)?b.date:'9999-12-31')||(b.favorite?1:0)-(a.favorite?1:0)).splice(1);
 return rows;
}
export function previewAutomations(state,{today=new Date().toISOString().slice(0,10),energy='Low',at=new Date(),allowInteractive=true}={}){
 if(!validDate(today))throw Error('Choose a valid preview date.');
 if(state.settings?.automationsPaused)return [];
 const records=alive(state.records||[]),runs=state.runs||[],proposals=[];
 for(const rule of (state.rules||[]).filter(r=>r.enabled&&r.automationVersion===1&&triggerKinds.has(r.trigger)&&actions.has(actionFor(r))&&(allowInteractive||r.trigger!=='low-energy-rescue'))){
  if(quietHoursActive(rule,at))continue;
  const cap=Math.max(1,Math.min(25,Number(rule.maxRunsPerDay)||5)),zoneDay=localDate(at,rule.timezone);
  const completedCount=runs.filter(x=>x.ruleId===rule.id&&['approve','dismiss'].includes(x.decision)&&localDate(new Date(x.at),rule.timezone)===zoneDay).length;
  const queuedCount=(state.approvals||[]).filter(x=>x.ruleId===rule.id&&['pending','retry','snoozed'].includes(x.status)&&x.createdAt&&localDate(new Date(x.createdAt),rule.timezone)===zoneDay).length;
  if(completedCount+queuedCount>=cap)continue;
  if(rule.trigger==='scheduled-review'&&rule.scheduleTime){let hm;try{hm=new Intl.DateTimeFormat('en-GB',{timeZone:rule.timezone||undefined,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);}catch{continue;}if(hm<rule.scheduleTime)continue;}
  const candidates=sourceCandidates(rule,records,{today,energy,at});
  for(const source of candidates){
   const eventKey=['record-created'].includes(rule.trigger)?source.createdAt||source.id:rule.trigger==='status-changed'?source.data.statusChangedAt:['record-updated','task-completed'].includes(rule.trigger)?source.updatedAt||source.date||today:rule.trigger==='scheduled-review'?localDate(at,rule.timezone):rule.trigger==='mood-check-in'||rule.trigger==='date-arrived'?today:source.date||today;
   const token=`automation:${rule.id}:${source.id}:${rule.trigger}:${eventKey}`;
   if(hasRun(runs,token)||records.some(r=>r.data?.automationProposalId===token))continue;
   const date=rule.trigger==='application-submitted'?dateAdd(validDate(source.date)?source.date:today,Math.max(1,Math.min(90,Number(rule.delayDays)||7))):validDate(source.date)?source.date:today;
   const actionType=actionFor(rule),title=actionType==='prepare-review'?`Reflect on: ${source.title}`:actionType==='create-note'?`Remember: ${source.title}`:rule.trigger==='application-submitted'?`Follow up: ${source.title}`:rule.trigger==='goal-complete'?`Celebrate and reflect: ${source.title}`:rule.trigger==='low-energy-rescue'?`One gentle step: ${source.title}`:`Prepare for: ${source.title}`;
   const action=automationActions.find(x=>x.id===actionType)?.label||'Create a local item';
   proposals.push({proposalId:token,ruleId:rule.id,ruleName:rule.name,sourceId:source.id,sourceType:source.type,title,date,minutes:rule.trigger==='low-energy-rescue'?Math.min(15,source.minutes||15):15,reason:`${rule.name}: ${source.title}`,actionType,energy,action:`${action}. Review and approve this suggestion before it is saved.`});
   if(completedCount+queuedCount+proposals.filter(p=>p.ruleId===rule.id).length>=cap)break;
  }
 }
 return proposals;
}
export function decideAutomationProposal(state,proposal,decision,{today=new Date().toISOString().slice(0,10),at=new Date().toISOString()}={}){
 if(!['approve','dismiss'].includes(decision))throw Error('Choose approve or dismiss.');
 const rule=state.rules?.find(r=>r.id===proposal?.ruleId&&r.automationVersion===1&&r.enabled);if(!proposal?.proposalId||!rule||!actions.has(proposal.actionType))throw Error('This automation suggestion is no longer available.');
 if(hasRun(state.runs||[],proposal.proposalId))return {changed:false,item:null};
 const source=alive(state.records||[]).find(r=>r.id===proposal.sourceId);if(!source||source.sensitive||!matchesConditions(source,rule))throw Error('The source entry is missing, private, or no longer matches. Preview the rule again.');
 if(!validDate(today)||!validDate(proposal.date))throw Error('The suggestion date is invalid. Preview the rule again.');
 if(actionFor(rule)!==proposal.actionType||!sourceCandidates(rule,[source],{today,energy:proposal.energy||'Low'}).length)throw Error('The source no longer matches this rule. Preview again.');
 let item=null;if(decision==='approve'){
  const type=proposal.actionType==='prepare-review'?'review':proposal.actionType==='create-note'?'note':'task';
  const data={automationRuleId:proposal.ruleId,automationProposalId:proposal.proposalId};if(type==='task')data.priority='Gentle';
  item=record(type,{title:proposal.title,date:proposal.date,minutes:proposal.minutes,links:[source.id],tags:['Automation Atelier',proposal.ruleName],body:proposal.reason,data});state.records.push(item);
 }
 state.runs.push({id:`run-${proposal.proposalId.replace(/[^\w-]/g,'-')}`,token:proposal.proposalId,ruleId:proposal.ruleId,at,result:decision==='approve'?`Approved by user; created linked ${proposal.actionType} “${proposal.title}”`:'Dismissed by user; no record created',decision,dryRun:false,changedRecordIds:item?[item.id]:[]});
 return {changed:true,item};
}

export function queueAutomationProposals(state,proposals,{at=new Date().toISOString()}={}){
 if(!Array.isArray(state.approvals))state.approvals=[];
 const known=new Set(state.approvals.map(x=>x.proposalId).filter(Boolean)),queued=[];
 for(const p of proposals||[]){if(!p?.proposalId||known.has(p.proposalId))continue;const row={id:`approval-${p.proposalId}`,kind:'automation',status:'pending',createdAt:at,updatedAt:at,snoozedUntil:'',attempts:0,proposalId:p.proposalId,title:p.title,date:p.date,sourceId:p.sourceId,ruleId:p.ruleId,payload:structuredClone(p)};state.approvals.push(row);queued.push(row);known.add(p.proposalId);}
 return queued;
}

export function decideApproval(state,id,decision,{until='',at=new Date().toISOString()}={}){
 const row=state.approvals?.find(x=>x.id===id);if(!row)throw Error('Approval item is no longer available.');
 if(decision==='undo'){if(!['dismissed','snoozed'].includes(row.status))throw Error('Only a dismissed or snoozed item can be restored.');row.status='pending';row.snoozedUntil='';row.updatedAt=at;return row;}
 if(decision==='snooze'){if(!validDate(until))throw Error('Choose a valid snooze date.');row.status='snoozed';row.snoozedUntil=until;row.updatedAt=at;return row;}
 if(!['approve','dismiss'].includes(decision))throw Error('Choose approve, dismiss, snooze, or undo.');
 row.status=decision==='approve'?'approved':'dismissed';row.snoozedUntil='';row.updatedAt=at;
 state.approvalHistory ||= [];state.approvalHistory.push({id:`${row.id}:${at}`,approvalId:row.id,decision,at,previousStatus:'pending',title:row.title});state.approvalHistory=state.approvalHistory.slice(-500);
 return row;
}

export function recordAutomationFailure(state,proposalId,message,{at=new Date().toISOString()}={}){
 const approval=state.approvals?.find(x=>x.proposalId===proposalId);if(!approval)throw Error('Automation approval is no longer available.');
 approval.attempts=Math.min(3,(Number(approval.attempts)||0)+1);approval.lastError=String(message||'Automation action failed').slice(0,300);approval.updatedAt=at;
 if(approval.attempts>=3){approval.status='failed';approval.retryAt='';}else{approval.status='retry';approval.retryAt=new Date(Date.parse(at)+Math.min(60,5*2**(approval.attempts-1))*60000).toISOString();}
 state.runs ||= [];state.runs.push({id:`failure-${proposalId}-${approval.attempts}`,token:proposalId+':failure:'+approval.attempts,proposalId,ruleId:approval.ruleId,at,result:`Failed attempt ${approval.attempts}/3: ${approval.lastError}`,decision:'failure',attempt:approval.attempts});state.runs=state.runs.slice(-1000);
 return approval;
}
