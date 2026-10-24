import {validDate} from './core.mjs';
const startOfWeek=date=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export function evaluateSpendingPolicy(policy,transactions,{candidate=null,date=candidate?.date||new Date().toISOString().slice(0,10)}={}){
 if(!policy||policy.type!=='policy'||policy.data?.category!=='Money'||!Number.isSafeInteger(policy.data.limit)||policy.data.limit<=0||!validDate(date))return null;
 const period=policy.data.period||'Monthly';let start=date;
 if(period==='Weekly')start=startOfWeek(date);else if(period==='Monthly')start=`${date.slice(0,7)}-01`;
 const spendingCategory=policy.data.spendingCategory||'All categories';
 const matches=t=>t&&t.type==='transaction'&&!t.deletedAt&&t.data?.direction==='Expense'&&validDate(t.date)&&t.date>=start&&t.date<=date&&(spendingCategory==='All categories'||t.data.category===spendingCategory);
 const spent=period==='Per purchase'?0:(transactions||[]).filter(t=>t.id!==candidate?.id&&matches(t)).reduce((n,t)=>n+(Number.isSafeInteger(t.data?.amount)?t.data.amount:0),0);
 const amount=candidate&&matches(candidate)?candidate.data.amount:0,projected=spent+amount,limit=policy.data.limit;
 return {policyId:policy.id,title:policy.title,period,start,date,spendingCategory,limit,spent,projected,remaining:Math.max(0,limit-projected),exceeded:projected>limit,atLimit:projected===limit,candidateAmount:amount};
}
