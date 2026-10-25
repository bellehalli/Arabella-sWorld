import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

const required=['STAGING_SUPABASE_URL','STAGING_SUPABASE_PUBLISHABLE_KEY','STAGING_OWNER_ACCESS_TOKEN','STAGING_NONOWNER_ACCESS_TOKEN'];
const missing=required.filter(name=>!process.env[name]);
if(missing.length)throw Error(`Missing staging-only values: ${missing.join(', ')}`);
const url=new URL(process.env.STAGING_SUPABASE_URL);
assert.equal(url.protocol,'https:','The staging project URL must use HTTPS');
assert.match(url.hostname,/^[a-z0-9-]+\.supabase\.co$/,'Use a Supabase project URL');
assert.notEqual(url.hostname.split('.')[0],'ygnousqevdbyzcxyhsfn','Refusing to run against the known production project');
const key=process.env.STAGING_SUPABASE_PUBLISHABLE_KEY;
assert.ok(key.startsWith('sb_publishable_'),'Use a publishable key, never a secret or service-role key');

function scopedClient(token=''){
  return createClient(url.origin,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},global:{fetch:(input,init={})=>{
    const headers=new Headers(init.headers||{});
    if(token)headers.set('Authorization',`Bearer ${token}`);else headers.delete('Authorization');
    return fetch(input,{...init,headers});
  }}});
}
const owner=scopedClient(process.env.STAGING_OWNER_ACCESS_TOKEN);
const nonowner=scopedClient(process.env.STAGING_NONOWNER_ACCESS_TOKEN);
const anonymous=scopedClient();
const bucket='dreamhub-attachments',table='dreamhub_attachments';
const body='DreamHub staging attachment acceptance probe. Safe to delete.';
// The interactive wrapper has just obtained this JWT from Supabase's verified
// OTP response. Read its subject locally; the authenticated upload and table
// requests below are the actual server-side token validation checks.
const ownerClaims=JSON.parse(Buffer.from(process.env.STAGING_OWNER_ACCESS_TOKEN.split('.')[1]||'','base64url').toString('utf8'));
const ownerId=ownerClaims.sub;
assert.match(ownerId||'',/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,'Owner OTP token must contain a valid user ID');
const fileId=crypto.randomUUID(),objectPath=`${ownerId}/${fileId}.txt`;
let metadataCreated=false,storageCreated=false;
try{
  const upload=await owner.storage.from(bucket).upload(objectPath,new Blob([body],{type:'text/plain'}),{contentType:'text/plain',upsert:false,cacheControl:'0'});
  if(upload.error)throw Error('Owner upload failed: '+upload.error.message);
  storageCreated=true;

  const insert=await owner.from(table).insert({id:fileId,owner_id:ownerId,record_id:'__vault__',file_name:'DreamHub staging probe.txt',mime_type:'text/plain',byte_size:new TextEncoder().encode(body).length,storage_path:objectPath});
  if(insert.error)throw Error('Owner metadata insert failed: '+insert.error.message);
  metadataCreated=true;

  const ownerRead=await owner.from(table).select('id,owner_id,storage_path').eq('id',fileId).single();
  assert.equal(ownerRead.error,null,'Owner should read own attachment metadata');
  assert.equal(ownerRead.data?.owner_id,ownerId);

  const otherRead=await nonowner.from(table).select('id').eq('owner_id',ownerId);
  assert.equal(otherRead.error,null,'Non-owner query should be filtered by RLS');
  assert.deepEqual(otherRead.data,[],'Non-owner must not see owner attachment metadata');
  const anonymousRead=await anonymous.from(table).select('id').eq('owner_id',ownerId);
  assert.ok(anonymousRead.error||!anonymousRead.data?.length,'Anonymous users must not read attachment metadata');

  const ownerDownload=await owner.storage.from(bucket).download(objectPath);
  assert.equal(ownerDownload.error,null,'Owner should download own private file');
  assert.equal(await ownerDownload.data.text(),body,'Downloaded owner file contents must match');

  const nonownerDownload=await nonowner.storage.from(bucket).download(objectPath);
  assert.ok(nonownerDownload.error||!nonownerDownload.data,'Non-owner must not download owner file');
  const anonymousDownload=await anonymous.storage.from(bucket).download(objectPath);
  assert.ok(anonymousDownload.error||!anonymousDownload.data,'Anonymous users must not download private file');

  const deletion=await owner.storage.from(bucket).remove([objectPath]);
  if(deletion.error)throw Error('Owner storage deletion failed: '+deletion.error.message);
  storageCreated=false;
  const metadataDelete=await owner.from(table).delete().eq('id',fileId).eq('owner_id',ownerId);
  if(metadataDelete.error)throw Error('Owner metadata deletion failed: '+metadataDelete.error.message);
  metadataCreated=false;
  const gone=await owner.from(table).select('id').eq('id',fileId);
  assert.equal(gone.error,null);
  assert.deepEqual(gone.data,[],'Deleted attachment metadata must be gone');
  console.log('PASS staging private attachment upload, metadata, owner download, non-owner/anonymous denial, and cleanup; probe file and metadata were removed.');
} finally {
  if(storageCreated)await owner.storage.from(bucket).remove([objectPath]);
  if(metadataCreated)await owner.from(table).delete().eq('id',fileId).eq('owner_id',ownerId);
}
