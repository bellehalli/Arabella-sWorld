import {Store,blank,validate} from './core.mjs';
import {verifyBackup,inventory,inspectLinks} from './record-backup.mjs';
export async function dryRunRestore(archive){
 const verified=await verifyBackup(archive);
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};
 const sandbox=new Store(storage);
 await sandbox.restoreBackup(verified.state);
 const restored=validate(sandbox.read()),before=inventory(verified.state),after=inventory(restored);
 const recordMatch=restored.records.length===verified.state.records.length&&restored.records.every(r=>JSON.stringify(r)===JSON.stringify(verified.state.records.find(x=>x.id===r.id)));
 const links=inspectLinks(restored);
 return {ok:recordMatch&&links.length===0,recordMatch,expectedRecords:before.records,restoredRecords:after.records,brokenLinks:links,notes:['Dry run used an isolated in-memory store; no live account or existing browser records were changed.','Cloud permissions, media files, device backups and production disaster recovery are not tested by this drill.']};
}
