import {randomBytes,createHmac} from 'node:crypto';
const cookie=(name,value,maxAge)=>`${name}=${value}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const sign=(value,key)=>createHmac('sha256',key).update(value).digest('hex');
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).end();
 const clientId=process.env.GOOGLE_CLIENT_ID,secret=process.env.GOOGLE_CLIENT_SECRET,stateKey=process.env.GOOGLE_OAUTH_STATE_SECRET;
 if(!clientId||!secret||!stateKey)return res.status(503).json({error:'Google authorization is not fully configured.'});
 const state=randomBytes(32).toString('hex'),redirect='https://belle-dreamhub.vercel.app/api/auth/google/callback';
 const signed=`${state}.${sign(state,stateKey)}`;
 res.setHeader('Set-Cookie',cookie('dreamhub_google_state',signed,600));
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 for(const [key,value] of Object.entries({client_id:clientId,redirect_uri:redirect,response_type:'code',scope:'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks',access_type:'offline',prompt:'consent',state}))url.searchParams.set(key,value);
 return res.redirect(302,url.toString());
}
