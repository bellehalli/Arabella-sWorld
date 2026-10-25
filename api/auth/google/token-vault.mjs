import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';

// Cryptographic building block only. Callers must enforce owner authorization and store
// ciphertext in a private, owner-scoped database table with server-only access.
function keyFromEnvironment(){
 const raw=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
 if(!raw)throw Error('Google token encryption is not configured');
 const key=Buffer.from(raw,'base64');
 if(key.length!==32)throw Error('Google token encryption key must be 32 bytes (base64 encoded)');
 return key;
}
function ownerId(value){
 if(typeof value!=='string'||!/^[-_a-zA-Z0-9]{8,128}$/.test(value))throw Error('Invalid owner identifier');
 return value;
}
export function encryptGoogleTokens(tokens,owner){
 const key=keyFromEnvironment(),id=ownerId(owner);
 if(!tokens||typeof tokens!=='object'||Array.isArray(tokens))throw Error('Invalid token payload');
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from('dreamhub:google:'+id));
 const data=Buffer.concat([cipher.update(JSON.stringify(tokens),'utf8'),cipher.final()]);
 return {version:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:data.toString('base64')};
}
export function decryptGoogleTokens(envelope,owner){
 const key=keyFromEnvironment(),id=ownerId(owner);
 if(envelope?.version!==1)throw Error('Unsupported token envelope');
 const iv=Buffer.from(envelope.iv,'base64'),tag=Buffer.from(envelope.tag,'base64');
 if(iv.length!==12||tag.length!==16)throw Error('Invalid token envelope');
 const decipher=createDecipheriv('aes-256-gcm',key,iv);
 decipher.setAAD(Buffer.from('dreamhub:google:'+id));decipher.setAuthTag(tag);
 const plain=Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]);
 return JSON.parse(plain.toString('utf8'));
}
