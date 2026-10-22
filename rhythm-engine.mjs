// Local, deterministic recurrence evaluation. Templates are definitions, not generated duplicate tasks.
// A completion is stored as an ordinary dated home record, preserving existing backup format.
export const homeRhythms=[
 {id:'laundry',title:'Wash and dry clothing',weekday:1,category:'Laundry'},
 {id:'linens',title:'Change pillowcases and bedding',weekday:1,category:'Laundry'},
 {id:'fold',title:'Fold and put away clean clothes',weekday:1,category:'Laundry'},
 {id:'bathroom',title:'Clean bathroom sink and mirror',weekday:2,category:'Cleaning'},
 {id:'toilet',title:'Clean toilet and shower as needed',weekday:2,category:'Cleaning'},
 {id:'towels',title:'Replace towels',weekday:2,category:'Laundry'},
 {id:'bedroom',title:'Dust and vacuum bedroom',weekday:3,category:'Cleaning'},
 {id:'declutter',title:'Declutter one small zone',weekday:3,category:'Decluttering'},
 {id:'kitchen',title:'Clean kitchen counters and sink',weekday:4,category:'Cleaning'},
 {id:'fridge',title:'Review refrigerator and leftovers',weekday:4,category:'Cleaning'},
 {id:'floors',title:'Sweep or mop floors',weekday:4,category:'Cleaning'},
 {id:'closet',title:'Put away outfits',weekday:5,category:'Wardrobe'},
 {id:'brushes',title:'Clean makeup brushes when due',weekday:5,category:'Beauty'},
 {id:'catchup',title:'Catch up on missed essentials',weekday:6,category:'Cleaning'},
 {id:'petbedding',title:'Wash pet bedding when due',weekday:6,category:'Pet'},
 {id:'reset',title:'Plan next week’s priorities',weekday:0,category:'Planning'},
 {id:'supplies',title:'Check cleaning supplies',weekday:0,category:'Inventory'}
];
export const dateOnly=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+'T12:00:00').getTime());
export function weekStart(date){if(!dateOnly(date))throw Error('Invalid date');const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
export function dateShift(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
export function rhythmDue(records,date,{includeOverdue=true}={}){if(!dateOnly(date))throw Error('Invalid date');const start=weekStart(date);return homeRhythms.flatMap(template=>{const due=dateShift(start,(template.weekday+6)%7);const done=records.some(r=>!r.deletedAt&&r.type==='home'&&r.status==='Done'&&r.data?.rhythmId===template.id&&r.date>=start&&r.date<=date);if(done)return [];if(due>date||(!includeOverdue&&due!==date))return [];return [{...template,due,overdue:due<date}];});}
export function rhythmCompleted(records,date){const start=weekStart(date);return homeRhythms.filter(t=>records.some(r=>!r.deletedAt&&r.type==='home'&&r.status==='Done'&&r.data?.rhythmId===t.id&&r.date>=start&&r.date<=date));}
export function recurrenceNextDate({from,frequency='weekly',interval=1,weekday=null}){if(!dateOnly(from)||!Number.isInteger(interval)||interval<1||interval>365)throw Error('Invalid recurrence');const d=new Date(from+'T12:00:00');if(frequency==='daily')d.setDate(d.getDate()+interval);else if(frequency==='weekly')d.setDate(d.getDate()+7*interval);else if(frequency==='monthly') {const original=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+interval);const max=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(original,max));}else throw Error('Unsupported frequency');if(weekday!==null&&frequency==='weekly'){if(!Number.isInteger(weekday)||weekday<0||weekday>6)throw Error('Invalid weekday');d.setDate(d.getDate()+(weekday-d.getDay()+7)%7);}return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
