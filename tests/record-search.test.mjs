import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchRecords} from '../record-search.mjs';
const rows=[
 {id:'1',type:'application',title:'Designer role',body:'Interview on Monday',tags:['Career'],data:{company:'Example Studio',salary:'$80k'},deletedAt:null,sensitive:false},
 {id:'2',type:'journal',title:'Personal reflection',body:'secret phrase',tags:['Private'],data:{note:'hidden detail'},deletedAt:null,sensitive:true},
 {id:'3',type:'task',title:'Old task',body:'Interview',tags:[],data:{},deletedAt:'2026-10-01',sensitive:false}
];
test('search includes structured fields and matches multiple terms',()=>{assert.deepEqual(searchRecords(rows,'example studio').map(x=>x.id),['1']);assert.deepEqual(searchRecords(rows,'designer career').map(x=>x.id),['1']);});
test('search excludes trashed records',()=>assert.equal(searchRecords(rows,'interview').length,1));
test('search never indexes sensitive body or metadata',()=>{assert.equal(searchRecords(rows,'secret phrase').length,0);assert.equal(searchRecords(rows,'hidden detail').length,0);assert.deepEqual(searchRecords(rows,'personal reflection').map(x=>x.id),['2']);});
test('search can filter by type and tag',()=>{assert.deepEqual(searchRecords(rows,'',{type:'journal',tag:'private'}).map(x=>x.id),['2']);});
