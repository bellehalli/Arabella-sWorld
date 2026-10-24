import {record,validDate} from './core.mjs';

const nonnegative=x=>Number.isSafeInteger(x)&&x>=0;
export function shiftDurationMinutes(shift){
 const start=minutes(shift?.data?.start),end=minutes(shift?.data?.end),pause=Number(shift?.data?.breakMinutes)||0;
 if(start===null||end===null||!Number.isInteger(pause)||pause<0||pause>720)throw Error('Enter valid shift times and break minutes.');
 const duration=(end<=start?end+1440:end)-start-pause;
 if(duration<=0||duration>960)throw Error('A shift must contain 1–960 minutes after breaks.');
 return duration;
}
function minutes(value){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value||'')))return null;const [h,m]=value.split(':').map(Number);return h*60+m;}

export function expectedShiftEarnings(shift){
 const minutesWorked=shiftDurationMinutes(shift),rate=Number(shift?.data?.hourlyRateCents)||0;
 if(!nonnegative(rate))throw Error('Enter a valid hourly wage in cents.');
 return {minutesWorked,expectedWagesCents:Math.round(minutesWorked*rate/60),tipsEstimated:false};
}

export function validateActualPay(input){
 const fields=['wagesCents','cashTipsCents','cardTipsCents','tipOutCents','withheldCents'];
 if(fields.some(k=>!nonnegative(input?.[k])))throw Error('Pay components must be nonnegative whole cents.');
 const gross=input.wagesCents+input.cashTipsCents+input.cardTipsCents;
 const netByComponents=gross-input.tipOutCents-input.withheldCents;
 if(!Number.isSafeInteger(gross)||netByComponents<0)throw Error('Tip-out and withholding cannot exceed the entered gross pay.');
 const netPaidCents=input.netPaidCents==null?null:input.netPaidCents;
 if(netPaidCents!==null&&!nonnegative(netPaidCents))throw Error('Net pay must be nonnegative whole cents.');
 if(input.payoutStatus==='Received'&&netPaidCents===null)throw Error('Enter the net amount that actually reached your account before marking pay received.');
 if(input.payoutStatus==='Expected'&&netPaidCents!==null)throw Error('Expected pay cannot include an amount received; leave net pay blank until it arrives.')
 if(!['Expected','Received'].includes(input.payoutStatus))throw Error('Choose expected or received payout status.');
 return {grossCents:gross,netByComponentsCents:netByComponents,netPaidCents};
}

export function createPayRecords({shift,payrollId='',payPeriod='',paidDate='',...input},records=[]) {
 if(!shift||shift.type!=='shift'||shift.deletedAt)throw Error('Choose a saved shift.');
 if(records.some(r=>r.type==='earnings'&&!r.deletedAt&&(r.data?.payrollId===payrollId&&payrollId||r.data?.shiftId===shift.id)))throw Error('This shift or payroll item already has an earnings record.');
 const totals=validateActualPay(input),date=input.payoutStatus==='Received'?(paidDate||shift.date):shift.date;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Choose a valid pay date.');
 const earningsRecord=record('earnings',{title:`Pay · ${shift.title}`,date,sensitive:true,tags:['Work','Payroll'],links:[shift.id],data:{workflowVersion:1,shiftId:shift.id,payrollId:String(payrollId||''),payPeriodId:String(payPeriod||''),wagesCents:input.wagesCents,cashTipsCents:input.cashTipsCents,cardTipsCents:input.cardTipsCents,tipOutCents:input.tipOutCents,withheldCents:input.withheldCents,netPaidCents:totals.netPaidCents,payoutStatus:input.payoutStatus,paidAt:input.payoutStatus==='Received'?date:'',grossCents:totals.grossCents,expectedNetCents:totals.netByComponentsCents}});
 const transaction=input.payoutStatus!=='Received'?null:record('transaction',{title:`Pay received · ${shift.title}`,date,sensitive:true,tags:['Employment income','Payroll'],links:[shift.id,earningsRecord.id],data:{amount:totals.netPaidCents,direction:'Income',scope:'Personal',category:'Paycheck',payrollId:String(payrollId||earningsRecord.id),earningsId:earningsRecord.id}});
 return {earningsRecord,transaction,totals};
}

export function payrollSummary(records,{from='0000-01-01',to='9999-12-31'}={}){
 const items=records.filter(r=>!r.deletedAt&&r.type==='earnings'&&r.date>=from&&r.date<=to);
 return {receivedCents:items.filter(x=>x.data.payoutStatus==='Received').reduce((n,x)=>n+(x.data.netPaidCents||0),0),expectedCents:items.filter(x=>x.data.payoutStatus==='Expected').reduce((n,x)=>n+(x.data.netPaidCents||x.data.expectedNetCents||0),0),unverifiedCount:items.filter(x=>x.data.payoutStatus==='Unverified').length,items};
}
