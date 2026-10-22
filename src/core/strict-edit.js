/* ═══ معاملةٌ لا تبتلع فشلَها ═══ المرحلة ٩ من خطّة الهاتف
   edit() في state.js ترجع كلَّ شيءٍ عند الخطأ وتُبلِغ ONERR ثم **تعيد
   undefined بلا رمي** — صحيحٌ لمن يعرض الخطأ ويمضي، وخطِرٌ لمن يبني على
   الناتج: commitQuickOpening كانت تعيد {opening:undefined} لباب ٦ م في
   جدارٍ ٥ م وتسمّيه نجاحاً. strictEdit تعطي الدلالةَ نفسَها (الرجوعُ كاملٌ
   والإبلاغُ نفسُه) ثم **ترمي الخطأَ الأصليَّ** للمنادي.
   وداخل معاملةٍ خارجية (TXN>0 — أداةٌ تنادي) edit ترمي أصلاً، فلا فرق. */
import {edit} from './state.js';
export function strictEdit(fn,label,opt){
 let err=null;
 const out=edit(()=>{
  try{return fn()}catch(e){err=e; throw e}
 },label,opt);
 if(err)throw err;
 return out;
}
