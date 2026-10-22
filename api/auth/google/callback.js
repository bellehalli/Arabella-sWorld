import {createHmac,timingSafeEqual} from 'node:crypto';
const sign=(value,key)=>createHmac('sha256',key).update(value).digest('hex');
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).end();
 const stateKey=process.env.GOOGLE_OAUTH_STATE_SECRET;
 if(!stateKey)return res.status(503).send('Google authorization is not fully configured.');
 const cookies=Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split(/=(.*)/s).slice(0,2)));
 const signed=cookies.dreamhub_google_state||'';
 res.setHeader('Set-Cookie','dreamhub_google_state=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
 const [expected,mac]=signed.split('.');
 const valid=expected&&mac&&/^[a-f0-9]{64}$/.test(mac)&&timingSafeEqual(Buffer.from(mac,'hex'),Buffer.from(sign(expected,stateKey),'hex'));
 if(!valid||typeof req.query.state!=='string'||req.query.state!==expected)return res.status(400).send('Google authorization state was invalid or expired. Please try again.');
 if(req.query.error)return res.status(400).send('Google authorization was declined or unavailable.');
 // Never exchange a Google authorization code until encrypted, owner-bound token storage is installed.
 // Do not log, echo, or persist the authorization code.
 return res.status(503).send('DreamHub Google authorization is not yet enabled. No Google tokens were stored.');
}
