import {uid,record} from './core.mjs';

const alive=rows=>(rows||[]).filter(x=>!x.deletedAt);
const validName=value=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=80;
const dateOk=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;

export function saveCollection(collections,{id=uid(),name,description='',recordIds=[]}={}){
 if(!validName(name)||typeof description!=='string'||description.length>500)throw Error('Give this collection a name and keep its description under 500 characters.');
 const existing=(collections||[]).find(x=>x.id===id);
 return [...(collections||[]).filter(x=>x.id!==id),{id,name:name.trim(),description:description.trim(),recordIds:[...new Set(recordIds.filter(x=>typeof x==='string'))]}];
}
export function setCollectionMembers(collections,id,recordIds){
 const collection=(collections||[]).find(x=>x.id===id);if(!collection)throw Error('That collection no longer exists.');
 return (collections||[]).map(x=>x.id===id?{...x,recordIds:[...new Set(recordIds.filter(y=>typeof y==='string'))]}:x);
}
export function deleteCollection(collections,id){return (collections||[]).filter(x=>x.id!==id);}

export function recordTemplate({name,source}){
 if(!validName(name)||!source||typeof source.type!=='string'||source.sensitive)throw Error('Name the template and choose a non-sensitive source record.');
 return {id:uid(),name:name.trim(),type:source.type,values:{title:source.title,body:source.body,tags:[...(source.tags||[])],data:structuredClone(source.data||{})},createdAt:new Date().toISOString()};
}
export function applyRecordTemplate(template){
 if(!template||!validName(template.name)||!template.values||typeof template.type!=='string')throw Error('This template is incomplete.');
 return {type:template.type,...structuredClone(template.values),date:'',status:'Next',links:[],sensitive:false};
}

export function backlinks(records,id){
 const rows=alive(records),target=rows.find(x=>x.id===id);if(!target)return [];
 return rows.filter(x=>x.id!==id&&(x.links||[]).includes(id)||(x.id!==id&&(target.links||[]).includes(x.id)))
  .map(x=>({record:x,direction:(target.links||[]).includes(x.id)?'outgoing':'incoming'}));
}
export function relationshipGraph(records,{rootId='',maxNodes=100}={}){
 const rows=alive(records).filter(x=>!x.sensitive).slice(0,Math.max(1,Math.min(300,maxNodes))),ids=new Set(rows.map(x=>x.id));
 const nodes=rootId?rows.filter(x=>x.id===rootId||backlinks(rows,rootId).some(y=>y.record.id===x.id)):rows;
 const keep=new Set(nodes.map(x=>x.id)),edges=[];
 for(const x of nodes)for(const id of x.links||[])if(ids.has(id)&&keep.has(id)&&x.id<id)edges.push({from:x.id,to:id});
 return {nodes:nodes.map(x=>({id:x.id,title:x.title,type:x.type})),edges};
}

export function duplicateCandidates(records){
 const rows=alive(records).filter(x=>!x.sensitive&&!x.data?.duplicateReview&&x.title?.trim()),groups=new Map();
 for(const x of rows){const key=`${x.type}:${normalizeTitle(x.title)}`;const group=groups.get(key)||[];group.push(x);groups.set(key,group);}
 return [...groups.values()].filter(x=>x.length>1).flatMap(group=>group.slice(1).map((copy,i)=>({keep:group[0],duplicate:copy,key:`${group[0].id}:${copy.id}`})));
}
export function mergeDuplicateRecords(keep,duplicate,{at=new Date().toISOString()}={}){
 if(!keep||!duplicate||keep.id===duplicate.id||keep.type!==duplicate.type||keep.sensitive||duplicate.sensitive||normalizeTitle(keep.title)!==normalizeTitle(duplicate.title))throw Error('These records are not a safe duplicate pair.');
 const body=[keep.body,duplicate.body].filter((x,i,a)=>x&&a.indexOf(x)===i).join('\n\n--- Preserved from duplicate ---\n\n');
 const merged={...keep,body,tags:[...new Set([...(keep.tags||[]),...(duplicate.tags||[])])],links:[...new Set([...(keep.links||[]),...(duplicate.links||[]).filter(x=>x!==keep.id)])],data:{...keep.data,mergedRecordIds:[...new Set([...(keep.data?.mergedRecordIds||[]),duplicate.id])]},updatedAt:at};
 const archived={...duplicate,deletedAt:at,data:{...duplicate.data,mergedInto:keep.id}};
 return {keep:merged,duplicate:archived};
}
const normalizeTitle=value=>String(value||'').normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g,' ');

export function validateCustomFields(fields){
 if(!Array.isArray(fields)||fields.length>30)throw Error('Add no more than 30 custom fields.');
 const ids=new Set();
 for(const f of fields){if(!f||!/^[-a-z0-9_]{1,40}$/.test(f.id)||ids.has(f.id)||!validName(f.label)||!['text','number','date','select','checkbox'].includes(f.kind))throw Error('Each custom field needs a unique ID, label, and supported type.');ids.add(f.id);if(f.kind==='select'&&(!Array.isArray(f.options)||f.options.length<1||f.options.length>20||f.options.some(x=>typeof x!=='string'||!x.trim()||x.length>80)))throw Error('Select fields need 1–20 short options.');}
 return fields;
}

export function futureLetter({title,body,revealDate,today}){
 if(typeof title!=='string'||!title.trim()||title.length>240||typeof body!=='string'||!body.trim()||body.length>20000)throw Error('Add a title and letter, up to 20,000 characters.');
 if(!dateOk(revealDate)||!dateOk(today)||revealDate<today)throw Error('Choose a valid reveal date today or later.');
 return record('note',{title:title.trim(),body,date:today,tags:['Future Self','Sealed Letter'],sensitive:true,data:{inboxState:'sorted',futureLetter:{revealDate,status:'sealed',revealedAt:''}}});
}
export function dueFutureLetters(records,today){return alive(records).filter(x=>x.type==='note'&&x.sensitive&&x.data?.futureLetter?.status==='sealed'&&dateOk(x.data.futureLetter.revealDate)&&x.data.futureLetter.revealDate<=today);}
export function revealFutureLetter(item,today){if(!item?.data?.futureLetter||item.data.futureLetter.revealDate>today)return null;return {...item,data:{...item.data,futureLetter:{...item.data.futureLetter,status:'revealed',revealedAt:today}}};}
export function annualMoments(records,year){
 if(!Number.isInteger(year)||year<1900||year>9999)throw Error('Choose a valid year.');
 const rows=alive(records).filter(x=>!x.sensitive&&x.date?.startsWith(`${year}-`)&&['memory','diary','journal','experience'].includes(x.type));
 return Array.from({length:12},(_,i)=>({month:i+1,items:rows.filter(x=>Number(x.date.slice(5,7))===i+1).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({id:x.id,type:x.type,title:x.title,date:x.date,excerpt:String(x.body||'').slice(0,220)}))})).filter(x=>x.items.length);
}
