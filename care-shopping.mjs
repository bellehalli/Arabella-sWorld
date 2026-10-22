// Advisory only: no payments, no purchasing, no invented prices.
export function shoppingQueue({products=[],routines=[],budgetCents=0}={}){
 if(!Number.isSafeInteger(budgetCents)||budgetCents<0)throw Error('Invalid budget');
 const uses=new Map();
 for(const r of routines)for(const s of r.steps||[])if(s.productId)uses.set(s.productId,(uses.get(s.productId)||0)+1);
 const rank={need:0,considering:1,wishlist:2,'not-for-me':3,owned:4};
 return products.filter(p=>p.status!=='owned'&&p.status!=='not-for-me').map(p=>({
 id:p.id,name:p.name,status:p.status,routineUses:uses.get(p.id)||0,
 priceCents:Number.isSafeInteger(p.priceCents)&&p.priceCents>=0?p.priceCents:null,
 canBudget:Number.isSafeInteger(p.priceCents)&&p.priceCents>=0?p.priceCents<=budgetCents:null,
 approved:false
 })).sort((a,b)=>rank[a.status]-rank[b.status]||b.routineUses-a.routineUses);
}
export function shoppingTotals(queue){const priced=queue.filter(x=>x.priceCents!==null);return {knownCents:priced.reduce((n,x)=>n+x.priceCents,0),unpricedCount:queue.length-priced.length,notCharged:true};}
