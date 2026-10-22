import {checklist} from './care-workspace.mjs';
import {planDay} from './executive-day-director.mjs';
export function careAgenda({care,date,fixed=[],work=[],studio=[],academy=[],social=[],start='10:00',end='22:00'}){
 const steps=checklist(care,date),remaining=steps.filter(s=>!s.done);
 const tasks=[...remaining.map(s=>({id:'care:'+s.routineId+':'+s.stepId,title:s.title,minutes:5,priority:3,source:'care'})),...work,...studio,...academy,...social];
 const plan=planDay({date,start,end,fixed,tasks});
 return {...plan,careDue:steps.length,careCompleted:steps.length-remaining.length,careRemaining:remaining.length};
}
