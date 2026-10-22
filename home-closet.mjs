export const weeklyHome=[
 {day:'Monday',name:'Laundry & linens',tasks:['Wash and dry clothing','Change pillowcases and bedding','Fold and put away clean clothes']},
 {day:'Tuesday',name:'Bathroom refresh',tasks:['Clean sink and mirror','Clean toilet and shower as needed','Replace towels and restock supplies']},
 {day:'Wednesday',name:'Bedroom sanctuary',tasks:['Dust and vacuum','Clear bedside surfaces','Declutter one small zone']},
 {day:'Thursday',name:'Kitchen refresh',tasks:['Clean sink and counters','Review refrigerator and leftovers','Sweep or mop floors']},
 {day:'Friday',name:'Closet & beauty reset',tasks:['Put away outfits','Clean makeup brushes when due','Review laundry basket']},
 {day:'Saturday',name:'Flexible catch-up',tasks:['Finish missed essentials','Rotate one deep-clean task','Wash pet bedding when due']},
 {day:'Sunday',name:'Gentle weekly reset',tasks:['Plan outfits','Check cleaning supplies','Choose next week’s priorities']}
];
export const wardrobeCategories=['Top','Dress','Jeans','Pants','Skirt','Outerwear','Shoes','Bag','Accessory','Other'];
export const laundryStates=['Clean','Worn','Laundry','Washing','Drying','Repair','Stored'];
export function homeForDay(date){const d=new Date(date+'T12:00:00');if(Number.isNaN(d.getTime()))return null;return weeklyHome[(d.getDay()+6)%7]}
export function eligibleForOutfit(item){return item?.type==='wardrobe'&&!item.deletedAt&&(item.data?.laundry||'Clean')==='Clean'}
export function outfitCandidates(items,occasion='Any'){return items.filter(eligibleForOutfit).filter(x=>occasion==='Any'||!x.data.occasion||x.data.occasion.toLowerCase().includes(occasion.toLowerCase()))}
export function outfitSuggestion(items,occasion='Any',seed=0){const candidates=outfitCandidates(items,occasion),pick=(categories)=>{const pool=candidates.filter(x=>categories.includes(x.data.category));return pool.length?pool[(Math.abs(seed)+categories.join('').length)%pool.length]:null};const dress=pick(['Dress']),top=pick(['Top']),bottom=pick(['Jeans','Pants','Skirt']),shoes=pick(['Shoes']);return {pieces:[...(dress?[dress]:[top,bottom]),shoes].filter(Boolean),complete:!!(shoes&&(dress||(top&&bottom)))}}
export function fitProfile(item){return {brand:item?.data?.brand||'',taggedSize:item?.data?.size||'',fit:item?.data?.fit||'Not recorded'}}
// Brand-size recommendations must be grounded in a verified category-specific chart and current measurements.
export function sizeRecommendation({chart,measurements}){if(!chart||!measurements)return {status:'Needs measurements and verified brand chart'};return {status:'Review chart against measurements; fit is not guaranteed'};}
