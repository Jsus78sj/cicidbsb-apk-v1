import {defTool,H,ov,ovLen,rec} from './registry.js';
import {commitQuickOpening} from '../core/quick-opening.js';
const KINDS=[['door','باب'],['double','باب مزدوج'],['sliding','باب سحب'],['window','شباك'],['fixed','شباك ثابت']];
defTool({
 id:'quickopening',alias:'qo فتحة_سريعة',label:'فتحة سريعة',
 hint:'انقر على جدار مستقيم · اكتب الموضع من بدايته',
 opts:[
  {k:'kind',label:'النوع',type:'sel',seg:1,items:KINDS,def:'door'},
  {k:'w',label:'العرض م',type:'len',def:'0.90'},
  {k:'h',label:'الارتفاع م',type:'len',def:'2.10'},
  {k:'sill',label:'الجلسة م',type:'len',def:'0'}
 ],
 steps:[
  {p:'الجدار',ent:'wall',entName:'جدار'},
  {p:'الموضع من بداية الجدار',text:1,each(ctx,value){
    const s=Number(value);
    if(!Number.isFinite(s))throw new Error('الموضع غير صالح');
    const wall=ctx.v.ent;
    const result=commitQuickOpening(wall,s,{kind:ov('quickopening','kind')||'door',width:ovLen('quickopening','w'),height:ovLen('quickopening','h'),sill:ovLen('quickopening','sill'),label:'فتحة سريعة'});
    rec(ctx,result.opening,'opens');
    H.rep('ok',`فتحة سريعة · ${result.opening.id}`);
  }}]
});
