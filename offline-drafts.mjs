// A conservative draft queue: never automatically overwrites remote changes.
// User-owned drafts are kept on this device until explicitly reconciled.
export function queueKey(ownerId){if(!/^[0-9a-f-]{36}$/i.test(ownerId))throw Error('Invalid owner.');return 'dreamhub-offline:'+ownerId;}
export function enqueueDraft(storage,ownerId,draft){
 if(!draft||typeof draft.recordId!=='string'||!Number.isInteger(draft.baseVersion)||draft.baseVersion<0||typeof draft.body!=='string')throw Error('Invalid offline draft.');
 const key=queueKey(ownerId),items=JSON.parse(storage.getItem(key)||'[]');
 if(!Array.isArray(items)||items.length>=100)throw Error('Offline queue is full. Export drafts before adding more.');
 if(items.some(x=>x.recordId===draft.recordId))throw Error('An unsynced draft for this record already exists. Resolve it first.');
 const item={recordId:draft.recordId,baseVersion:draft.baseVersion,body:draft.body,createdAt:new Date().toISOString()};
 items.push(item);storage.setItem(key,JSON.stringify(items));return item;
}
export function pendingDrafts(storage,ownerId){const list=JSON.parse(storage.getItem(queueKey(ownerId))||'[]');if(!Array.isArray(list))throw Error('Invalid draft queue.');return list;}
export function planReconciliation(drafts,remoteRecords){
 const map=new Map(remoteRecords.map(r=>[r.id,r]));
 return drafts.map(d=>{
  const remote=map.get(d.recordId);
  return {recordId:d.recordId,status:!remote?'missing':remote.version!==d.baseVersion?'conflict':'ready',local:d,remoteVersion:remote?.version??null};
 });
}
export function removeQueuedDraft(storage,ownerId,recordId){
 const key=queueKey(ownerId),list=pendingDrafts(storage,ownerId);
 storage.setItem(key,JSON.stringify(list.filter(x=>x.recordId!==recordId)));
}
