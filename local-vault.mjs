const META_KEY = 'arabella-dreamhub-local-vault-meta-v1';
const STAGE_PREFIX = 'arabella-dreamhub-local-vault-stage-v1:';
const FORMAT = 'arabella-dreamhub-local-vault';
const ITEM_FORMAT = 'arabella-dreamhub-local-item';
const VERSION = 1;
const ITERATIONS = 600000;
export const LOCAL_VAULT_IDLE_LOCK_MS = 15 * 60 * 1000;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal:true});
const b64 = value => {
  const bytes=new Uint8Array(value);let binary='';
  for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
};
const un64 = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
const random = size => crypto.getRandomValues(new Uint8Array(size));
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2,'0')).join('');
const unhex = value => {
  const clean = String(value||'').replace(/[\s-]/g,'');
  if (!/^(?:[0-9a-f]{2}){32}$/i.test(clean)) throw Error('The recovery code is not valid.');
  return Uint8Array.from(clean.match(/.{2}/g), byte => parseInt(byte,16));
};
const stageKey = key => STAGE_PREFIX + encodeURIComponent(key);
const metadataStageKey = META_KEY + ':rotation-stage';
const sensitiveKey = key => key === 'arabella-dreamhub-v2' || String(key).startsWith('dreamhub-draft:');
const aad = (kind, key='') => encoder.encode(`${FORMAT}:${VERSION}:${kind}:${key}`);

async function derivePassphraseKey(passphrase, salt) {
  if (typeof passphrase !== 'string' || passphrase.length < 16) throw Error('Use a vault passphrase of at least 16 characters.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'}, material, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}

async function deriveRecoveryKey(code, salt) {
  const material = await crypto.subtle.importKey('raw', unhex(code), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt,info:aad('recovery-wrap')}, material, {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
}

async function wrapKey(wrappingKey, rawKey, kind) {
  const iv = random(12);
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(kind)}, wrappingKey, rawKey);
  return {iv:b64(iv),ciphertext:b64(ciphertext)};
}

async function unwrapKey(wrappingKey, wrapper, kind) {
  const iv = un64(wrapper.iv);
  if (iv.length !== 12) throw Error('Invalid local vault key envelope.');
  return crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad(kind)}, wrappingKey, un64(wrapper.ciphertext));
}

async function createMetadata(passphrase, recoveryCode, rawKey) {
  const passSalt = random(16), recoverySalt = random(16);
  const passWrapper = await wrapKey(await derivePassphraseKey(passphrase,passSalt),rawKey,'passphrase-wrap');
  const recoveryWrapper = await wrapKey(await deriveRecoveryKey(recoveryCode,recoverySalt),rawKey,'recovery-wrap');
  return {format:FORMAT,version:VERSION,cipher:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations:ITERATIONS,passSalt:b64(passSalt),passWrapper,recoverySalt:b64(recoverySalt),recoveryWrapper,createdAt:new Date().toISOString()};
}

function parseMetadata(raw) {
  let meta;
  try { meta = JSON.parse(raw); } catch { throw Error('The local vault metadata is damaged. Existing encrypted data was left untouched.'); }
  if (!meta || meta.format!==FORMAT || meta.version!==VERSION || meta.cipher!=='AES-256-GCM' || meta.kdf!=='PBKDF2-SHA256' || meta.iterations!==ITERATIONS || typeof meta.passSalt!=='string' || typeof meta.recoverySalt!=='string' || !meta.passWrapper || !meta.recoveryWrapper) {
    throw Error('This local vault format is unsupported. Existing data was left untouched.');
  }
  return meta;
}

async function importDataKey(raw) {
  if (raw.byteLength !== 32) throw Error('The local vault key has an invalid length.');
  return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
}

async function unlockRawKey(metadata,passphrase){
 return unwrapKey(await derivePassphraseKey(passphrase,un64(metadata.passSalt)),metadata.passWrapper,'passphrase-wrap');
}

