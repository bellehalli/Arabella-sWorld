import {test} from 'node:test';import assert from 'node:assert/strict';import {Store,record,KEY} from '../core.mjs';
function memory(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
test('restoring unknown record returns a helpful error and does not mutate storage',async()=>{
 const storage=memory(),store=new Store(storage);const before=JSON.stringify(store.state);
 await assert.rejects(()=>store.restore('missing'),/Entry not found/);
 assert.equal(JSON.stringify(store.state),before);assert.equal(storage.getItem(KEY),null);
});
test('restoring an active record does not alter revision',async()=>{
 const storage=memory(),store=new Store(storage);const r=record('note',{title:'Keep'});await store.put(r);
 const before=JSON.stringify(store.state);
 await assert.rejects(()=>store.restore(r.id),/already active/);
 assert.equal(JSON.stringify(store.state),before);
});
test('trashed records can still be restored',async()=>{
 const store=new Store(memory()),r=record('note',{title:'Recover'});await store.put(r);await store.trash(r.id);await store.restore(r.id);
 assert.equal(store.state.records[0].deletedAt,null);
});
