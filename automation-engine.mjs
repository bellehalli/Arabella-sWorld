import {record,validDate} from './core.mjs';
const alive=records=>records.filter(r=>!r.deletedAt);
const energyLevel={Low:1,Medium:2,High:3};
const dateAdd=(date,days)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);};
const hasRun=(runs,token)=>runs.some(x=>x.token===token);
const appliedToday=(runs,ruleId,today)=>runs.filter(x=>x.ruleId===ruleId&&String(x.at||'').slice(0,10)===today).length;

export const automationTriggers=[
 {id:'application-submitted',label:'Application is marked Applied',sourceType:'application'},
 {id:'due-soon',label:'A saved task, bill or event is coming up',sourceType:'task, bill or event'},
 {id:'goal-complete',label:'A goal reaches 100% progress',sourceType:'goal'},
 {id:'low-energy-rescue',label:'I choose Low Energy preview',sourceType:'open tasks'}
];

export function previewAutomations(state,{today=new Date().toISOString().slice(0,10),energy='Low'}={}){
 if(!validDate(today))throw Error('Choose a valid preview date.');
 const records=alive(state.records||[]),runs=state.runs||[],proposals=[];
 for(const rule of (state.rules||[]).filter(r=>r.enabled&&r.automationVersion===1)){
  const cap=Math.max(1,Math.min(25,Number(rule.maxRunsPerDay)||5));if(appliedToday(runs,rule.id,today)>=cap)continue;
  const candidates=rule.trigger==='application-submitted'?records.filter(r=>r.type==='application'&&r.status==='Applied'):
   rule.trigger==='due-soon'?records.filter(r=>['task','bill','event'].includes(r.type)&&r.status!=='Done'&&validDate(r.date)&&r.date>=today&&r.date<=dateAdd(today,Math.max(1,Math.min(30,Number(rule.withinDays)||3)))):
   rule.trigger==='goal-complete'?records.filter(r=>r.type==='goal'&&Number(r.data.progress)>=100):
   rule.trigger==='low-energy-rescue'?records.filter(r=>r.type==='task'&&r.status!=='Done'&&!r.sensitive&&(energyLevel[r.energy]||2)<=(energyLevel[energy]||1)).sort((a,b)=>(validDate(a.date)?a.date:'9999-12-31').localeCompare(validDate(b.date)?b.date:'9999-12-31')||(b.favorite?1:0)-(a.favorite?1:0)).slice(0,1):[];
  for(const source of candidates){
   if(source.sensitive)continue;
   const token=`automation:${rule.id}:${source.id}:${rule.trigger}:${source.date||today}`;
   if(hasRun(runs,token)||records.some(r=>r.type==='task'&&r.data?.automationProposalId===token))continue;
   const date=rule.trigger==='application-submitted'?dateAdd(validDate(source.date)?source.date:today,Math.max(1,Math.min(90,Number(rule.delayDays)||7))):validDate(source.date)?source.date:today;
   const title=rule.trigger==='application-submitted'?`Follow up: ${source.title}`:rule.trigger==='goal-complete'?`Celebrate and reflect: ${source.title}`:rule.trigger==='low-energy-rescue'?`One gentle step: ${source.title}`:`Prepare for: ${source.title}`;
   proposals.push({proposalId:token,ruleId:rule.id,ruleName:rule.name,sourceId:source.id,sourceType:source.type,title,date,minutes:rule.trigger==='low-energy-rescue'?Math.min(15,source.minutes||15):15,reason:`${rule.name}: ${source.title}`,action:'Create a linked DreamHub task. Review and approve this suggestion before it is saved.'});
   if(proposals.filter(p=>p.ruleId===rule.id).length>=cap)break;
  }
 }
 return proposals;
}

export function decideAutomationProposal(state,proposal,decision,{today=new Date().toISOString().slice(0,10),at=new Date().toISOString()}={}){
 if(!['approve','dismiss'].includes(decision))throw Error('Choose approve or dismiss.');
 if(!proposal?.proposalId||!state.rules?.some(r=>r.id===proposal.ruleId&&r.automationVersion===1))throw Error('This automation suggestion is no longer available.');
 if(hasRun(state.runs||[],proposal.proposalId))return {changed:false,item:null};
 const source=alive(state.records||[]).find(r=>r.id===proposal.sourceId);
 if(!source||source.sensitive)throw Error('The source entry is missing or private. Preview the rule again.');
 let item=null;if(decision==='approve'){
  item=record('task',{title:proposal.title,date:proposal.date,minutes:proposal.minutes,links:[source.id],tags:['Automation Atelier',proposal.ruleName],body:proposal.reason,data:{priority:'Gentle',automationRuleId:proposal.ruleId,automationProposalId:proposal.proposalId,requiresApproval:false}});
  state.records.push(item);
 }
 state.runs.push({id:`run-${proposal.proposalId.replace(/[^\w-]/g,'-')}`,token:proposal.proposalId,ruleId:proposal.ruleId,at,result:decision==='approve'?`Approved by user; created linked task “${proposal.title}”`:'Dismissed by user; no record created',decision,changedRecordIds:item?[item.id]:[]});
 return {changed:true,item};
}
