import {validate} from './core.mjs';
export function auditRecordLinks(state){
 validate(state);const byId=new Map(state.records.map(r=>[r.id,r]));const broken=[],deletedTargets=[],selfLinks=[],duplicateLinks=[];
 for(const source of state.records){const seen=new Set();for(const id of source.links){if(seen.has(id))duplicateLinks.push({from:source.id,to:id});seen.add(id);if(id===source.id)selfLinks.push({from:source.id,to:id});const target=byId.get(id);if(!target)broken.push({from:source.id,to:id});else if(target.deletedAt&&!source.deletedAt)deletedTargets.push({from:source.id,to:id});}}
 return {broken,deletedTargets,selfLinks,duplicateLinks,clean:![broken,deletedTargets,selfLinks,duplicateLinks].some(x=>x.length)};
}
export function previewLinkRepair(state){
 const issues=auditRecordLinks(state),removals=new Map();
 for(const item of [...issues.broken,...issues.selfLinks,...issues.duplicateLinks]){if(!removals.has(item.from))removals.set(item.from,new Set());removals.get(item.from).add(item.to);}
 return {issues,proposed:[...removals].map(([recordId,ids])=>({recordId,remove:[...ids]})),requiresApproval:true};
}
