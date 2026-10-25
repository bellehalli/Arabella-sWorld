import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {fileURLToPath} from 'node:url';
import {createClient} from '@supabase/supabase-js';

const input=createInterface({input:stdin,output:stdout});
const ask=label=>input.question(label);
try {
  const urlValue=(await ask('Staging project URL: ')).trim();
  const projectUrl=new URL(urlValue);
  if(projectUrl.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(projectUrl.hostname)) throw Error('Enter the HTTPS URL of the staging Supabase project.');
  if(projectUrl.hostname.split('.')[0]==='ygnousqevdbyzcxyhsfn') throw Error('Refusing to run against the known Arabella’s World production project.');
  const publishableKey=(await ask('Staging publishable key (sb_publishable_...): ')).trim();
  if(!publishableKey.startsWith('sb_publishable_')) throw Error('Use a modern publishable key. Never use a secret or service-role key.');

  const client=createClient(projectUrl.origin,publishableKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  const sessions={};
  for(const role of ['owner','nonowner']) {
    const email=(await ask(`${role==='owner'?'Owner':'Non-owner'} test account email: `)).trim();
    const sent=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false}});
    if(sent.error) throw Error(`Could not request the ${role} sign-in code: ${sent.error.message}`);
    const code=(await ask(`Enter the emailed one-time code for the ${role} account: `)).trim();
    const verified=await client.auth.verifyOtp({email,token:code,type:'email'});
    if(verified.error||!verified.data.session?.access_token) throw Error(`Could not verify the ${role} sign-in code${verified.error?`: ${verified.error.message}`:''}.`);
    sessions[role]=verified.data.session.access_token;
    await client.auth.signOut({scope:'local'});
  }
  input.close();

  const env={...process.env,
    STAGING_SUPABASE_URL:projectUrl.origin,
    STAGING_SUPABASE_PUBLISHABLE_KEY:publishableKey,
    STAGING_OWNER_ACCESS_TOKEN:sessions.owner,
    STAGING_NONOWNER_ACCESS_TOKEN:sessions.nonowner
  };
  const smoke=fileURLToPath(new URL('./staging-authorization-smoke.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[smoke],{env,stdio:'inherit'});
  if(result.error) throw result.error;
  if(result.status!==0) process.exitCode=result.status??1;
} catch(error) {
  input.close();
  console.error(error.message);
  process.exitCode=1;
}
