// Personal Vault: fail closed unless the deployment has complete private-cloud configuration.
export default function handler(request,response){
 response.setHeader('Cache-Control','no-store, max-age=0');
 response.setHeader('X-Content-Type-Options','nosniff');
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
 const localHost=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(String(request?.headers?.host||''));
 if(!url&&!key&&process.env.DREAMHUB_ALLOW_LOCAL_DEV==='true'&&localHost)return response.status(200).json({enabled:false,localOnly:true});
 if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key.startsWith('sb_publishable_'))
  return response.status(503).json({error:'Private Vault unavailable: authentication is not configured'});
 return response.status(200).json({enabled:true,url,publishableKey:key});
}
