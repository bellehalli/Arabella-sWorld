import {taskReadiness} from './planning-engine.mjs';

const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));

// Select one usable next action without changing task order, dates, or state.
// The choice is a nudge only: the person still decides whether to begin it.
export function chooseNextTask(records, today) {
 if (!validDate(today)) throw Error('Choose a valid planning date.');
 const candidates=(Array.isArray(records)?records:[])
  .filter(r=>r?.type==='task'&&!r.deletedAt&&r.status!=='Done')
  .filter(r=>taskReadiness(r,records).ready)
  .map(task=>{
   const date=validDate(task.date)?task.date:'';
   const daysLate=date&&date<today?Math.min(30,Math.floor((Date.parse(today+'T12:00:00Z')-Date.parse(date+'T12:00:00Z'))/86400000)):0;
   const dueScore=date===today?500:daysLate?400+daysLate:date&&date>today?-100:0;
   const priority=({Urgent:120,Critical:120,Important:70,Normal:20,Low:0})[task.data?.priority]??0;
   const duration=Number(task.minutes)||15;
   return {task,score:dueScore+(task.favorite?80:0)+priority+(task.data?.nextAction?10:0)+(duration<=25?10:0)};
  })
  .sort((a,b)=>b.score-a.score||(a.task.date||'9999-12-31').localeCompare(b.task.date||'9999-12-31')||String(a.task.title).localeCompare(String(b.task.title)));
 return candidates[0]?.task||null;
}
