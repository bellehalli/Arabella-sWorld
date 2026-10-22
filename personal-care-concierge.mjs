// DreamHub 3: care concierge starter catalog. All items are proposed, not owned or diagnosed.
export const careAreas=Object.freeze(['face','body','hair-scalp','dental','hands-feet','fragrance','fitness-wellness']);
export const starterCare=[
 {id:'face-am',area:'face',name:'Morning face care',frequency:'daily',steps:[['Cleanse gently','gentle facial cleanser','recommended'],['Moisturize','facial moisturizer','recommended'],['Apply sunscreen','broad-spectrum SPF 30+','recommended']]},
 {id:'face-pm',area:'face',name:'Evening face care',frequency:'daily',steps:[['Cleanse','gentle facial cleanser','recommended'],['Moisturize','facial moisturizer','recommended']]},
 {id:'body-daily',area:'body',name:'Body care',frequency:'daily',steps:[['Shower or wash up','gentle body wash','recommended'],['Moisturize skin','body lotion','recommended']]},
 {id:'hair-weekly',area:'hair-scalp',name:'Weekly hair care',frequency:'weekly',steps:[['Cleanse scalp','shampoo appropriate to scalp needs','recommended'],['Condition and detangle','conditioner and detangling tool','recommended'],['Style','styling product chosen together','considering']]},
 {id:'dental-am',area:'dental',name:'Morning dental care',frequency:'daily',steps:[['Brush teeth for two minutes','fluoride toothpaste and soft-bristled brush','recommended']]},
 {id:'dental-pm',area:'dental',name:'Evening dental care',frequency:'daily',steps:[['Clean between teeth','floss or appropriate interdental cleaner','recommended'],['Brush teeth for two minutes','fluoride toothpaste and soft-bristled brush','recommended']]},
 {id:'hands-feet',area:'hands-feet',name:'Hands and feet maintenance',frequency:'weekly',steps:[['Check nails and cuticles','nail file and moisturizer','recommended'],['Moisturize feet','foot cream or lotion','recommended']]},
 {id:'fragrance',area:'fragrance',name:'Optional fragrance',frequency:'optional',steps:[['Choose a scent if desired','fragrance sample or owned scent','wishlist']]},
 {id:'fitness',area:'fitness-wellness',name:'Movement and recovery',frequency:'weekly',steps:[['Complete planned movement','comfortable clothing and available equipment','recommended'],['Recovery check-in','water and rest','recommended']]}
];
export function careChecklist(area){if(!careAreas.includes(area))throw Error('Unknown care area');return starterCare.filter(x=>x.area===area).map(x=>({...x,steps:x.steps.map(([title,product,ownership])=>({title,product,ownership,completed:false}))}));}
export function validateCareCatalog(items=starterCare){const ids=new Set();for(const item of items){if(ids.has(item.id)||!careAreas.includes(item.area)||!item.steps?.length)throw Error('Invalid care catalog');ids.add(item.id);}return true;}
