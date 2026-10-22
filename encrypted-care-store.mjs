import {CARE_KEY,emptyCare,validateCare} from './care-workspace.mjs';
import {encryptBackup,decryptBackup} from './vault-crypto.mjs';
export const ENCRYPTED_CARE_KEY='arabella-dreamhub-care-vault-v1';
export function encryptedCareStore(storage){
 let unlocked=false,passphrase='',state=null;
 return {
  get unlocked(){return unlocked;},
  async unlock(pass,{allowMigration=false}={}){
   if(typeof pass!=='string'||pass.length<16)throw Error('Vault passphrase must contain at least 16 characters');
   const encrypted=storage.getItem(ENCRYPTED_CARE_KEY),legacy=storage.getItem(CARE_KEY);
   if(encrypted){
    const restored=await decryptBackup(JSON.parse(encrypted),pass);
    validateCare(restored);state=restored;
   }else if(legacy){
    if(!allowMigration)throw Error('Existing unencrypted care records found. Confirm migration before proceeding.');
    const restored=JSON.parse(legacy);validateCare(restored);
    const envelope=await encryptBackup(restored,pass);
    storage.setItem(ENCRYPTED_CARE_KEY,JSON.stringify(envelope));
    // Remove the plaintext copy only after the encrypted copy is successfully persisted.
    storage.removeItem(CARE_KEY);state=restored;
   }else{
    const fresh=emptyCare();const envelope=await encryptBackup(fresh,pass);
    storage.setItem(ENCRYPTED_CARE_KEY,JSON.stringify(envelope));state=fresh;
   }
   passphrase=pass;unlocked=true;return structuredClone(state);
  },
  load(){if(!unlocked)throw Error('Care vault is locked');return structuredClone(state);},
  async save(next){if(!unlocked)throw Error('Care vault is locked');validateCare(next);
   const envelope=await encryptBackup(next,passphrase);
   storage.setItem(ENCRYPTED_CARE_KEY,JSON.stringify(envelope));state=structuredClone(next);
  },
  lock(){passphrase='';state=null;unlocked=false;}
 };
}
