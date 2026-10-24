import {validate} from './core.mjs';
import {encryptBackup,decryptBackup} from './vault-crypto.mjs';

const FORMAT='dreamhub-main-state';

export async function encryptMainBackup(state,passphrase){
 const snapshot=structuredClone(validate(structuredClone(state)));
 return encryptBackup({format:FORMAT,version:1,state:snapshot},passphrase);
}

export async function decryptMainBackup(envelope,passphrase){
 const payload=await decryptBackup(envelope,passphrase);
 if(!payload||payload.format!==FORMAT||payload.version!==1||!payload.state)throw Error('This encrypted file is not a full DreamHub backup.');
 return validate(payload.state);
}
