// Curated starter guidance, not a diagnosis or a live shopping feed.
export const recommendationRules=Object.freeze([
 {area:'dental',title:'Fluoride toothpaste',priority:'essential',budget:'low',reason:'Supports twice-daily brushing',searchTerm:'ADA accepted fluoride toothpaste'},
 {area:'dental',title:'Soft-bristled toothbrush',priority:'essential',budget:'low',reason:'Gentle daily brushing',searchTerm:'soft bristle toothbrush'},
 {area:'dental',title:'Interdental cleaner',priority:'essential',budget:'low',reason:'Daily cleaning between teeth; string floss is an affordable option',searchTerm:'dental floss'},
 {area:'face',title:'Gentle facial cleanser',priority:'essential',budget:'low',reason:'Simple cleansing before adding active treatments',searchTerm:'gentle fragrance free face cleanser'},
 {area:'face',title:'Facial moisturizer',priority:'essential',budget:'low',reason:'Supports skin comfort and barrier',searchTerm:'fragrance free face moisturizer'},
 {area:'face',title:'Broad-spectrum SPF 30+',priority:'essential',budget:'low',reason:'Daily sun protection',searchTerm:'broad spectrum sunscreen SPF 30'},
 {area:'body',title:'Gentle body wash',priority:'essential',budget:'low',reason:'Basic bathing',searchTerm:'gentle body wash'},
 {area:'body',title:'Body moisturizer',priority:'essential',budget:'low',reason:'Moisturizing after bathing',searchTerm:'body lotion'},
 {area:'hair-scalp',title:'Scalp-appropriate shampoo',priority:'essential',budget:'low',reason:'Weekly wash-day cleansing; choose for scalp needs',searchTerm:'gentle shampoo'},
 {area:'hair-scalp',title:'Slip-rich conditioner',priority:'essential',budget:'low',reason:'Detangling and conditioning',searchTerm:'detangling conditioner'},
 {area:'hands-feet',title:'Multiuse moisturizer',priority:'optional',budget:'low',reason:'Can use existing body moisturizer for hands and feet',searchTerm:'body moisturizer'},
 {area:'fragrance',title:'Fragrance sample',priority:'wishlist',budget:'later',reason:'Optional scent discovery; not required for care',searchTerm:'fragrance sample'},
 {area:'fitness-wellness',title:'Use existing workout equipment',priority:'free',budget:'none',reason:'No new purchase required',searchTerm:''}
]);
export function recommendCare({area,products=[],availableCents=0}={}){
 if(!Number.isSafeInteger(availableCents)||availableCents<0)throw Error('Invalid available budget');
 const owned=new Set(products.filter(p=>p.status==='owned').map(p=>p.name.trim().toLowerCase()));
 return recommendationRules.filter(x=>!area||x.area===area).map(x=>({...x,ownership:owned.has(x.title.toLowerCase())?'owned':'considering',purchaseApproved:false,affordable:'price not verified',budgetAvailableCents:availableCents}));
}
export function importRecommendations(state,approved=[]){
 const next=structuredClone(state);
 for(const r of approved){if(!r.approved)continue;if(!recommendationRules.some(x=>x.title===r.title&&x.area===r.area))throw Error('Unknown recommendation');if(next.products.some(p=>p.name.toLowerCase()===r.title.toLowerCase()))continue;next.products.push({id:r.id,name:r.title,status:'considering',brand:'',size:'',notes:'Concierge suggestion — not purchased'});}
 return next;
}
