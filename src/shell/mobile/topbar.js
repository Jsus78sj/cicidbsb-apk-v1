/* ═══ الشريطُ العلويّ ═══ المرحلة B · المرحلة C: ↶ ↷ تُعطَّلان حين لا شيء
   ٤٨ بكسلاً، ومحتواه تابعٌ للحالة:
     idle : ☰ · اسم المشروع · ↶ ↷ · 🔍
     tool : اسم الأداة + تلميحُ الخطوة (لا أزرارَ ترويسة أثناء الرسم)
     sel  : عدد المحدَّد
     sheet: مُخفى (الورقةُ تغطّيه — انظر machine.js)
   الأزرار تنادي المسارَ نفسَه الذي تناديه أزرارُ الحاسوب (actions.js)،
   فلا سلوكَ ثانٍ. هنا اختيارُ المحتوى فقط. */

export function topFor(state,{name="CivilDraft",toolName="",hint="",nSel=0,undoOff=false,redoOff=false,armed=null}={}){
 if(state==="sheet")return null;
 /* تسلّح (المرحلة C): أداةُ تعديلٍ تنتظر التحديد. ✓ معطّلٌ حتى يُحدَّد شيء */
 if(armed&&(state==="idle"||state==="sel"))return [
  {k:"title",n:armed},
  {k:"hint", n:nSel>0?"محدَّد: "+nSel+" · ✓ للتنفيذ":"انقر العناصر ثم ✓"},
  {k:"armGo",g:"✓",n:"نفّذ",off:!(nSel>0)},
  {k:"armX", g:"✕",n:"إلغاء"}
 ];
 if(state==="tool")return [
  {k:"title",n:toolName||name},
  {k:"hint", n:hint}
 ];
 if(state==="sel")return [
  {k:"count",n:"محدَّد: "+nSel}
 ];
 return [
  {k:"menu",g:"☰",n:"القائمة"},
  {k:"title",n:name},
  {k:"undo",g:"↶",n:"تراجع",off:!!undoOff},
  {k:"redo",g:"↷",n:"إعادة",off:!!redoOff},
  {k:"search",g:"🔍",n:"ابحث"}
 ];
}
