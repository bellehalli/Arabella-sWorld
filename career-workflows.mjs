export function interviewPrepLog({application,questions='',evidence='',questionsToAsk='',reflection='',followupDraft='',outcome='Preparing',date=''}){
 if(!application||application.type!=='application'||application.deletedAt)throw Error('Choose an active career application first.');
 const fields={questions,evidence,questionsToAsk,reflection,followupDraft};
 if(Object.values(fields).some(x=>typeof x!=='string'||x.length>5000))throw Error('Keep each preparation field under 5,000 characters.');
 if(!['Preparing','Interviewed','Follow-up sent','Offer','No offer'].includes(outcome))throw Error('Choose a supported interview outcome.');
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(`${date}T12:00:00Z`))||new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date))throw Error('Choose a valid interview date.');
 return {title:`Interview preparation · ${application.data?.company||application.title}`,date,body:[questions&&`Questions to prepare:\n${questions}`,evidence&&`Evidence and examples:\n${evidence}`,questionsToAsk&&`Questions for them:\n${questionsToAsk}`,reflection&&`Reflection:\n${reflection}`,followupDraft&&`Follow-up draft:\n${followupDraft}`].filter(Boolean).join('\n\n'),tags:['Career','Interview preparation'],links:[application.id],data:{careerApplicationId:application.id,outcome,interviewDate:date||'',questions,evidence,questionsToAsk,reflection,followupDraft}};
}

const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
export function validateCareerAsset({title,kind='Resume',version='',date='',url='',notes=''}){
 const name=String(title||'').trim(),allowed=['Resume','Portfolio','Work sample','Certificate','Other'];
 if(!name||name.length>160)throw Error('Give this career asset a name under 160 characters.');
 if(!allowed.includes(kind))throw Error('Choose a supported career asset type.');
 if(date&&!validDate(date))throw Error('Choose a valid version date.');
 if(url){let parsed;try{parsed=new URL(url)}catch{throw Error('Use a complete HTTP or HTTPS resource link.')}if(!['http:','https:'].includes(parsed.protocol))throw Error('Use a complete HTTP or HTTPS resource link.');}
 if(String(version).length>100||String(notes).length>3000)throw Error('Keep the version under 100 characters and notes under 3,000 characters.');
 return {title:name,kind,version:String(version).trim(),date:date||'',url,notes:String(notes).trim()};
}

export function dueCareerFollowups(applications,{today}={}){
 if(!validDate(today))throw Error('Choose a valid review date.');
 return applications.filter(x=>x.type==='application'&&!x.deletedAt&&x.status!=='Closed'&&validDate(x.data?.followup)&&x.data.followup<=today)
  .sort((a,b)=>a.data.followup.localeCompare(b.data.followup));
}

// Compare annualized gross compensation using only assumptions the user supplies.
// Benefits and commute are displayed as entered context and are never monetized.
export function compareCompensationOffers(offers){
 if(!Array.isArray(offers)||offers.length<2||offers.length>6)throw Error('Compare 2–6 offers at a time.');
 const names=new Set();
 return offers.map((x,i)=>{
  const name=String(x.name||'').trim(),kind=x.kind||'salary',amount=Number(x.amount),hours=Number(x.hoursPerWeek??40),weeks=Number(x.paidWeeks??52),unpaid=Number(x.unpaidWeeks??0);
  if(!name||name.length>100||names.has(name.toLowerCase()))throw Error(`Offer ${i+1} needs a unique name under 100 characters.`);names.add(name.toLowerCase());
  if(!['salary','hourly'].includes(kind)||!Number.isFinite(amount)||amount<=0||amount>10000000)throw Error(`Offer ${i+1} has an invalid pay type or amount.`);
  if(!Number.isFinite(hours)||hours<1||hours>100||!Number.isInteger(weeks)||weeks<1||weeks>52||!Number.isInteger(unpaid)||unpaid<0||unpaid>52-weeks)throw Error(`Offer ${i+1} has invalid hours or paid/unpaid weeks.`);
  const annualGross=kind==='salary'?Math.round(amount*100):Math.round(amount*100*hours*weeks);
  const effectiveHours=hours*(weeks+unpaid);
  const effectiveHourlyCents=effectiveHours?Math.round(annualGross/effectiveHours):0;
  return {name,kind,annualGrossCents:annualGross,effectiveHourlyCents,hoursPerWeek:hours,paidWeeks:weeks,unpaidWeeks:unpaid,benefits:String(x.benefits||'').trim().slice(0,500),commute:String(x.commute||'').trim().slice(0,300)};
 });
}
