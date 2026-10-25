import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const STAGING_REF='cszytmaqgpmcccmfmevk';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=createInterface({input:stdin,output:stdout});
const ask=label=>input.question(label);
const projectUrl=(await ask('Staging project URL: ')).trim().replace(/\/$/,'');
const publishableKey=(await ask('Staging publishable key (sb_publishable_...): ')).trim();
input.close();

let parsed;
try{parsed=new URL(projectUrl);}catch{throw Error('Enter the HTTPS URL from your Arabella’s World Staging project.');}
if(parsed.protocol!=='https:'||parsed.hostname!==`${STAGING_REF}.supabase.co`)throw Error('This local preview accepts only the Arabella’s World Staging project URL.');
if(!publishableKey.startsWith('sb_publishable_'))throw Error('Use the staging publishable key, never a secret or service-role key.');

const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const headers={
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'X-Frame-Options':'DENY',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};

const server=createServer(async(request,response)=>{
  for(const [name,value] of Object.entries(headers))response.setHeader(name,value);
  if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405);response.end();return;}
  const pathname=new URL(request.url,'http://127.0.0.1').pathname;
  if(pathname==='/api/config'){
    response.setHeader('Cache-Control','no-store, max-age=0');
    response.setHeader('Content-Type','application/json; charset=utf-8');
    const body=JSON.stringify({enabled:true,url:projectUrl,publishableKey});
    response.writeHead(200);response.end(request.method==='HEAD'?'':body);return;
  }
  let filename;
  try{filename=path.resolve(root,`.${decodeURIComponent(pathname==='/'?'/index.html':pathname)}`);}catch{response.writeHead(400);response.end();return;}
  if(!filename.startsWith(root+path.sep)||path.basename(filename).startsWith('.')){response.writeHead(404);response.end('Not found');return;}
  try{
    const info=await stat(filename);
    if(!info.isFile()){response.writeHead(404);response.end('Not found');return;}
    const body=await readFile(filename);
    response.setHeader('Content-Type',types[path.extname(filename).toLowerCase()]||'application/octet-stream');
    response.setHeader('Cache-Control','no-store');
    response.writeHead(200);response.end(request.method==='HEAD'?'':body);
  }catch{response.writeHead(404);response.end('Not found');}
});

server.listen(4173,'127.0.0.1',()=>{
  console.log('DreamHub staging preview: http://127.0.0.1:4173');
  console.log('Staging only. Keep this Terminal window open; press Control+C to stop.');
});
