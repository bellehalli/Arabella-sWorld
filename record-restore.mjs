import {validate} from './core.mjs';
export function previewRestore(current,incoming){
 validate(current);validate(incoming);
 const known=new Map(current.records.map(r=>[r.id,r]));
 const added=[],unchanged=[],conflicts=[];
 for(const r of incoming.records){
  const prior=known.get(r.id);
  if(!prior)added.push(r.id);
  else if(JSON.stringify(prior)===JSON.stringify(r))unchanged.push(r.id);
  else conflicts.push({id:r.id,currentVersion:prior.version,incomingVersion:r.version});
 }
 return {added,unchanged,conflicts,totalIncoming:incoming.records.length,canMerge:conflicts.length===0};
}
export function revisionList(record){
 if(!record||!Array.isArray(record.history))return [];
 return [...record.history.map(x=>({version:x.version,updatedAt:x.updatedAt,title:x.title})),{version:record.version,updatedAt:record.updatedAt,title:record.title}].sort((a,b)=>b.version-a.version);
}
