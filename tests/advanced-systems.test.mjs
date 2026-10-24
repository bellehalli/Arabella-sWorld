import test from 'node:test';
import assert from 'node:assert/strict';
import {lifeTimeline,activeSeason,decisionMatrix,energyPlan,opportunityScore,sundaySalon,chooseAdventure,futureSnapshot,recoveryDigest} from '../advanced-systems.mjs';
import {record,blank,validate} from '../core.mjs';
const make=(type,opts={})=>record(type,opts);

test('life timeline filters dates and categories, hides private entries unless requested, and never previews private text',()=>{
 const rows=[make('memory',{id:'m1',title:'A quiet day',body:'public detail',date:'2026-04-02',tags:['garden']}),make('journal',{id:'j1',title:'Private title',body:'private words',date:'2026-04-01',sensitive:true}),make('event',{id:'e1',title:'Later',date:'2026-05-01'})];
 assert.deepEqual(lifeTimeline(rows,{from:'2026-04-01',to:'2026-04-30'}).map(x=>x.id),['m1']);assert.deepEqual(lifeTimeline(rows,{category:'Memories'}).map(x=>x.id),['m1']);
 assert.deepEqual(lifeTimeline(rows,{query:'garden'}).map(x=>x.id),['m1']);assert.deepEqual(lifeTimeline(rows,{query:'public detail'}).map(x=>x.id),['m1']);assert.deepEqual(lifeTimeline(rows,{query:'private words',includeSensitive:true}).map(x=>x.id),[]);assert.deepEqual(lifeTimeline(rows,{query:'private title',includeSensitive:true}).map(x=>x.id),['j1']);
 const privateRow=lifeTimeline(rows,{includeSensitive:true}).find(x=>x.id==='j1');assert.equal(privateRow.title,'Private title');assert.equal(privateRow.body,'');
});

test('personal seasons select the latest active chapter and ignore closed chapters',()=>{
 const rows=[make('season',{id:'old',date:'2026-01-01',data:{end:'2026-02-01'}}),make('season',{id:'current',date:'2026-03-01',data:{end:'2026-12-31'}})];
 assert.equal(activeSeason(rows,'2026-04-01').id,'current');assert.equal(activeSeason(rows,'2027-01-01'),null);assert.throws(()=>activeSeason(rows,'bad'),/valid date/);
});

test('decision observatory calculates weighted tradeoffs without selecting a winner',()=>{
 const rows=decisionMatrix([{name:'A',pros:['steady'],cons:['slower'],ratings:{Pay:5,Time:2}},{name:'B',ratings:{Pay:3,Time:5}}],[{name:'Pay',weight:2},{name:'Time',weight:1}]);
 assert.equal(rows[0].weightedScore,4);assert.equal(rows[1].weightedScore,3.67);assert.equal('choice' in rows[0],false);assert.throws(()=>decisionMatrix([{name:'A',ratings:{Pay:3}}],[{name:'Pay',weight:0}]),/weight/);
});

test('energy economics respects energy, time, sensitive records and open-time choices',()=>{
 const rows=[make('task',{id:'small',title:'Small',minutes:20,energy:'Low',data:{reward:5}}),make('task',{id:'big',title:'Big',minutes:60,energy:'High',data:{reward:5}}),make('task',{id:'private',title:'Private',minutes:10,sensitive:true})];
 const plan=energyPlan(rows,{energy:1,availableMinutes:25,today:'2026-04-01'});assert.deepEqual(plan.selected.map(x=>x.id),['small']);assert.equal(plan.remainingMinutes,5);assert(!plan.deferred.some(x=>x.id==='private'));assert.equal(plan.requiresUserChoice,true);
});

test('opportunity vault scores only user ratings and requires positive criteria weights',()=>{
 const item={data:{ratings:{Meaning:4,Flexibility:5}}};assert.equal(opportunityScore(item,[{name:'Meaning',weight:2},{name:'Flexibility',weight:1}]).score,4.33);assert.equal(opportunityScore(item,[{name:'Meaning',weight:2},{name:'Flexibility',weight:1}]).decision,'manual');assert.throws(()=>opportunityScore(item,[{name:'Meaning',weight:-1}]),/positive/);
});

test('Sunday Salon summarizes only dated, non-private records from the chosen Monday week',()=>{
 const rows=[make('task',{id:'done',title:'Win',date:'2026-04-06',status:'Done'}),make('task',{id:'secret',title:'Private task',date:'2026-04-07',status:'Next',sensitive:true}),make('transaction',{date:'2026-04-08',sensitive:true,data:{amount:500,direction:'Income'}}),make('transaction',{date:'2026-04-07',data:{amount:1200,direction:'Expense'}}),make('event',{date:'',title:'Unknown date'})];
 const week=sundaySalon(rows,'2026-04-06');assert.deepEqual(week.wins,['Win']);assert.deepEqual(week.unfinished,[]);assert.equal(week.income,0);assert.equal(week.spending,1200);assert.deepEqual(week.events,[]);assert.throws(()=>sundaySalon(rows,'2026-04-07'),/Monday/);
});

test('micro-adventures draw only saved ideas that fit all user constraints',()=>{
 const rows=[make('experiencePlan',{id:'inside',data:{amount:800,duration:45,energy:'Low',setting:'Indoor'}}),make('experiencePlan',{id:'outside',data:{amount:1200,duration:60,energy:'High',setting:'Outdoor'}})];
 assert.equal(chooseAdventure(rows,{budgetCents:1000,energy:'Low',minutes:50,setting:'Indoor',random:()=>0}).id,'inside');assert.equal(chooseAdventure(rows,{budgetCents:100,energy:'Low',minutes:50,setting:'Indoor'}),null);
});

test('Future Museum snapshots copy selected content and explicitly reject sensitive entries',()=>{
 const source=make('goal',{id:'g',title:'Write a book',body:'Drafting',date:'2026-04-01',data:{progress:25},tags:['Creative']});const snap=futureSnapshot({title:'A hope',date:'2026-04-03',entries:[source]});source.title='Changed later';assert.equal(snap.entries[0].title,'Write a book');assert.equal(snap.immutable,true);assert.throws(()=>futureSnapshot({title:'Private',date:'2026-04-03',entries:[make('goal',{sensitive:true})]}),/Sensitive/);
 const state=blank();state.records=[make('opportunity'),make('policy')];assert.doesNotThrow(()=>validate(state));
});

test('Gentle Recovery Room has a neutral welcome, a capped shortlist, and no private records',()=>{
 const rows=[...Array.from({length:8},(_,i)=>make('task',{id:'t'+i,title:'Task '+i,date:`2026-04-${String(i+1).padStart(2,'0')}`})),make('task',{id:'private',title:'Private',sensitive:true})];
 const digest=recoveryDigest(rows,{daysAway:20,today:'2026-04-01',limit:99});assert.equal(digest.show,true);assert.equal(digest.items.length,5);assert(digest.message.includes('Welcome back'));assert(!digest.items.some(x=>x.id==='private'));assert.equal(recoveryDigest(rows,{daysAway:13,today:'2026-04-01'}).show,false);
});
