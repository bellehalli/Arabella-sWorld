const FORMAT = 'dreamhub-cloud-draft';
const VERSION = 1;
const DATABASE = 'dreamhub-browser-keys-v1';
const STORE = 'keys';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal:true});
const random = size => crypto.getRandomValues(new Uint8Array(size));
const b64 = bytes => {
  let binary='';
  for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
};
const un64 = value => Uint8Array.from(atob(value),character=>character.charCodeAt(0));
const draftPrefix = ownerId => `dreamhub-draft:${ownerId}:`;
const stagePrefix = ownerId => `dreamhub-cloud-draft-stage:${ownerId}:`;
const aad = (ownerId,key) => encoder.encode(`${FORMAT}:${VERSION}:${ownerId}:${key}`);

function openDatabase(indexedDB=globalThis.indexedDB) {
  if(!indexedDB) throw Error('This browser cannot protect saved drafts. Enable browser site storage and try again.');
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DATABASE,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(Error('The browser could not open protected draft storage. '+(request.error?.message||'')));
    request.onblocked=()=>reject(Error('Protected draft storage is busy in another tab. Close other DreamHub tabs and try again.'));
  });
}

async function browserKey(ownerId,indexedDB=globalThis.indexedDB) {
  const db=await openDatabase(indexedDB);
  try {
    const candidate=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),get=store.get(ownerId);
      let selected;
      get.onsuccess=()=>{selected=get.result||candidate;if(!get.result)store.put(candidate,ownerId);};
      get.onerror=()=>reject(Error('The browser could not read the protected draft key.'));
      tx.oncomplete=()=>resolve(selected);
      tx.onerror=()=>reject(Error('The browser could not save the protected draft key. '+(tx.error?.message||'')));
      tx.onabort=()=>reject(Error('The browser stopped saving the protected draft key. '+(tx.error?.message||'')));
    });
  } finally { db.close(); }
}

async function seal(ownerId,key,value,dataKey) {
  const iv=random(12),ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(ownerId,key)},dataKey,encoder.encode(String(value)));
  return {format:FORMAT,version:VERSION,iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};
}

async function open(ownerId,key,envelope,dataKey) {
  if(!envelope||envelope.format!==FORMAT||envelope.version!==VERSION||typeof envelope.iv!=='string'||typeof envelope.ciphertext!=='string')throw Error('A saved draft is malformed. Its stored copy was left untouched.');
  const iv=un64(envelope.iv);if(iv.length!==12)throw Error('A saved draft has an invalid encryption nonce. Its stored copy was left untouched.');
  try {
    const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(ownerId,key)},dataKey,un64(envelope.ciphertext));
    return decoder.decode(clear);
  } catch { throw Error('A saved draft could not be decrypted. Its stored copy was left untouched.'); }
}

function listKeys(storage,prefix) {
  const keys=[];
  for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))keys.push(key);}
  return keys;
}

async function migrateValue(storage,ownerId,key,raw,dataKey) {
  let parsed=null;try{parsed=JSON.parse(raw);}catch{}
  if(parsed?.format===FORMAT)return open(ownerId,key,parsed,dataKey);
  const envelope=await seal(ownerId,key,raw,dataKey),encoded=JSON.stringify(envelope),stage=stagePrefix(ownerId)+encodeURIComponent(key);
  storage.setItem(stage,encoded);
  const verified=await open(ownerId,key,JSON.parse(storage.getItem(stage)),dataKey);
  if(verified!==raw)throw Error('Draft migration verification failed. The original draft was left untouched.');
  try {
    storage.setItem(key,encoded);
    const committed=await open(ownerId,key,JSON.parse(storage.getItem(key)),dataKey);
    if(committed!==raw)throw Error('Draft migration could not be verified.');
  } catch(error) {
    if(storage.getItem(key)!==raw)try{storage.setItem(key,raw);}catch{}
    throw Error('Draft migration could not be verified. The original draft was preserved when browser storage allowed. '+error.message);
  }
  storage.removeItem(stage);
  return raw;
}

export async function openCloudDraftStorage(storage,ownerId,{keyProvider=null,indexedDB=globalThis.indexedDB}={}) {
  if(!storage||typeof ownerId!=='string'||!ownerId)throw Error('A browser store and signed-in account are required to protect drafts.');
  const key=keyProvider?await keyProvider(ownerId):await browserKey(ownerId,indexedDB),prefix=draftPrefix(ownerId),cache=new Map(),blocked=new Set(),errors=[],stages=listKeys(storage,stagePrefix(ownerId));
  for(const stage of stages)storage.removeItem(stage);
  for(const itemKey of listKeys(storage,prefix)){
    const raw=storage.getItem(itemKey);if(raw===null)continue;
    try{cache.set(itemKey,await migrateValue(storage,ownerId,itemKey,raw,key));}
    catch(error){blocked.add(itemKey);errors.push({key:itemKey,message:error.message});}
  }
  let queue=Promise.resolve(),pending=Promise.resolve(),pendingWrites=0;
  const sensitive=itemKey=>itemKey.startsWith(prefix);
  const adapter={
    errors,
    get hasPendingWrites(){return pendingWrites>0;},
    get length(){return storage.length;},
    key(index){return storage.key(index);},
    getItem(itemKey){return sensitive(itemKey)?(cache.get(itemKey)??null):storage.getItem(itemKey);},
    setItem(itemKey,value){
      if(!sensitive(itemKey)){storage.setItem(itemKey,value);return;}
      if(blocked.has(itemKey))return Promise.reject(Error('This saved draft could not be decrypted and was kept unchanged. Discard the draft before saving over it.'));
      const clear=String(value),previous=cache.get(itemKey);cache.set(itemKey,clear);
      pendingWrites++;
      const write=queue.then(async()=>{const envelope=await seal(ownerId,itemKey,clear,key);storage.setItem(itemKey,JSON.stringify(envelope));const verify=await open(ownerId,itemKey,JSON.parse(storage.getItem(itemKey)),key);if(verify!==clear)throw Error('The protected draft save could not be verified.');});
      pending=write.catch(error=>{if(cache.get(itemKey)===clear){if(previous===undefined)cache.delete(itemKey);else cache.set(itemKey,previous);}throw error;}).finally(()=>{pendingWrites--;});queue=pending.catch(()=>{});return pending;
    },
    removeItem(itemKey){
      if(!sensitive(itemKey)){storage.removeItem(itemKey);return;}
      const previous=cache.get(itemKey);cache.delete(itemKey);
      pendingWrites++;
      const write=queue.then(()=>storage.removeItem(itemKey));
      pending=write.then(()=>blocked.delete(itemKey)).catch(error=>{if(previous!==undefined)cache.set(itemKey,previous);throw error;}).finally(()=>{pendingWrites--;});queue=pending.catch(()=>{});return pending;
    },
    async flush(){await pending;}
  };
  return adapter;
}
