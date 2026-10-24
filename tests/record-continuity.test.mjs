import test from 'node:test';import assert from 'node:assert/strict';
import {record} from '../core.mjs';
import {saveCollection,setCollectionMembers,deleteCollection,recordTemplate,applyRecordTemplate,backlinks,relationshipGraph,duplicateCandidates,mergeDuplicateRecords,validateCustomFields,futureLetter,dueFutureLetters,revealFutureLetter,annualMoments} from '../record-continuity.mjs';

test('collections validate names and keep unique membership without changing source records',()=>{
 let rows=saveCollection([],{id:'favorites',name:'Little wins',recordIds:['a','a','b']});assert.deepEqual(rows[0].recordIds,['a','b']);rows=setCollectionMembers(rows,'favorites',['b','c','c']);assert.deepEqual(rows[0].recordIds,['b','c']);assert.deepEqual(deleteCollection(rows,'favorites'),[]);assert.throws(()=>saveCollection([],{name:' '.repeat(2)}),/name/);
});
test('record templates preserve a reusable copy and clear identity, dates, links and sensitivity',()=>{
 const source=record('journal',{title:'Morning pages',body:'What matters today?',tags:['Journal'],date:'2026-10-24',links:['x'],sensitive:false,data:{notebook:'Becoming'}});const template=recordTemplate({name:'Morning reflection',source}),copy=applyRecordTemplate(template);assert.equal(copy.type,'journal');assert.equal(copy.title,source.title);assert.equal(copy.date,'');assert.deepEqual(copy.links,[]);assert.equal(copy.sensitive,false);assert.equal(copy.data.notebook,'Becoming');
});
test('backlinks and relationship graph expose both directions and omit private nodes',()=>{
 const a=record('goal',{id:'a',title:'Goal',links:['b']}),b=record('task',{id:'b',title:'Step'}),c=record('journal',{id:'c',title:'Private',sensitive:true,links:['a']});
 assert.deepEqual(backlinks([a,b,c],'b').map(x=>x.record.id),['a']);const graph=relationshipGraph([a,b,c]);assert.deepEqual(graph.nodes.map(x=>x.id),['a','b']);assert.deepEqual(graph.edges,[{from:'a',to:'b'}]);
});
test('duplicate review is exact-title, same-type, private-safe and merge preserves content with recovery',()=>{
 const a=record('note',{id:'a',title:'A  thought',body:'First detail',tags:['One']}),b=record('note',{id:'b',title:'a thought',body:'Second detail',tags:['Two']}),privateCopy=record('note',{id:'p',title:'A thought',sensitive:true});
 const pairs=duplicateCandidates([a,b,privateCopy]);assert.equal(pairs.length,1);const merged=mergeDuplicateRecords(a,b,{at:'2026-10-24T12:00:00Z'});assert.match(merged.keep.body,/Second detail/);assert.deepEqual(merged.keep.tags,['One','Two']);assert.equal(merged.duplicate.deletedAt,'2026-10-24T12:00:00Z');assert.throws(()=>mergeDuplicateRecords(a,privateCopy),/safe duplicate/);
});
test('custom fields require unique valid IDs and constrained select choices',()=>{
 assert.equal(validateCustomFields([{id:'source_url',label:'Original source',kind:'text'}]).length,1);assert.throws(()=>validateCustomFields([{id:'x',label:'One',kind:'text'},{id:'x',label:'Two',kind:'text'}]),/unique ID/);assert.throws(()=>validateCustomFields([{id:'pick',label:'Pick one',kind:'select',options:[]}]),/options/);
});
test('Future Self letters stay sensitive until their dated in-app reveal',()=>{
 const letter=futureLetter({title:'To my future self',body:'You made it through.',revealDate:'2026-11-01',today:'2026-10-24'});assert.equal(letter.sensitive,true);assert.equal(dueFutureLetters([letter],'2026-10-31').length,0);assert.equal(dueFutureLetters([letter],'2026-11-01').length,1);assert.equal(revealFutureLetter(letter,'2026-10-31'),null);assert.equal(revealFutureLetter(letter,'2026-11-01').data.futureLetter.status,'revealed');assert.throws(()=>futureLetter({title:'x',body:'y',revealDate:'2026-02-30',today:'2026-02-01'}),/reveal date/);
});
test('annual moments group only dated, non-sensitive saved memories and writing',()=>{
 const rows=[record('memory',{id:'m',title:'Museum',date:'2026-03-01'}),record('journal',{id:'j',title:'Private',date:'2026-03-02',sensitive:true}),record('diary',{id:'d',title:'A day',date:'2026-12-01'})];const moments=annualMoments(rows,2026);assert.deepEqual(moments.map(x=>x.month),[3,12]);assert.deepEqual(moments[0].items.map(x=>x.id),['m']);
});
