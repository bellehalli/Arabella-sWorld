export function interviewPrepLog({application,questions='',evidence='',questionsToAsk='',reflection='',followupDraft='',outcome='Preparing',date=''}){
 if(!application||application.type!=='application'||application.deletedAt)throw Error('Choose an active career application first.');
 const fields={questions,evidence,questionsToAsk,reflection,followupDraft};
 if(Object.values(fields).some(x=>typeof x!=='string'||x.length>5000))throw Error('Keep each preparation field under 5,000 characters.');
 if(!['Preparing','Interviewed','Follow-up sent','Offer','No offer'].includes(outcome))throw Error('Choose a supported interview outcome.');
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(`${date}T12:00:00Z`))||new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date))throw Error('Choose a valid interview date.');
 return {title:`Interview preparation · ${application.data?.company||application.title}`,date,body:[questions&&`Questions to prepare:\n${questions}`,evidence&&`Evidence and examples:\n${evidence}`,questionsToAsk&&`Questions for them:\n${questionsToAsk}`,reflection&&`Reflection:\n${reflection}`,followupDraft&&`Follow-up draft:\n${followupDraft}`].filter(Boolean).join('\n\n'),tags:['Career','Interview preparation'],links:[application.id],data:{careerApplicationId:application.id,outcome,interviewDate:date||'',questions,evidence,questionsToAsk,reflection,followupDraft}};
}
