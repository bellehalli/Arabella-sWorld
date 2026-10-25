import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {encryptGoogleTokens,decryptGoogleTokens} from '../api/auth/google/token-vault.mjs';

test('Google token envelope round trips and binds to owner',()=>{
 const old=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
 try{
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY=randomBytes(32).toString('base64');
  const tokens={refresh_token:'private-refresh',access_token:'short-lived'};
  const encrypted=encryptGoogleTokens(tokens,'owner_12345678');
  assert.equal(JSON.stringify(encrypted).includes('private-refresh'),false);
  assert.deepEqual(decryptGoogleTokens(encrypted,'owner_12345678'),tokens);
  assert.throws(()=>decryptGoogleTokens(encrypted,'owner_87654321'));
  const tampered={...encrypted,ciphertext:Buffer.from('modified').toString('base64')};
  assert.throws(()=>decryptGoogleTokens(tampered,'owner_12345678'));
 }finally{if(old===undefined)delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;else process.env.GOOGLE_TOKEN_ENCRYPTION_KEY=old;}
});
test('Missing encryption key fails closed',()=>{
 const old=process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
 try{delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;assert.throws(()=>encryptGoogleTokens({},'owner_12345678'));}
 finally{if(old!==undefined)process.env.GOOGLE_TOKEN_ENCRYPTION_KEY=old;}
});
