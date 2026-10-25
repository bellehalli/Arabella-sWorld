import {Store,blank,validate} from './core.mjs';
export class CloudStore extends Store {
 constructor(client,user,state,storage=null){super({getItem:()=>null});this.client=client;this.user=user;this.state=validate(state);this.cloud=true;this.storage=storage;this.queueKey=`dreamhub-draft:${user.id}:cloud-reconnect-queue`;this.pending=this.#readQueue();this.conflicts=[];}
 #readQueue(){try{const value=JSON.parse(this.storage?.getItem(this.queueKey)||'[]');return Array.isArray(value)?value:[];}catch{return [];}}
 async #persistQueue(){if(this.storage)await this.storage.setItem(this.queueKey,JSON.stringify(this.pending));}
 async put(item,expectedVersion=null){
  try { const result=await super.put(item,expectedVersion);this.lastPutQueued=false;this.pending=this.pending.filter(x=>x.record.id!==item.id);await this.#persistQueue();return result; }
  catch(error){
   const offline=globalThis.navigator?.onLine===false||/cloud couldn.t be reached|failed to fetch|networkerror|network request failed/i.test(String(error?.message||''));
   if(!offline)throw error;
   const clone=structuredClone(item);this.pending=this.pending.filter(x=>x.record.id!==item.id);this.pending.push({id:crypto.randomUUID(),record:clone,expectedVersion,queuedAt:new Date().toISOString(),status:'queued'});
   const current=this.state.records.findIndex(x=>x.id===clone.id);if(current<0)this.state.records.push(clone);else this.state.records[current]={...clone,version:this.state.records[current].version};
   await this.#persistQueue();this.lastPutQueued=true;return this.state;
  }
 }
 async syncPending(){
  if(!this.pending.length||globalThis.navigator?.onLine===false)return;
  for(const entry of [...this.pending]){
   if(entry.status==='conflict')continue;
   try{await super.put(entry.record,entry.expectedVersion);this.pending=this.pending.filter(x=>x.id!==entry.id);await this.#persistQueue();}
   catch(error){if(/VERSION_CONFLICT|changed in another tab|another device/i.test(error.message)){entry.status='conflict';entry.conflictMessage=error.message;await this.#persistQueue();continue;}break;}
  }
 }
 async resolvePending(id,choice){
  const entry=this.pending.find(x=>x.id===id);if(!entry)throw Error('This queued draft is no longer waiting.');
  if(choice==='discard'){this.pending=this.pending.filter(x=>x.id!==id);await this.#persistQueue();return;}
  if(choice==='copy'){const copy=structuredClone(entry.record);copy.id=crypto.randomUUID();copy.title=`${copy.title} (offline copy)`;await super.put(copy,null);this.pending=this.pending.filter(x=>x.id!==id);await this.#persistQueue();return;}
  if(choice==='replace'){
   const {data,error}=await this.client.from('dreamhub_state').select('payload,revision').eq('owner_id',this.user.id).maybeSingle();if(error)throw Error('Could not fetch the latest page to resolve this conflict.');const latest=validate(data?data.payload:blank()),current=latest.records.find(x=>x.id===entry.record.id);if(!current)throw Error('The page was removed on another device. Save this draft as a copy instead.');
   this.state=latest;await super.put(entry.record,current.version);this.pending=this.pending.filter(x=>x.id!==id);await this.#persistQueue();return;
  }
  throw Error('Choose keep cloud version, save as a copy, or replace after reviewing.');
 }
 async refresh(){const {data,error}=await this.client.from('dreamhub_state').select('payload,revision').eq('owner_id',this.user.id).maybeSingle();if(error)throw Error('Your private pages could not be loaded. '+error.message);this.state=data?validate(data.payload):blank();return this.state;}
 async update(change){if(this.busy)throw Error('One little save is still finishing. Please try again in a moment.');this.busy=true;try{const {data,error}=await this.client.from('dreamhub_state').select('payload,revision').eq('owner_id',this.user.id).maybeSingle();if(error)throw Error('The cloud couldn’t be reached. Your editor draft is still on this device.');const fresh=structuredClone(data?validate(data.payload):blank()),expected=data?.revision||0;change(fresh);fresh.revision=expected+1;validate(fresh);const result=await this.client.rpc('dreamhub_save',{p_expected:expected,p_payload:fresh});if(result.error){if(result.error.message.includes('VERSION_CONFLICT'))throw Error('Another device just saved. Your draft is safe. Reopen and review before retrying.');throw Error('Cloud save failed. Your editor draft is retained. '+result.error.message);}this.state=fresh;return fresh;}finally{this.busy=false;}}
}

export function watchAuthSession(client,onInvalidSession){
 if(typeof client?.auth?.onAuthStateChange!=='function')return ()=>{};
 const result=client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'||event==='USER_DELETED'||(event==='TOKEN_REFRESHED'&&!session))onInvalidSession?.(event);
 });
 const subscription=result?.data?.subscription;
 return ()=>subscription?.unsubscribe?.();
}

export async function signOutAndClearDrafts(client,storage,draftPrefix){
 const {error}=await client.auth.signOut();
 if(error)throw error;
 for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(key?.startsWith(draftPrefix))await storage.removeItem(key);}
}
export async function initializeCloud(storage=null){
 let response;
 try{response=await fetch('/api/config',{cache:'no-store',headers:{Accept:'application/json'}});}
 catch{throw Error('The configuration endpoint could not be reached. Check your connection and try again.');}
 if(!response.ok){
  if(response.status===401||response.status===403)throw Error('Vercel access protection is blocking the private configuration endpoint. Check Deployment Protection settings.');
  if(response.status===503)throw Error('DreamHub cloud configuration is incomplete or invalid. Check the Supabase URL and publishable key in Vercel production settings.');
  if(response.status===404)throw Error('DreamHub configuration endpoint was not deployed. Check the Vercel project root and API routing.');
  throw Error('The configuration endpoint returned HTTP '+response.status+'. Check the deployment and its function logs.');
 }
 const type=response.headers?.get?.('content-type')||'';
 if(type&&!type.includes('application/json'))throw Error('The configuration endpoint returned a webpage instead of JSON. Vercel Deployment Protection or routing may be intercepting the request.');
 let config;try{config=await response.json();}catch{throw Error('The configuration endpoint returned invalid JSON. Check the deployment logs.');}
if(!config.enabled)return {enabled:false};
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||typeof config.publishableKey!=='string'||!config.publishableKey)throw Error('Cloud setup is incomplete.');
 const {createClient}=await import('./vendor/supabase.mjs');const client=createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:session}=await client.auth.getSession();if(!session.session)return {enabled:true,client};const {data,error}=await client.auth.getUser();if(error||!data.user)return {enabled:true,client};
 const {data:membership,error:memberError}=await client.from('dreamhub_owners').select('owner_id').eq('owner_id',data.user.id).maybeSingle();if(memberError)throw Error('Could not check this account’s Dreamhub access. Please try again.');if(!membership){await clearUninvitedAuthSession(client);return {enabled:true,client,notice:'This account is not set up for this Dreamhub. Sign in with the invited account or ask the owner to check access.'};}const store=new CloudStore(client,data.user,blank(),storage);await store.refresh();await store.syncPending();globalThis.window?.addEventListener?.('online',()=>store.syncPending());watchAuthSession(client,()=>globalThis.window?.location?.reload?.());return {enabled:true,client,user:data.user,store};
}
export async function clearUninvitedAuthSession(client){
 const {error}=await client.auth.signOut({scope:'local'});
 if(error)throw Error('This account is not invited, and this browser could not switch accounts. Open a private window and sign in with the invited account.');
}

export function loginGate(root,client,notice=''){
 root.innerHTML=`<main class="login-page"><span class="login-heart">♡</span><p class="eyebrow">ARABELLA’S PRIVATE LITTLE UNIVERSE</p><h1>Welcome <em>home.</em></h1><p>A little space that belongs to you.</p><form id="auth-form"><label>Email<input name="email" type="email" autocomplete="email" required></label><label id="code-label" hidden>Sign-in code<input name="token" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="12"></label><button class="heart-pill">Email my sign-in code ♡</button><button id="resend-code" class="softbutton" type="button" hidden>Send a new code</button><p id="auth-status" role="status" aria-live="polite"></p></form></main>`;
 const form=root.querySelector('#auth-form');
 const emailInput=form.elements.email;
 const tokenInput=form.elements.token;
 const codeLabel=root.querySelector('#code-label');
 const button=form.querySelector('button[type="submit"],button:not([type])');
 const resend=root.querySelector('#resend-code');
 const status=root.querySelector('#auth-status');
 if(notice)status.textContent=notice;
 let codeSent=false;
 async function sendCode(){
  const email=String(emailInput.value||'').trim();
  if(!emailInput.checkValidity()) { emailInput.reportValidity(); return; }
  button.disabled=true;resend.disabled=true;status.textContent='Sending your private sign-in code…';
  try{
   const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false}});
   if(error)throw error;
   codeSent=true;emailInput.readOnly=true;codeLabel.hidden=false;tokenInput.required=true;
   button.textContent='Verify my sign-in code ♡';resend.hidden=false;status.textContent='Check your email for the sign-in code, then enter it here.';tokenInput.focus();
  }catch(error){status.textContent='We could not send the sign-in email. Please try again later.';}
  finally{button.disabled=false;resend.disabled=false;}
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!codeSent){await sendCode();return;}
  const email=String(emailInput.value||'').trim(),token=String(tokenInput.value||'').trim();
  if(!token){tokenInput.focus();status.textContent='Enter the code from your email first.';return;}
  button.disabled=true;resend.disabled=true;status.textContent='Checking your sign-in code…';
  try{
   const {error}=await client.auth.verifyOtp({email,token,type:'email'});
   if(error)throw error;
   status.textContent='You’re in. Opening your private workspace…';window.location.reload();
  }catch(error){status.textContent='That code could not be verified. Check it and try again, or request a fresh code.';button.disabled=false;resend.disabled=false;}
 });
 resend.addEventListener('click',sendCode);
}
