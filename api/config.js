export default function handler(request,response){
 response.setHeader('Cache-Control','no-store');
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url&&!key)return response.status(200).json({enabled:false});
 if(!url||!key||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))return response.status(503).json({error:'Cloud configuration incomplete'});
 // Only a public/publishable key belongs here. NEVER set a service-role or secret key.
 if(!key.startsWith('sb_publishable_'))return response.status(503).json({error:'Invalid key class'});
 return response.status(200).json({enabled:true,url,publishableKey:key});
}
