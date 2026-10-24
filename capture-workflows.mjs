import {record} from './core.mjs';
const alive=records=>(records||[]).filter(r=>!r.deletedAt);

/** Search user-visible fields only. Private text and metadata never participate. */
export function searchRecords(records,{query='',type='',scopeTypes=null,tag='',from='',to='',includePrivateTitles=false}={}){
 const q=String(query).trim().toLocaleLowerCase(),wantedTag=String(tag).trim().toLocaleLowerCase();
 return alive(records).filter(r=>{
  if(r.sensitive&&!includePrivateTitles)return false;
  if(r.sensitive&&wantedTag)return false;
  if(type&&r.type!==type||Array.isArray(scopeTypes)&&scopeTypes.length&&!scopeTypes.includes(r.type))return false;
  if(from&&(!r.date||r.date<from))return false;
  if(to&&(!r.date||r.date>to))return false;
  if(wantedTag&&!(r.tags||[]).some(x=>String(x).toLocaleLowerCase()===wantedTag))return false;
  if(!q)return true;
  if(r.sensitive)return includePrivateTitles&&String(r.title||'').toLocaleLowerCase().includes(q);
  return `${r.title||''} ${r.body||''} ${(r.tags||[]).join(' ')} ${r.type||''}`.toLocaleLowerCase().includes(q);
 }).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
}

export function inboxItems(records,{state='new',query='',today=new Date().toISOString().slice(0,10)}={}){
 const q=String(query).trim().toLocaleLowerCase();
 return alive(records).filter(r=>{
  const current=r.data?.inboxState||(['note','idea'].includes(r.type)?'new':'sorted');
  const effective=current==='snoozed'&&r.data?.inboxSnoozedUntil&&r.data.inboxSnoozedUntil<=today?'new':current;
  if(state==='snoozed'&&effective!=='snoozed'||state!=='snoozed'&&effective==='snoozed'||state==='new'&&effective!=='new'||state==='sorted'&&effective!=='sorted'||state==='archived'&&effective!=='archived')return false;
  return !q||`${r.title||''} ${r.sensitive?'':r.body||''} ${(r.tags||[]).join(' ')}`.toLocaleLowerCase().includes(q);
 }).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
}

export function updateInboxState(record,state){
 if(!record||record.deletedAt)throw Error('This inbox entry is no longer available.');
 if(!['new','sorted','archived'].includes(state))throw Error('Choose a supported inbox action.');
 return {...record,data:{...record.data,inboxUndo:{state:record.data.inboxState||(['note','idea'].includes(record.type)?'new':'sorted'),tags:[...(record.tags||[])],snoozedUntil:record.data.inboxSnoozedUntil||''},inboxState:state,inboxSnoozedUntil:''}};
}

export function snoozeInboxRecord(record,until,today=new Date().toISOString().slice(0,10)){
 if(!record||record.deletedAt)throw Error('This inbox entry is no longer available.');
 if(!validISODate(until)||until<=today)throw Error('Choose a future date to snooze this entry.');
 return {...record,data:{...record.data,inboxUndo:{state:record.data.inboxState||'new',tags:[...(record.tags||[])],snoozedUntil:record.data.inboxSnoozedUntil||''},inboxState:'snoozed',inboxSnoozedUntil:until}};
}

export function undoInboxChange(record){
 const previous=record?.data?.inboxUndo;
 if(!record||record.deletedAt||!previous)return null;
 const {inboxUndo,...data}=record.data;
 return {...record,tags:Array.isArray(previous.tags)?previous.tags:record.tags,data:{...data,inboxState:previous.state||'new',inboxSnoozedUntil:previous.snoozedUntil||''}};
}

export function editInboxLabels(record,labels,{mode='add'}={}){
 if(!record||record.deletedAt)throw Error('This inbox entry is no longer available.');
 const clean=[...new Set(labels.map(x=>String(x).trim()).filter(Boolean))];
 if(!clean.length||clean.some(x=>x.length>40)||clean.length>20)throw Error('Enter 1–20 labels, each no longer than 40 characters.');
 let tags=[...(record.tags||[])];
 if(mode==='add')tags=[...new Set([...tags,...clean])];
 else if(mode==='remove')tags=tags.filter(x=>!clean.includes(x));
 else if(mode==='replace')tags=[...new Set(clean)];
 else throw Error('Choose add, remove, or replace labels.');
 return {...record,tags,data:{...record.data,inboxUndo:{state:record.data.inboxState||'new',tags:[...(record.tags||[])],snoozedUntil:record.data.inboxSnoozedUntil||''}}};
}

export function convertInboxRecord(source,target,{amountCents=null}={}){
 if(!source||source.deletedAt)throw Error('This inbox entry is no longer available.');
 const targets=['task','project','event','transaction','memory'];
 if(!targets.includes(target))throw Error('Choose a supported destination.');
 if(target==='transaction'&&(!Number.isSafeInteger(amountCents)||amountCents<1))throw Error('Enter the expense amount before converting this entry.');
 const data=target==='transaction'?{amount:amountCents,direction:'Expense',scope:'Personal',category:'Other',inboxState:'sorted',convertedFromId:source.id}:{...source.data,inboxState:'sorted',convertedFromId:source.id};
 const converted=record(target,{title:source.title,body:source.body,date:source.date||'',tags:[...new Set([...(source.tags||[]),`From ${source.type}`])],links:[source.id],sensitive:source.sensitive,status:'Next',data});
 return {converted,source:{...source,data:{...source.data,inboxUndo:{state:source.data.inboxState||'new',tags:[...(source.tags||[])],snoozedUntil:source.data.inboxSnoozedUntil||''},inboxState:'sorted',inboxSnoozedUntil:'',inboxConvertedToId:converted.id}}};
}

export function undoInboxConversion(source,target){
 if(!source||!target||source.data?.inboxConvertedToId!==target.id||target.data?.convertedFromId!==source.id)return null;
 const restored=undoInboxChange(source);if(!restored)return null;
 const {inboxConvertedToId,...data}=restored.data;
 return {source:{...restored,data},target:{...target,deletedAt:new Date().toISOString()}};
}

const validISODate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
