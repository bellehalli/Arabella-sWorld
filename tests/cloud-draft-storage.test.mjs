import test from 'node:test';
import assert from 'node:assert/strict';
import {openCloudDraftStorage} from '../cloud-draft-storage.mjs';

const memory=()=>{
 const values=new Map();
 return {values,get length(){return values.size;},key(index){return [...values.keys()][index]??null;},getItem(key){return values.get(key)??null;},setItem(key,value){values.set(key,String(value));},removeItem(key){values.delete(key);}};
};
const keyProvider=async()=>crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
function fakeIndexedDB(){
 const keys=new Map();let initialized=false;
 return {keys,open(){
  const request={};queueMicrotask(()=>{
   const objectStoreNames={contains:name=>initialized&&name==='keys'};
   request.result={objectStoreNames,createObjectStore(name){if(name==='keys')initialized=true;},close(){},transaction(){
    const tx={objectStore(){return {get(ownerId){const get={result:keys.get(ownerId)};queueMicrotask(()=>{get.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());});return get;},put(key,ownerId){keys.set(ownerId,key);}};}};return tx;
   }};
   if(!initialized)request.onupgradeneeded?.();
   request.onsuccess?.();
  });return request;
 }};
}

test('cloud drafts migrate to authenticated ciphertext and survive browser reload without a new password',async()=>{
 const owner='owner-1',storage=memory(),key=await keyProvider(),provider=async()=>key,draftKey=`dreamhub-draft:${owner}:journal-1`,queueKey=`dreamhub-draft:${owner}:cloud-reconnect-queue`;
 const legacy=JSON.stringify({record:{title:'private journal words'},raw:{body:'private body'}});
 storage.setItem(draftKey,legacy);storage.setItem('dreamhub-recent-places','["home"]');
 let protectedStorage=await openCloudDraftStorage(storage,owner,{keyProvider:provider});
 assert.equal(protectedStorage.getItem(draftKey),legacy);
 assert.doesNotMatch(storage.getItem(draftKey),/private journal words|private body/);
 const queued=JSON.stringify([{record:{title:'offline private words'}}]);
 await protectedStorage.setItem(queueKey,queued);await protectedStorage.flush();
 assert.doesNotMatch(storage.getItem(queueKey),/offline private words/);
 assert.equal(storage.getItem('dreamhub-recent-places'),'["home"]');
 protectedStorage=await openCloudDraftStorage(storage,owner,{keyProvider:provider});
 assert.equal(protectedStorage.getItem(draftKey),legacy);
 assert.equal(protectedStorage.getItem(queueKey),queued);
});

test('IndexedDB reopens the same non-exportable account key without asking for a passphrase',async()=>{
 const owner='idb-owner',storage=memory(),indexedDB=fakeIndexedDB(),draftKey=`dreamhub-draft:${owner}:draft-1`,first=await openCloudDraftStorage(storage,owner,{indexedDB});
 await first.setItem(draftKey,'private text');await first.flush();assert.equal(indexedDB.keys.get(owner).extractable,false);
 const reopened=await openCloudDraftStorage(storage,owner,{indexedDB});assert.equal(reopened.getItem(draftKey),'private text');
});

test('cloud draft storage fails closed when the browser key store is unavailable',async()=>{
 await assert.rejects(openCloudDraftStorage(memory(),'no-idb-owner',{indexedDB:null}),/cannot protect saved drafts/);
});

test('cloud draft envelopes reject a key or owner swap without changing stored bytes',async()=>{
 const storage=memory(),owner='owner-a',sourceKey=`dreamhub-draft:${owner}:journal-1`,targetOwner='owner-b',targetKey=`dreamhub-draft:${targetOwner}:journal-1`;
 const first=await openCloudDraftStorage(storage,owner,{keyProvider:keyProvider});
 await first.setItem(sourceKey,'private words');await first.flush();
 storage.setItem(targetKey,storage.getItem(sourceKey));
 const moved=storage.getItem(targetKey);
 const target=await openCloudDraftStorage(storage,targetOwner,{keyProvider:keyProvider});
 assert.equal(target.errors.length,1);assert.equal(target.getItem(targetKey),null);
 assert.equal(storage.getItem(targetKey),moved);
});

test('failed legacy draft migration keeps the original data readable and unchanged',async()=>{
 const storage=memory(),owner='owner-3',draftKey=`dreamhub-draft:${owner}:draft-1`,legacy='recover my draft';storage.setItem(draftKey,legacy);
 const originalSet=storage.setItem.bind(storage);let fail=true;
 storage.setItem=(key,value)=>{if(key===draftKey&&fail){fail=false;throw Error('quota exceeded');}originalSet(key,value);};
 const protectedStorage=await openCloudDraftStorage(storage,owner,{keyProvider:keyProvider});
 assert.equal(protectedStorage.errors.length,1);assert.equal(protectedStorage.getItem(draftKey),null);
 assert.equal(storage.getItem(draftKey),legacy);
});

test('one unreadable encrypted draft is preserved without blocking the rest of DreamHub',async()=>{
 const storage=memory(),owner='owner-4',draftKey=`dreamhub-draft:${owner}:broken`,stored='{"format":"dreamhub-cloud-draft","version":99,"iv":"AA==","ciphertext":"AA=="}';
 storage.setItem(draftKey,stored);
 const protectedStorage=await openCloudDraftStorage(storage,owner,{keyProvider:keyProvider});
 assert.equal(protectedStorage.errors.length,1);assert.equal(protectedStorage.getItem(draftKey),null);assert.equal(storage.getItem(draftKey),stored);
 await assert.rejects(protectedStorage.setItem(draftKey,'replacement'),/could not be decrypted/);
 await protectedStorage.removeItem(draftKey);await protectedStorage.setItem(draftKey,'replacement');await protectedStorage.flush();
 assert.equal(protectedStorage.errors.length,1);assert.equal(protectedStorage.getItem(draftKey),'replacement');
});