async function commitRotatedMetadata(storage,previousRaw,next,passphrase,recoveryCode){
 const serialized=JSON.stringify(next);
 try{
  storage.setItem(metadataStageKey,serialized);
  const staged=parseMetadata(storage.getItem(metadataStageKey));
  const byPass=await unlockRawKey(staged,passphrase);
  const byRecovery=await unwrapKey(await deriveRecoveryKey(recoveryCode,un64(staged.recoverySalt)),staged.recoveryWrapper,'recovery-wrap');
  if(!crypto.subtle||!constantTimeEqual(byPass,byRecovery))throw Error('Credential rotation verification failed.');
  storage.setItem(META_KEY,serialized);
  if(storage.getItem(META_KEY)!==serialized)throw Error('Credential rotation could not be verified after saving.');
  storage.removeItem(metadataStageKey);
 }catch(error){
  try{if(storage.getItem(META_KEY)!==previousRaw)storage.setItem(META_KEY,previousRaw);}finally{storage.removeItem(metadataStageKey);}
  throw error;
 }
}

function constantTimeEqual(left,right){
 const a=new Uint8Array(left),b=new Uint8Array(right);if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;
}

export function createLocalVaultRecoveryCode(){return hex(random(32));}

export async function rotateLocalVaultPassphrase(storage,currentPassphrase,newPassphrase){
 if(typeof newPassphrase!=='string'||newPassphrase.length<16)throw Error('Use a new vault passphrase of at least 16 characters.');
 const previousRaw=storage.getItem(META_KEY),metadata=parseMetadata(previousRaw);let rawKey;
 try{rawKey=await unlockRawKey(metadata,currentPassphrase);}catch{throw Error('The current vault passphrase is incorrect. No stored data was changed.');}
 const salt=random(16),next={...metadata,passSalt:b64(salt),passWrapper:await wrapKey(await derivePassphraseKey(newPassphrase,salt),rawKey,'passphrase-wrap'),updatedAt:new Date().toISOString()};
 // Verify with the new passphrase and preserve the existing recovery wrapper without needing its secret.
 const serialized=JSON.stringify(next);
 try{storage.setItem(metadataStageKey,serialized);const staged=parseMetadata(storage.getItem(metadataStageKey));const verified=await unlockRawKey(staged,newPassphrase);if(!constantTimeEqual(rawKey,verified))throw Error('Passphrase rotation verification failed.');storage.setItem(META_KEY,serialized);if(storage.getItem(META_KEY)!==serialized)throw Error('Passphrase rotation could not be verified after saving.');storage.removeItem(metadataStageKey);}
 catch(error){try{if(storage.getItem(META_KEY)!==previousRaw)storage.setItem(META_KEY,previousRaw);}finally{storage.removeItem(metadataStageKey);}throw error;}
}

export async function rotateLocalVaultRecoveryCode(storage,currentPassphrase,newRecoveryCode=createLocalVaultRecoveryCode()){
 const recoveryCode=String(newRecoveryCode).replace(/-/g,'').toLowerCase();unhex(recoveryCode);
 const previousRaw=storage.getItem(META_KEY),metadata=parseMetadata(previousRaw);let rawKey;
 try{rawKey=await unlockRawKey(metadata,currentPassphrase);}catch{throw Error('The current vault passphrase is incorrect. No stored data was changed.');}
 const salt=random(16),next={...metadata,recoverySalt:b64(salt),recoveryWrapper:await wrapKey(await deriveRecoveryKey(recoveryCode,salt),rawKey,'recovery-wrap'),updatedAt:new Date().toISOString()};
 await commitRotatedMetadata(storage,previousRaw,next,currentPassphrase,recoveryCode);return recoveryCode;
}

