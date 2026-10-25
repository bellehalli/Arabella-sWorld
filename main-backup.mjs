import {validate} from './core.mjs';
import {encryptBackup,decryptBackup} from './vault-crypto.mjs';

const FORMAT='dreamhub-main-state';

export async function encryptMainBackup(state,passphrase){
 const snapshot=structuredClone(validate(structuredClone(state)));
 return encryptBackup({format:FORMAT,version:1,state:snapshot},passphrase);
}

export async function encryptMainBackupBundle(state,passphrase,attachments=[]){
 const snapshot=structuredClone(validate(structuredClone(state)));
 if(!Array.isArray(attachments)||attachments.length>1000)throw Error('The attachment manifest is invalid or too large.');
 const total=attachments.reduce((sum,item)=>sum+(Number(item?.byteSize)||0),0);
 if(total>14_000_000)throw Error('Attachments exceed the safe encrypted backup size. Export a smaller set of files first.');
 return encryptBackup({format:FORMAT,version:2,state:snapshot,attachments},passphrase);
}

export async function decryptMainBackup(envelope,passphrase){
 const bundle=await decryptMainBackupBundle(envelope,passphrase);
 return bundle.state;
}

export async function decryptMainBackupBundle(envelope,passphrase){
 const payload=await decryptBackup(envelope,passphrase);
 if(!payload||payload.format!==FORMAT||![1,2].includes(payload.version)||!payload.state)throw Error('This encrypted file is not a full DreamHub backup.');
 if(payload.version===2&&(!Array.isArray(payload.attachments)||payload.attachments.length>1000||payload.attachments.some(x=>!x||typeof x.recordId!=='string'||x.recordId.length>128||typeof x.fileName!=='string'||x.fileName.length<1||x.fileName.length>180||typeof x.mimeType!=='string'||!['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(x.mimeType)||!Number.isInteger(x.byteSize)||x.byteSize<1||x.byteSize>15*1024*1024||typeof x.sha256!=='string'||! /^[0-9a-f]{64}$/i.test(x.sha256)||typeof x.content!=='string'||x.content.length!==Math.ceil(x.byteSize/3)*4||!/^[A-Za-z0-9+/]+={0,2}$/.test(x.content))||payload.attachments.reduce((sum,x)=>sum+(x?.byteSize||0),0)>14_000_000))throw Error('The encrypted backup attachment manifest is invalid.');
 return {state:validate(payload.state),attachments:payload.version===2?payload.attachments:[]};
}
