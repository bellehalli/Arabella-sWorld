// Quote every cell and neutralize spreadsheet formula prefixes in text fields.
// Numeric cells can opt out after the caller has validated/constructed a number.
export function csvCell(value,{untrustedText=true}={}){
 const raw=String(value??'');
 const safe=untrustedText&&/^[\u0000-\u0020]*[=+\-@]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}

export function csvDocument(rows,{numericColumns=[]}={}){return '\uFEFF'+rows.map(row=>row.map((value,index)=>csvCell(value,{untrustedText:!numericColumns.includes(index)})).join(',')).join('\r\n');}
