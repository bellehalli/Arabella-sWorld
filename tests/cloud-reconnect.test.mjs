import test from 'node:test';
import assert from 'node:assert/strict';
import {CloudStore} from '../cloud.mjs';
import {openCloudDraftStorage} from '../cloud-draft-storage.mjs';
import {blank,record} from '../core.mjs';

function sharedBackend(initial=blank()){
 const backend={state:structuredClone(initial),revision:initial.revision||0,offline:false};
 const client={
  from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>backend.offline?{data:null,error:{message:'network request failed'}}:{data:backend.state?{payload:structuredClone(backend.state),revision:backend.revision}:null,error:null}};},
  async rpc(_name,{p_expected,p_payload}){if(backend.offline)return {data:null,error:{message:'network request failed'}};if(p_expected!==backend.revision)return {data:null,error:{message:'VERSION_CONFLICT'}};backend.state=structuredClone(p_payload);backend.revision++;return {data:null,error:null};}
 };
 return {backend,client};
}
const memoryStorage=()=>{const values=new Map();return {get length(){return values.size;},key:index=>[...values.keys()][index]??null,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const makeStore=(client,storage)=>new CloudStore(client,{id:'123e4567-e89b-12d3-a456-426614174000'},blank(),storage);

test('two signed-in devices can save separate records into the shared workspace',async()=>{
 const {backend,client}=sharedBackend(),one=makeStore(client,memoryStorage()),two=makeStore(client,memoryStorage());
 await one.refresh();await two.refresh();
 await one.put(record('note',{title:'From device one'}),null);
 await two.put(record('note',{title:'From device two'}),null);
 assert.deepEqual(backend.state.records.map(x=>x.title).sort(),['From device one','From device two']);
});

test('a stale second-device edit is retained as a conflict and needs a choice',async()=>{
 const initial=blank();initial.records.push(record('note',{id:'shared-note',title:'Original'}));
 const {backend,client}=sharedBackend(initial),one=makeStore(client,memoryStorage()),two=makeStore(client,memoryStorage());
 await one.refresh();await two.refresh();
 const first=structuredClone(one.state.records[0]),second=structuredClone(two.state.records[0]);first.title='Device one edit';second.title='Device two edit';
 await one.put(first,first.version);
 await assert.rejects(two.put(second,second.version),/changed in another tab/);
 assert.equal(backend.state.records[0].title,'Device one edit');
});

test('an offline editor save persists in the reconnect queue and syncs on reconnect',async()=>{
 const {backend,client}=sharedBackend(),storage=memoryStorage(),store=makeStore(client,storage),original=globalThis.navigator;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
 try{
  backend.offline=true;const draft=record('note',{title:'Saved offline'});await store.put(draft,null);
  assert.equal(store.pending.length,1);assert.match(storage.getItem(store.queueKey),/Saved offline/);
  backend.offline=false;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  await store.syncPending();assert.equal(store.pending.length,0);assert.equal(backend.state.records[0].title,'Saved offline');
 }finally{if(original===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:original});}
});

test('cloud reconnect queue is encrypted at rest and remains available after reopening',async()=>{
 const {backend,client}=sharedBackend(),raw=memoryStorage(),owner='123e4567-e89b-12d3-a456-426614174000',key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),keyProvider=async()=>key,protectedStorage=await openCloudDraftStorage(raw,owner,{keyProvider}),store=makeStore(client,protectedStorage),original=globalThis.navigator;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
 try{
  backend.offline=true;await store.put(record('note',{title:'private reconnect words'}),null);
  assert.doesNotMatch(raw.getItem(store.queueKey),/private reconnect words/);
  const reopened=await openCloudDraftStorage(raw,owner,{keyProvider}),restored=makeStore(client,reopened);
  assert.equal(restored.pending.length,1);assert.equal(restored.pending[0].record.title,'private reconnect words');
  backend.offline=false;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  await restored.syncPending();assert.equal(restored.pending.length,0);assert.equal(backend.state.records[0].title,'private reconnect words');
 }finally{if(original===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:original});}
});

test('a queued stale edit becomes reviewable, and saving as a copy preserves both versions',async()=>{
 const initial=blank();initial.records.push(record('note',{id:'shared-note',title:'Starting title'}));
 const {backend,client}=sharedBackend(initial),storage=memoryStorage(),offlineStore=makeStore(client,storage),otherDevice=makeStore(client,memoryStorage()),original=globalThis.navigator;
 await offlineStore.refresh();await otherDevice.refresh();
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
 try{
  const offlineEdit=structuredClone(offlineStore.state.records[0]);offlineEdit.title='Offline title';backend.offline=true;await offlineStore.put(offlineEdit,offlineEdit.version);
  backend.offline=false;const onlineEdit=structuredClone(otherDevice.state.records[0]);onlineEdit.title='Online title';await otherDevice.put(onlineEdit,onlineEdit.version);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});await offlineStore.syncPending();
  assert.equal(offlineStore.pending[0].status,'conflict');await offlineStore.resolvePending(offlineStore.pending[0].id,'copy');
  assert.equal(offlineStore.pending.length,0);assert.deepEqual(backend.state.records.map(x=>x.title).sort(),['Offline title (offline copy)','Online title']);
 }finally{if(original===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:original});}
});
