// Additive, versioned data contracts for executive work and income workflows.
// Migrations never infer actual pay, confirmed shifts, or verified prospect data.
const versions={shift:1,earnings:1,lead:1,studioOutreach:1,client:1,proposal:1,invoice:1};
export const workflowSchemaVersions=Object.freeze({...versions});

export function migrateWorkflowRecord(input){
 if(!input||!versions[input.type])return input;
 const record=structuredClone(input),data={...(record.data||{})};
 if(input.type==='shift'){
  if(!data.shiftStatus)data.shiftStatus='Tentative';
  data.breakMinutes=Number.isInteger(data.breakMinutes)&&data.breakMinutes>=0?data.breakMinutes:0;
  data.transitMode=typeof data.transitMode==='string'?data.transitMode:'';
  data.employer=typeof data.employer==='string'?data.employer:'';
  data.checkIn=typeof data.checkIn==='string'?data.checkIn:'';
 }else if(input.type==='earnings'){
  if(!['Expected','Received','Unverified'].includes(data.payoutStatus))data.payoutStatus='Unverified';
  data.paidAt=typeof data.paidAt==='string'?data.paidAt:'';
  data.payPeriodId=typeof data.payPeriodId==='string'?data.payPeriodId:'';
  for(const field of ['wagesCents','cashTipsCents','cardTipsCents','tipOutCents','withheldCents','netPaidCents'])if(!Number.isSafeInteger(data[field])||data[field]<0)data[field]=null;
 }else if(input.type==='lead'){
  if(!['sourced','verified','qualified','ready','contacted','replied','discovery','proposal','negotiation','won','lost','nurture'].includes(data.pipelineStage))data.pipelineStage='sourced';
  data.contactVerified=data.contactVerified===true;
  data.suppressContact=data.suppressContact===true;
  data.lastVerifiedDate=typeof data.lastVerifiedDate==='string'?data.lastVerifiedDate:'';
  data.sourceUrl=typeof data.sourceUrl==='string'?data.sourceUrl:'';
  data.problemObserved=typeof data.problemObserved==='string'?data.problemObserved:'';
  if(data.score!==undefined&&(!Number.isFinite(Number(data.score))||Number(data.score)<0||Number(data.score)>10)){data.unvalidatedScore=data.score;delete data.score;}
 }else if(input.type==='studioOutreach'){
  data.sendApproved=false;
  data.optedOut=data.optedOut===true;
  data.bounced=data.bounced===true;
 }
 record.data={...data,workflowVersion:versions[input.type]};
 return record;
}

export function migrateWorkflowState(state){
 const next=structuredClone(state);
 next.records=(next.records||[]).map(migrateWorkflowRecord);
 next.settings={...next.settings,automationsPaused:next.settings?.automationsPaused===true,reminderPreferences:next.settings?.reminderPreferences||{enabled:false,leadMinutes:30,quietStart:'22:00',quietEnd:'08:00'}};
 next.approvals=Array.isArray(next.approvals)?next.approvals:[];
 next.approvalHistory=Array.isArray(next.approvalHistory)?next.approvalHistory:[];
 next.workflowSchemaVersions={...versions};
 return next;
}

export function validateWorkflowRecord(r){
 if(!r||!versions[r.type]||r.data?.workflowVersion===undefined)return true;
 const d=r.data||{};
 if(d.workflowVersion!==versions[r.type])throw Error(`Unsupported ${r.type} workflow version.`);
 if(r.type==='shift'&&!['Confirmed','Tentative'].includes(d.shiftStatus))throw Error('A shift must be confirmed or tentative.');
 if(r.type==='shift'&&(!Number.isInteger(d.breakMinutes)||d.breakMinutes<0||d.breakMinutes>1440))throw Error('Shift break minutes are invalid.');
 if(r.type==='earnings')for(const field of ['wagesCents','cashTipsCents','cardTipsCents','tipOutCents','withheldCents','netPaidCents'])if(d[field]!==null&&(!Number.isSafeInteger(d[field])||d[field]<0))throw Error('A payroll amount must be nonnegative whole cents.');
 if(r.type==='lead'){
  if(!['sourced','verified','qualified','ready','contacted','replied','discovery','proposal','negotiation','won','lost','nurture'].includes(d.pipelineStage))throw Error('A Studio lead has an invalid pipeline stage.');
  if(d.score!==undefined&&(!Number.isFinite(Number(d.score))||Number(d.score)<0||Number(d.score)>10))throw Error('A lead fit score must be from 0 to 10.');
  if(d.contactVerified!==undefined&&typeof d.contactVerified!=='boolean'||d.suppressContact!==undefined&&typeof d.suppressContact!=='boolean')throw Error('Lead contact flags are invalid.');
 }
 if(r.type==='studioOutreach'&&(d.sendApproved!==false||typeof d.optedOut!=='boolean'||typeof d.bounced!=='boolean'))throw Error('Studio outreach must remain an unsent, reviewable draft.');
 return true;
}
