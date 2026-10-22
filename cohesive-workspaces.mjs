import {worlds,weeklySalon,experienceProgress} from './art-of-living.mjs';
import {linkedWorkspace,workspaceGraph} from './workspace-connections.mjs';
const live=rs=>rs.filter(r=>!r.deletedAt);
export function connectedWorkspace(records,route,date){
 const rs=live(records),byType=t=>rs.filter(r=>r.type===t),all=workspaceGraph(rs);
 if(route==='social'){const plans=rs.filter(r=>['experience','experiencePlan','event'].includes(r.type));return {route,summary:weeklySalon(rs,date),worlds:experienceProgress(plans,date.slice(0,7)),ideas:worlds,records:plans,links:all};}
 if(route==='academy'){const lessons=byType('lesson'),courses=byType('course'),assignments=byType('assignment'),exams=byType('exam'),study=byType('study');return {route,courses,lessons,assignments,exams,study,due:[...assignments,...exams].filter(r=>r.date&&r.date<=date&&r.status!=='Done'),links:all};}
 if(route==='studio'){const leads=[...byType('lead'),...byType('client')],proposals=byType('proposal'),invoices=byType('invoice');return {route,leads,proposals,invoices,openProposals:proposals.filter(r=>r.status!=='Done'),links:all};}
 if(route==='career'){const applications=byType('application'),shifts=byType('shift'),earnings=byType('earnings');return {route,applications,shifts,earnings,upcoming:shifts.filter(r=>r.date>=date),links:all};}
 return {route,records:rs,links:all};
}
export function recordConnections(records,id){return linkedWorkspace(records,id);}