export function installLocalVaultIdleLock(onLock,{timeoutMs=LOCAL_VAULT_IDLE_LOCK_MS,documentRef=globalThis.document,timerApi=globalThis}={}){
 if(typeof onLock!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<1)throw Error('A valid idle-lock action and timeout are required.');
 const currentTime=()=>typeof timerApi.now==='function'?timerApi.now():Date.now();
 let lastActivity=currentTime(),timer=null,disposed=false,locking=false;
 const clear=()=>{if(timer!==null)timerApi.clearTimeout(timer);timer=null;};
 const schedule=()=>{clear();if(disposed||locking)return;const remaining=Math.max(0,timeoutMs-(currentTime()-lastActivity));timer=timerApi.setTimeout(async()=>{timer=null;const left=timeoutMs-(currentTime()-lastActivity);if(left>0){schedule();return;}locking=true;try{await onLock();}catch{locking=false;lastActivity=currentTime();schedule();}},remaining);timer?.unref?.();};
 const activity=()=>{if(disposed||locking)return;lastActivity=currentTime();schedule();};
 const events=['pointerdown','keydown','touchstart','click','input'];
 for(const event of events)documentRef?.addEventListener?.(event,activity,{passive:true});
 schedule();
 return ()=>{disposed=true;clear();for(const event of events)documentRef?.removeEventListener?.(event,activity);};
}

async function encryptItem(key, value, dataKey) {
  const iv = random(12), plaintext = encoder.encode(String(value));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad('item',key)},dataKey,plaintext);
  return {format:ITEM_FORMAT,version:VERSION,iv:b64(iv),ciphertext:b64(ciphertext)};
}

async function decryptItem(key, envelope, dataKey) {
  if (!envelope || envelope.format!==ITEM_FORMAT || envelope.version!==VERSION || typeof envelope.iv!=='string' || typeof envelope.ciphertext!=='string') throw Error('An encrypted local record is malformed.');
  const iv = un64(envelope.iv);
  if (iv.length!==12) throw Error('An encrypted local record has an invalid nonce.');
  const clear = await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad('item',key)},dataKey,un64(envelope.ciphertext));
  return decoder.decode(clear);
}

function keys(storage) {
  const result=[];
  for (let i=0;i<storage.length;i++) {
    const key=storage.key(i);
    if (key && (sensitiveKey(key) || key.startsWith(STAGE_PREFIX))) result.push(key);
  }
  return result;
}

function readEnvelope(storage,key) {
  try { return JSON.parse(storage.getItem(key)||'null'); } catch { return null; }
}

async function finishStagedMigration(storage, dataKey, cache) {
  const itemKeys = keys(storage).filter(sensitiveKey);
  for (const key of itemKeys) {
    const staged = storage.getItem(stageKey(key));
    const raw = storage.getItem(key);
    let envelope;
    if (staged) envelope=JSON.parse(staged);
    else {
      const possible=readEnvelope(storage,key);
      if (possible?.format===ITEM_FORMAT) envelope=possible;
      else if (raw!==null) envelope=await encryptItem(key,raw,dataKey);
      else continue;
    }
    const clear=await decryptItem(key,envelope,dataKey);
    if (staged || raw===null || readEnvelope(storage,key)?.format!==ITEM_FORMAT) storage.setItem(key,JSON.stringify(envelope));
    cache.set(key,clear);
  }
  for (const key of itemKeys) storage.removeItem(stageKey(key));
}

