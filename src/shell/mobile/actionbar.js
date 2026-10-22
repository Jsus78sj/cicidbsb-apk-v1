/* ═══ الشريطُ السفليّ الواحد ═══ المرحلة B
   محتواه تابعٌ للحالة فقط (لا تُضاف أشرطة):
     idle : خمس فئات — رسم · تعديل · إضافة · تأشير · المزيد
     tool : أزرار الأداة نفسُها (barFor من touchbar.js، لا نسخةٌ ثانية)
     sel  : أفعال التحديد نفسُها (SEL_ACTS من touchbar.js)
   والفئاتُ الخمسُ هنا أسماءٌ فقط؛ محتواها (٨ أدوات لكلٍّ) يأتي في
   المرحلة C من كتالوجٍ يشير إلى registry.js.

   ويبقى touchbar.js مصدرَ الأزرار: هذا الملفّ يختار ما يُعرَض لا كيف
   يُنفَّذ، فالتنفيذُ (runTouch) واحدٌ على الحاسوب والهاتف. */
import {barFor,selFor} from "../../ui/touchbar.js";

export const IDLE_CATS=Object.freeze([
 {k:"cat:draw",n:"رسم"},
 {k:"cat:edit",n:"تعديل"},
 {k:"cat:add", n:"إضافة"},
 {k:"cat:ann", n:"تأشير"},
 {k:"cat:more",n:"المزيد"}
]);

/* ما يُعرَض في الشريط السفليّ لكلّ حالة — مصفوفةٌ من {k,n,g?} */
export function itemsFor(state,{def=null,step=null,nSel=0}={}){
 if(state==="idle")return IDLE_CATS.slice();
 if(state==="tool")return barFor(def,step);
 if(state==="sel")return selFor(nSel);
 return [];   /* الورقةُ تملك منطقتَها: لا أزرارَ شريطٍ تحتها */
}
