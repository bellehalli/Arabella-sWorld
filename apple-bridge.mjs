import {zonedInstants} from './planning-engine.mjs';
// Apple-first bridge: offline parsing and review only. No device APIs, credentials, or network calls.
const unfold=s=>String(s).replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'');
const unescapeText=s=>String(s||'').replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');
const isoDate=s=>/^\d{8}$/.test(s)?s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8):null;
const field=(lines,key)=>{const line=lines.find(l=>l.split(':',1)[0].split(';')[0].toUpperCase()===key);return line?line.slice(line.indexOf(':')+1):''};
export function previewAppleCalendar(ics,{limit=2000}={}){
 if(typeof ics!=='string'||ics.length>2_000_000||!ics.includes('BEGIN:VCALENDAR'))throw Error('Invalid or oversized calendar export');
 const entries=unfold(ics).split(/\r?\n/),events=[];let current=null;
 for(const line of entries){if(line==='BEGIN:VEVENT'){current=[];continue;}if(line==='END:VEVENT'){if(!current)continue;const uid=field(current,'UID'),startLine=current.find(l=>l.split(':',1)[0].split(';')[0].toUpperCase()==='DTSTART')||'',endLine=current.find(l=>l.split(':',1)[0].split(';')[0].toUpperCase()==='DTEND')||'',raw=field(current,'DTSTART'),rawEnd=field(current,'DTEND'),date=isoDate(raw.slice(0,8)),title=unescapeText(field(current,'SUMMARY')),zone=/TZID=([^;:]+)/i.exec(startLine)?.[1]||(raw.endsWith('Z')?'Etc/UTC':'');if(zone){try{new Intl.DateTimeFormat('en',{timeZone:zone});}catch{throw Error('Calendar event uses an unsupported timezone.');}}const timed=/^\d{8}T\d{4}(?:\d{2})?Z?$/.test(raw),time=timed?raw.slice(9,13).replace(/(..)(..)/,'$1:$2'):'';const endTime=/^\d{8}T\d{4}(?:\d{2})?Z?$/.test(rawEnd)?rawEnd.slice(9,13).replace(/(..)(..)/,'$1:$2'):'';if(uid&&date&&title){events.push({source:'apple-calendar',externalId:uid,title,date,time,endTime,timeZone:zone,description:unescapeText(field(current,'DESCRIPTION')),status:'review',approved:false});if(events.length>limit)throw Error('Calendar export exceeds preview limit');}current=null;continue;}if(current)current.push(line);}
 return events;
}
export function appleImportReview(existing,incoming,{approvedIds=[]}={}){
 const known=new Set(existing.filter(r=>!r.deletedAt).map(r=>r.data?.appleExternalId).filter(Boolean)),approvals=new Set(approvedIds),seen=new Set(),proposals=[];
 for(const item of incoming){if(!item.externalId||seen.has(item.externalId)||known.has(item.externalId))continue;seen.add(item.externalId);proposals.push({...item,approved:approvals.has(item.externalId),status:approvals.has(item.externalId)?'approved':'review'});}
 return proposals;
}
export function calendarExport(records,{name='DreamHub',timezone='America/Detroit'}={}){
 const safe=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DreamHub//Apple Bridge//EN','X-WR-CALNAME:'+safe(name)],stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 for(const r of records){if(r.deletedAt||!/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')||!['event','task','experiencePlan'].includes(r.type))continue;const date=r.date.replace(/-/g,''),zone=r.data?.timeZone||timezone,fold=r.data?.timeFold==='later'?1:0;let start=`DTSTART;VALUE=DATE:${date}`,end='';if(r.type==='event'&&r.data?.time){const starts=zonedInstants(r.date,r.data.time,zone);if(!starts.length)throw Error(`“${r.title}” has a local time that does not exist; edit it before export.`);start=`DTSTART:${stamp(starts[fold]||starts[0])}`;if(r.data.endTime){const ends=zonedInstants(r.date,r.data.endTime,zone);if(!ends.length)throw Error(`“${r.title}” has a local end time that does not exist; edit it before export.`);end=`DTEND:${stamp(ends[fold]||ends[0])}`;}}lines.push('BEGIN:VEVENT','UID:'+safe(r.id)+'@dreamhub.local','DTSTAMP:'+stamp(new Date()),start,end,'SUMMARY:'+safe(r.title),'DESCRIPTION:'+safe(r.body),'END:VEVENT');}
 return lines.concat('END:VCALENDAR','').join('\r\n');
}
export const appleCapabilities=Object.freeze({calendar:'ICS preview/import/export now; native EventKit required for live read/write',reminders:'Apple Shortcuts or native EventKit integration required',notes:'User-selected exports or Shortcuts only; no blanket Notes API',health:'Native HealthKit app and separate explicit permissions required',photos:'User-selected photos only',contacts:'User-selected export or native consent-based access',files:'User-selected Files/iCloud Drive documents only',shortcuts:'Manual or user-triggered Shortcut exchange; secure authenticated endpoint required before automatic delivery'});
