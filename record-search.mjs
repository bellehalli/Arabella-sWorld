// Shared discovery for all DreamHub record types.
export function searchRecords(records,query='',options={}){
 const terms=String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 return (Array.isArray(records)?records:[]).filter(r=>{
  if(!r||r.deletedAt)return false;
  if(options.type&&r.type!==options.type)return false;
  if(options.favorite===true&&!r.favorite)return false;
  if(options.status&&r.status!==options.status)return false;
  if(options.from&&(!r.date||r.date<options.from))return false;
  if(options.to&&(!r.date||r.date>options.to))return false;
  if(options.tag&&!(r.tags||[]).some(t=>String(t).toLocaleLowerCase()===String(options.tag).toLocaleLowerCase()))return false;
  if(!terms.length)return true;
  // Sensitive bodies and structured details are never searchable through this global index.
  const fields=[r.title,r.type,...(r.tags||[])];
  if(!r.sensitive)fields.push(r.body,...Object.values(r.data||{}).filter(v=>typeof v==='string'||typeof v==='number'));
  const haystack=fields.filter(v=>v!=null).map(String).join(' ').toLocaleLowerCase();
  return terms.every(term=>haystack.includes(term));
 });
}