export async function createLocalVault(storage, passphrase, {recoveryConfirmed=false,recoveryCode:providedRecoveryCode}={}) {
  if (storage.getItem(META_KEY)) throw Error('A local vault already exists. Unlock it to continue.');
  if (!recoveryConfirmed) throw Error('Save the recovery code before creating the vault.');
  if (typeof passphrase !== 'string' || passphrase.length < 16) throw Error('Use a vault passphrase of at least 16 characters.');
  const recoveryCode=providedRecoveryCode||hex(random(32));
  unhex(recoveryCode);
  const rawKey=random(32);
  const dataKey=await importDataKey(rawKey);
  const itemKeys=keys(storage).filter(sensitiveKey);
  for (const key of keys(storage).filter(x=>x.startsWith(STAGE_PREFIX))) storage.removeItem(key);
  try {
    for (const key of itemKeys) {
      const value=storage.getItem(key);
      const envelope=await encryptItem(key,value,dataKey);
      const encoded=JSON.stringify(envelope);
      storage.setItem(stageKey(key),encoded);
      const verify=await decryptItem(key,JSON.parse(storage.getItem(stageKey(key))),dataKey);
      if (verify!==value) throw Error('Encrypted migration verification did not match the source.');
    }
    const metadata=await createMetadata(passphrase,recoveryCode,rawKey);
    storage.setItem(META_KEY,JSON.stringify(metadata));
    const cache=new Map();
    await finishStagedMigration(storage,dataKey,cache);
    return {storage:new EncryptedLocalStorage(storage,dataKey,cache),recoveryCode};
  } catch (error) {
    if (!storage.getItem(META_KEY)) for (const key of keys(storage).filter(item=>item.startsWith(STAGE_PREFIX))) storage.removeItem(key);
    throw error;
  }
}

export async function unlockLocalVault(storage, secret, {useRecoveryCode=false}={}) {
  const metadata=parseMetadata(storage.getItem(META_KEY));
  let rawKey;
  try {
    rawKey=useRecoveryCode
      ? await unwrapKey(await deriveRecoveryKey(secret,un64(metadata.recoverySalt)),metadata.recoveryWrapper,'recovery-wrap')
      : await unwrapKey(await derivePassphraseKey(secret,un64(metadata.passSalt)),metadata.passWrapper,'passphrase-wrap');
  } catch { throw Error('That passphrase or recovery code did not unlock this vault. No stored data was changed.'); }
  const dataKey=await importDataKey(rawKey);
  const cache=new Map();
  await finishStagedMigration(storage,dataKey,cache);
  return new EncryptedLocalStorage(storage,dataKey,cache);
}

class EncryptedLocalStorage {
  constructor(storage,dataKey,cache) { this.raw=storage; this.dataKey=dataKey; this.cache=cache; this.queue=Promise.resolve(); this.pending=Promise.resolve(); this.unlocked=true; }
  getItem(key) { return sensitiveKey(key) ? (this.cache.get(key) ?? null) : this.raw.getItem(key); }
  setItem(key,value) {
    if (!sensitiveKey(key)) { this.raw.setItem(key,value); return; }
    if (!this.unlocked) throw Error('Unlock the local vault before saving.');
    const clear=String(value);
    const previous=this.cache.get(key);this.cache.set(key,clear);
    const write=this.queue.then(async()=>{
      const envelope=await encryptItem(key,clear,this.dataKey);
      this.raw.setItem(key,JSON.stringify(envelope));
    });
    this.pending=write.catch(error=>{if(this.cache.get(key)===clear){if(previous===undefined)this.cache.delete(key);else this.cache.set(key,previous);}throw error;});this.queue=this.pending.catch(()=>{});
    return this.pending;
  }
  removeItem(key) {
    if (!sensitiveKey(key)) { this.raw.removeItem(key); return; }
    const previous=this.cache.get(key);this.cache.delete(key);
    const write=this.queue.then(()=>{this.raw.removeItem(key);});
    this.pending=write.catch(error=>{if(previous!==undefined)this.cache.set(key,previous);throw error;});this.queue=this.pending.catch(()=>{});
    return this.pending;
  }
  async flush() { await this.pending; }
  lock() { this.unlocked=false; this.cache.clear(); this.dataKey=null; }
}

