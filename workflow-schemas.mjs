// Additive, versioned data contracts for executive work and income workflows.
// Migrations never infer actual pay, confirmed shifts, or verified prospect data.
const versions={shift:1,earnings:1,lead:1,studioOutreach:1,client:1,proposal:1,invoice:1,mealPlan:1,grocery:1};
const isISODate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
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
 }else if(input.type==='mealPlan'){
  if(!['Breakfast','Lunch','Dinner','Snack'].includes(data.mealType))data.mealType='Dinner';
  if(!Array.isArray(data.ingredients))data.ingredients=[];
  data.ingredients=data.ingredients.filter(x=>typeof x==='string').slice(0,60);
  if(!Number.isInteger(data.servings)||data.servings<1||data.servings>30)data.servings=1;
  if(!Number.isInteger(data.prepMinutes)||data.prepMinutes<0||data.prepMinutes>480)data.prepMinutes=0;
 }else if(input.type==='grocery'){
  if(!['Produce','Protein','Dairy','Pantry','Household','Pet','Other'].includes(data.category))data.category='Other';
  for(const field of ['quantity','unit','neededBy'])if(typeof data[field]!=='string')data[field]='';
  for(const field of ['onHand','reorderAt'])if(data[field]!==null&&(!Number.isFinite(data[field])||data[field]<0))data[field]=null;
  data.checked=data.checked===true;
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
 if(r.type==='mealPlan'&&(!['Breakfast','Lunch','Dinner','Snack'].includes(d.mealType)||!Array.isArray(d.ingredients)||d.ingredients.length>60||d.ingredients.some(x=>typeof x!=='string'||x.length>120)||!Number.isInteger(d.servings)||d.servings<1||d.servings>30||!Number.isInteger(d.prepMinutes)||d.prepMinutes<0||d.prepMinutes>480))throw Error('Meal plan fields are invalid.');
 if(r.type==='grocery'&&(!['Produce','Protein','Dairy','Pantry','Household','Pet','Other'].includes(d.category)||typeof d.quantity!=='string'||d.quantity.length>80||typeof d.unit!=='string'||d.unit.length>40||typeof d.checked!=='boolean'||['onHand','reorderAt'].some(k=>d[k]!==null&&(!Number.isFinite(d[k])||d[k]<0))))throw Error('Grocery stock fields are invalid.');
 if(r.type==='grocery'&&d.neededBy&&!isISODate(d.neededBy))throw Error('A grocery needed-by date is invalid.');
 if(r.type==='studioOutreach'&&(d.sendApproved!==false||typeof d.optedOut!=='boolean'||typeof d.bounced!=='boolean'))throw Error('Studio outreach must remain an unsent, reviewable draft.');
 return true;
}
