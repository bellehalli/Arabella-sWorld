import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalVault,unlockLocalVault,localVaultStorageKey,rotateLocalVaultPassphrase,rotateLocalVaultRecoveryCode,installLocalVaultIdleLock,LOCAL_VAULT_IDLE_LOCK_MS} from '../local-vault.mjs';

function memory(){const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),key:index=>[...map.keys()][index]??null,get length(){return map.size},entries:()=>[...map.entries()]};}
const passphrase='a strong test-only passphrase 2026';
const recoveryCode='0123456789abcdef'.repeat(4);

test('local vault encrypts the workspace and drafts, then unlocks by either secret',async()=>{
 const raw=memory(),workspace='private workspace phrase',draft='private draft phrase';raw.setItem('arabella-dreamhub-v2',workspace);raw.setItem('dreamhub-draft:local:one',draft);
 const created=await createLocalVault(raw,passphrase,{recoveryConfirmed:true,recoveryCode});
 assert.equal(created.recoveryCode,recoveryCode);
 assert.notEqual(raw.getItem('arabella-dreamhub-v2'),workspace);assert.notEqual(raw.getItem('dreamhub-draft:local:one'),draft);
 assert(!raw.entries().some(([key,value])=>key.startsWith('arabella-dreamhub-local-vault-stage-v1:')||value.includes(workspace)||value.includes(draft)));
 assert.equal(created.storage.getItem('arabella-dreamhub-v2'),workspace);assert.equal(created.storage.getItem('dreamhub-draft:local:one'),draft);
 const byPassphrase=await unlockLocalVault(raw,passphrase);assert.equal(byPassphrase.getItem('arabella-dreamhub-v2'),workspace);
 const byRecovery=await unlockLocalVault(raw,recoveryCode,{useRecoveryCode:true});assert.equal(byRecovery.getItem('dreamhub-draft:local:one'),draft);
});

test('wrong unlock secret and modified ciphertext fail without changing stored bytes',async()=>{
 const raw=memory();raw.setItem('arabella-dreamhub-v2','private phrase');await createLocalVault(raw,passphrase,{recoveryConfirmed:true,recoveryCode});
 const before=raw.getItem('arabella-dreamhub-v2');await assert.rejects(unlockLocalVault(raw,'incorrect passphrase 2026'),/did not unlock/);assert.equal(raw.getItem('arabella-dreamhub-v2'),before);
 const envelope=JSON.parse(before);envelope.ciphertext=envelope.ciphertext.slice(0,-2)+'AA';raw.setItem('arabella-dreamhub-v2',JSON.stringify(envelope));
 await assert.rejects(unlockLocalVault(raw,passphrase));assert.equal(raw.getItem('arabella-dreamhub-v2'),JSON.stringify(envelope));
});

test('failed staging write preserves all source plaintext and does not commit a vault',async()=>{
 const raw=memory();raw.setItem('arabella-dreamhub-v2','original phrase');raw.setItem('dreamhub-draft:local:one','original draft');
 const set=raw.setItem;raw.setItem=(key,value)=>{if(key.startsWith('arabella-dreamhub-local-vault-stage-v1:'))throw Error('Quota exceeded');set(key,value);};
 await assert.rejects(createLocalVault(raw,passphrase,{recoveryConfirmed:true,recoveryCode}),/Quota exceeded/);
 assert.equal(raw.getItem(localVaultStorageKey),null);assert.equal(raw.getItem('arabella-dreamhub-v2'),'original phrase');assert.equal(raw.getItem('dreamhub-draft:local:one'),'original draft');
});

test('interrupted commit resumes from verified encrypted staging copies',async()=>{
 const raw=memory();raw.setItem('arabella-dreamhub-v2','recoverable source');const set=raw.setItem;
 raw.setItem=(key,value)=>{if(key==='arabella-dreamhub-v2')throw Error('Interrupted after metadata commit');set(key,value);};
 await assert.rejects(createLocalVault(raw,passphrase,{recoveryConfirmed:true,recoveryCode}),/Interrupted/);
 assert(raw.getItem(localVaultStorageKey));assert.equal(raw.getItem('arabella-dreamhub-v2'),'recoverable source');
 raw.setItem=set;const resumed=await unlockLocalVault(raw,passphrase);assert.equal(resumed.getItem('arabella-dreamhub-v2'),'recoverable source');
 assert.notEqual(raw.getItem('arabella-dreamhub-v2'),'recoverable source');assert.equal(raw.key(1)?.startsWith('arabella-dreamhub-local-vault-stage-v1:'),false);
});

test('passphrase and recovery-code rotation retain the workspace and invalidate old credentials',async()=>{
 const raw=memory(),workspace='rotation test workspace';raw.setItem('arabella-dreamhub-v2',workspace);await createLocalVault(raw,passphrase,{recoveryConfirmed:true,recoveryCode});
 const newPassphrase='a different strong passphrase 2026';await rotateLocalVaultPassphrase(raw,passphrase,newPassphrase);
 await assert.rejects(unlockLocalVault(raw,passphrase),/did not unlock/);assert.equal((await unlockLocalVault(raw,newPassphrase)).getItem('arabella-dreamhub-v2'),workspace);
 assert.equal((await unlockLocalVault(raw,recoveryCode,{useRecoveryCode:true})).getItem('arabella-dreamhub-v2'),workspace);
 const nextCode='fedcba9876543210'.repeat(4);await rotateLocalVaultRecoveryCode(raw,newPassphrase,nextCode);
 await assert.rejects(unlockLocalVault(raw,recoveryCode,{useRecoveryCode:true}),/did not unlock/);assert.equal((await unlockLocalVault(raw,nextCode,{useRecoveryCode:true})).getItem('arabella-dreamhub-v2'),workspace);
});

test('credential rotation leaves the old metadata usable if the metadata commit fails',async()=>{
 const raw=memory();await createLocalVault(raw,passphrase,{recoveryConfirmed:true,recoveryCode});const before=raw.getItem(localVaultStorageKey),set=raw.setItem;let fail=true;
 raw.setItem=(key,value)=>{if(key===localVaultStorageKey&&fail){fail=false;throw Error('Quota exceeded');}set(key,value);};
 await assert.rejects(rotateLocalVaultPassphrase(raw,passphrase,'another strong passphrase 2026'),/Quota exceeded/);
 raw.setItem=set;assert.equal(raw.getItem(localVaultStorageKey),before);assert.ok(await unlockLocalVault(raw,passphrase));
});

test('idle lock timer resets after interaction and locks after the configured quiet interval',async()=>{
 let now=0,next=0,scheduled=new Map(),handler=null,locks=0;
 const timerApi={now:()=>now,setTimeout(fn,delay){const id=++next;scheduled.set(id,{fn,at:now+delay});return id;},clearTimeout(id){scheduled.delete(id);}};
 const documentRef={addEventListener(_event,fn){handler=fn;},removeEventListener(){}};
 const stop=installLocalVaultIdleLock(async()=>{locks++;},{timeoutMs:100,documentRef,timerApi});
 now=60;handler();now=100;
 for(const [id,timer] of [...scheduled])if(timer.at<=now){scheduled.delete(id);timer.fn();}
 assert.equal(locks,0);
 now=160;for(const [id,timer] of [...scheduled])if(timer.at<=now){scheduled.delete(id);await timer.fn();}
 assert.equal(locks,1);stop();assert.equal(LOCAL_VAULT_IDLE_LOCK_MS,900000);
});
