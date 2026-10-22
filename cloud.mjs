import {Store,blank,validate} from './core.mjs';
export class CloudStore extends Store {
 constructor(client,user,state){super({getItem:()=>null});this.client=client;this.user=user;this.state=validate(state);this.cloud=true;}
 async refresh(){const {data,error}=await this.client.from('dreamhub_state').select('payload,revision').eq('owner_id',this.user.id).maybeSingle();if(error)throw Error('Your private pages could not be loaded. '+error.message);this.state=data?validate(data.payload):blank();return this.state;}
 async update(change){if(this.busy)throw Error('One little save is still finishing. Please try again in a moment.');this.busy=true;try{const {data,error}=await this.client.from('dreamhub_state').select('payload,revision').eq('owner_id',this.user.id).maybeSingle();if(error)throw Error('The cloud couldn’t be reached. Your editor draft is still on this device.');const fresh=structuredClone(data?validate(data.payload):blank()),expected=data?.revision||0;change(fresh);fresh.revision=expected+1;validate(fresh);const result=await this.client.rpc('dreamhub_save',{p_expected:expected,p_payload:fresh});if(result.error){if(result.error.message.includes('VERSION_CONFLICT'))throw Error('Another device just saved. Your draft is safe. Reopen and review before retrying.');throw Error('Cloud save failed. Your editor draft is retained. '+result.error.message);}this.state=fresh;return fresh;}finally{this.busy=false;}}
}
export async function initializeCloud(){
 const response=await fetch('/api/config',{cache:'no-store'});if(!response.ok)throw Error('Connection settings could not be checked. Reload to try again.');const config=await response.json();if(!config.enabled)return {enabled:false};
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||typeof config.publishableKey!=='string'||!config.publishableKey)throw Error('Cloud setup is incomplete.');
 const {createClient}=await import('./vendor/supabase.mjs');const client=createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:session}=await client.auth.getSession();if(!session.session)return {enabled:true,client};const {data,error}=await client.auth.getUser();if(error||!data.user)return {enabled:true,client};
 const {data:membership,error:memberError}=await client.from('dreamhub_owners').select('owner_id').eq('owner_id',data.user.id).maybeSingle();if(memberError||!membership)throw Error('This account has not been invited to this private Dreamhub. Sign out or ask the owner to check setup.');const store=new CloudStore(client,data.user,blank());await store.refresh();return {enabled:true,client,user:data.user,store};
}
export function loginGate(root,client){
 root.innerHTML=`<main class="login-page"><span class="login-heart">♡</span><p class="eyebrow">ARABELLA’S PRIVATE LITTLE UNIVERSE</p><h1>Welcome <em>home.</em></h1><p>A little space that belongs to you.</p><form id="auth-form"><label>Email<input name="email" type="email" autocomplete="email" required></label><button class="heart-pill">Email my private sign-in link ♡</button><p id="auth-status" role="status"></p></form></main>`;
 root.querySelector('#auth-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button'),status=form.querySelector('#auth-status');
  button.disabled=true;
  try{
   const email=String(new FormData(form).get('email')||'').trim();
   const redirect=new URL(window.location.pathname,window.location.origin).toString();
   const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:redirect}});
   if(error)throw error;
   status.textContent='If this is your invited account, check your inbox for a private sign-in link. Open it on this device.';
  }catch(error){status.textContent='We could not send the sign-in email. Please try again later.';}
  finally{button.disabled=false;}
 });
}
