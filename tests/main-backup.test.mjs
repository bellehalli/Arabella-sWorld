import test from 'node:test';
import assert from 'node:assert/strict';
import {blank,record,Store} from '../core.mjs';
import {encryptBackup} from '../vault-crypto.mjs';
import {encryptMainBackup,decryptMainBackup,encryptMainBackupBundle,decryptMainBackupBundle} from '../main-backup.mjs';

const passphrase='a unique DreamHub backup phrase 2026';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};

test('encrypted full backup hides personal data and restores the full workspace',async()=>{
 const source=blank();
 source.settings.theme='midnight';
 source.rules=[{id:'follow-up',enabled:true,kind:'application-followup'}];
 source.budgetPlans={'2026-10':{limit:12345}};
 source.records.push(record('journal',{title:'Private journal title',body:'A private reflection that should not be readable in the file.'}));
 const envelope=await encryptMainBackup(source,passphrase);
 assert.equal(envelope.format,'dreamhub-vault-backup');
 assert.ok(!JSON.stringify(envelope).includes('Private journal title'));
 const restored=await decryptMainBackup(envelope,passphrase);
 assert.deepEqual(restored,source);
 const store=new Store(memory());
 await store.put(record('note',{title:'Newer local page'}));
 await store.restoreBackup(restored);
 assert.equal(store.state.revision,2);
 assert.deepEqual({...store.state,revision:restored.revision},restored);
});

test('encrypted full backup refuses wrong keys, tampering, and other vault payloads',async()=>{
 const envelope=await encryptMainBackup(blank(),passphrase);
 await assert.rejects(decryptMainBackup(envelope,'a different DreamHub passphrase'),/Incorrect passphrase/);
 const altered=structuredClone(envelope);
 altered.ciphertext=altered.ciphertext.slice(0,-4)+'AAAA';
 await assert.rejects(decryptMainBackup(altered,passphrase));
 const foreign=await encryptBackup({schema:1,products:[]},passphrase);
 await assert.rejects(decryptMainBackup(foreign,passphrase),/not a full DreamHub backup/);
});

test('encrypted full backup supports larger writing entries',async()=>{
 const source=blank(),body='A larger private passage. '.repeat(12000);
 source.records.push(record('journal',{title:'Long journal entry',body}));
 const envelope=await encryptMainBackup(source,passphrase);
 const restored=await decryptMainBackup(envelope,passphrase);
 assert.equal(restored.records[0].body,body);
});

test('encrypted backup bundle carries attachment bytes and metadata without plaintext leakage',async()=>{
 const source=blank(),content=Buffer.from('%PDF-1.7 harmless sample').toString('base64');
 const files=[{recordId:'general-vault',fileName:'sample.pdf',mimeType:'application/pdf',byteSize:24,sha256:'a'.repeat(64),content}];
 const envelope=await encryptMainBackupBundle(source,passphrase,files);
 assert.ok(!JSON.stringify(envelope).includes('sample.pdf'));
 assert.deepEqual(await decryptMainBackupBundle(envelope,passphrase),{state:source,attachments:files});
});

test('full restore validates first and leaves current state unchanged when persistence fails',async()=>{
 const storage=memory(),store=new Store(storage);
 await store.put(record('note',{title:'Keep until restore commits'}));
 const before=structuredClone(store.state),candidate=blank();
 candidate.records=[record('journal',{title:'Restored page'})];
 const broken=structuredClone(candidate);broken.records.push(structuredClone(broken.records[0]));
 await assert.rejects(store.restoreBackup(broken),/duplicate ID/);
 assert.deepEqual(store.state,before);
 storage.setItem=()=>{throw Error('Quota exceeded')};
 await assert.rejects(store.restoreBackup(candidate),/Quota exceeded/);
 assert.deepEqual(store.state,before);
});