function escapeHtml(value) {
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

export async function openLocalVault(storage, root) {
  const existing=storage.getItem(META_KEY);
  if (existing) {
    return new Promise(resolve=>{
      root.innerHTML=`<main class="login-page"><span class="login-heart">♡</span><p class="eyebrow">ARABELLA’S PRIVATE LITTLE UNIVERSE</p><h1>Unlock your <em>vault.</em></h1><p>Your local records stay encrypted until you unlock this device.</p><form id="local-vault-form"><label>Unlock with<select name="method"><option value="passphrase">Passphrase</option><option value="recovery">Recovery code</option></select></label><label id="vault-secret-label">Passphrase<input name="secret" type="password" autocomplete="current-password" minlength="16" required></label><p id="vault-error" role="alert"></p><button class="heart-pill" type="submit">Unlock my DreamHub ♡</button></form></main>`;
      const form=root.querySelector('#local-vault-form');
      const method=form.querySelector('[name="method"]'), label=root.querySelector('#vault-secret-label');
      method.addEventListener('change',()=>{
        const recovery=method.value==='recovery';
        label.firstChild.textContent=recovery?'Recovery code':'Passphrase';
        const input=form.querySelector('[name="secret"]');input.type=recovery?'text':'password';input.autocomplete=recovery?'off':'current-password';input.minLength=recovery?64:16;
      });
      form.addEventListener('submit',async event=>{
        event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;
        try { const vault=await unlockLocalVault(storage,form.querySelector('[name="secret"]').value,{useRecoveryCode:method.value==='recovery'});form.reset?.();resolve(vault); }
        catch(error) { root.querySelector('#vault-error').textContent=error.message;button.disabled=false; }
      });
      form.querySelector('[name="secret"]').focus?.();
    });
  }
  const recoveryCode=hex(random(32));
  const existingDataKeys=keys(storage).filter(sensitiveKey);
  return new Promise(resolve=>{
    root.innerHTML=`<main class="login-page"><span class="login-heart">♡</span><p class="eyebrow">ARABELLA’S PRIVATE LITTLE UNIVERSE</p><h1>Create your <em>local vault.</em></h1><p>DreamHub will encrypt this device’s workspace and unsaved drafts. You’ll unlock it each time you open the app.</p>${existingDataKeys.length?'<p class="notice">Existing local pages and drafts will be encrypted. They remain in place unless the encrypted copies verify successfully.</p>':''}<section class="panel"><p class="tiny-label">ONE-TIME RECOVERY CODE</p><code id="recovery-code">${escapeHtml(recoveryCode.match(/.{1,8}/g).join('-'))}</code><p>Save this code somewhere separate from this device. It can unlock the vault if you forget the passphrase.</p><label class="checklabel"><input id="recovery-confirmed" type="checkbox"> I saved the recovery code somewhere safe</label></section><form id="local-vault-form"><label>Choose a passphrase<input name="passphrase" type="password" autocomplete="new-password" minlength="16" required></label><label>Confirm passphrase<input name="confirm" type="password" autocomplete="new-password" minlength="16" required></label><p id="vault-error" role="alert"></p><button class="heart-pill" type="submit">Encrypt and open DreamHub ♡</button></form></main>`;
    const form=root.querySelector('#local-vault-form');
    form.addEventListener('submit',async event=>{
      event.preventDefault();const button=form.querySelector('button[type="submit"]');button.disabled=true;
      try {
        if (!root.querySelector('#recovery-confirmed').checked) throw Error('Save the recovery code and check the box before continuing.');
        const passphrase=form.querySelector('[name="passphrase"]').value,confirmation=form.querySelector('[name="confirm"]').value;
        if (passphrase!==confirmation) throw Error('The passphrases do not match.');
        const result=await createLocalVault(storage,passphrase,{recoveryConfirmed:true,recoveryCode});
        form.reset?.();resolve(result.storage);
      } catch(error) { root.querySelector('#vault-error').textContent=error.message;button.disabled=false; }
    });
    form.querySelector('[name="passphrase"]').focus?.();
  });
}

export const localVaultStorageKey = META_KEY;
