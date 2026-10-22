import {validate} from './core.mjs';
// Canonicalize object keys so a manifest remains stable after JSON serialization.
export function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
function bytes(s){return new TextEncoder().encode(s)}
function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function checksum(state){
 if(!globalThis.crypto?.subtle)throw Error('Secure checksum support is unavailable in this browser. Export was not created.');
 return hex(await globalThis.crypto.subtle.digest('SHA-256',bytes(JSON.stringify(canonical(state)))));
}
export function inventory(state){
 validate(state);
 const types={};let deleted=0,links=0;
 for(const r of state.records){types[r.type]=(types[r.type]||0)+1;if(r.deletedAt)deleted++;links+=r.links.length;}
 return {records:state.records.length,deleted,links,types,revision:state.revision};
}
export function inspectLinks(state){
 validate(state);const ids=new Set(state.records.map(r=>r.id)),broken=[];
 for(const r of state.records)for(const target of r.links)if(!ids.has(target))broken.push({from:r.id,to:target});
 return broken;
}
export async function makeVerifiedBackup(state){
 const copy=structuredClone(validate(state));
 const manifest={algorithm:'SHA-256',checksum:await checksum(copy),inventory:inventory(copy)};
 return {format:'dreamhub-verified',version:1,exportedAt:new Date().toISOString(),manifest,state:copy};
}
export async function verifyBackup(input){
 if(!input||input.format!=='dreamhub-verified'||input.version!==1||!input.manifest||input.manifest.algorithm!=='SHA-256')throw Error('This is not a verified DreamHub archive.');
 const state=validate(input.state);
 const digest=await checksum(state);
 if(digest!==input.manifest.checksum)throw Error('Archive checksum mismatch. The backup may be corrupted or modified; no records were imported.');
 if(JSON.stringify(canonical(inventory(state)))!==JSON.stringify(canonical(input.manifest.inventory)))throw Error('Archive inventory mismatch. No records were imported.');
 return {state,inventory:inventory(state),brokenLinks:inspectLinks(state)};
}
