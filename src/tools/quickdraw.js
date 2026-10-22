import {defTool,H,ov,ovLen,rec} from './registry.js';
import {commitQuickRectangle} from '../core/quick-draw-transaction.js';
const TYPES=[['ext','خارجي'],['int','داخلي'],['low','سترة']];
const ALIGNS=[['c','محوري'],['l','الوجه الأيسر'],['r','الوجه الأيمن']];
defTool({
 id:'quickrect',alias:'qr مستطيل_سريع',label:'مستطيل سريع',
 hint:'ركنان متقابلان · المقاس بالمليمتر أو بالمتر في سطر الإدخال',
 opts:[
  {k:'t',label:'السماكة م',type:'len',def:'0.20'},
  {k:'type',label:'النوع',type:'sel',seg:1,items:TYPES,def:'ext'},
  {k:'align',label:'القياس',type:'sel',items:ALIGNS,def:'c'}
 ],
 steps:[
  {p:'الركن الأول'},
  {p:'الركن المقابل',base:0,box:1,restart:1,each(ctx,p){
   const result=commitQuickRectangle(ctx.pts[0],p,{thickness:ovLen('quickrect','t'),type:ov('quickrect','type')||'ext',align:ov('quickrect','align')||'c',label:'مستطيل سريع'});
   result.created.forEach(w=>rec(ctx,w,'walls'));
   H.rep('ok',`مستطيل سريع · ${result.created.length} جدران · Esc للخروج`);
  }}]
});
