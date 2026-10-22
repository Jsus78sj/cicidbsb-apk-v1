/* ═══ ناقل الأحداث — يكسر الاعتماد الدائري بين القماش واللوحات ═══ */
export const HOOK={
 props:()=>{}, refresh:()=>{}, status:()=>{},
 report:()=>{}, prompt:()=>{}, toggles:()=>{}, help:()=>{},
 /* promptSoon: مزامنةُ الواجهة مرّةً لكلّ إطار (المرحلة ٦) — يناديها
    مسارُ الحركة الساخن وحده؛ والافتراضُ هنا فوريّ فلا يتغيّر شيءٌ لمن
    لم يوصِلها (الاختبارات) */
 promptSoon:()=>HOOK.prompt(),
 defs:()=>{}, ws:()=>{}, ctx:()=>false,
 layCtl:()=>{}, ctxPanel:()=>{},
 clean:()=>{},         /* مالكه wire.setClean — والإرساء يطلبه */
 /* قشرة الهاتف (المرحلة B): shell يُنادى بعد كلّ مزامنة، وshellBack
    يُستشار أوّلاً عند الرجوع (يُعيد true إن أغلق شيئاً). المكتبيةُ لا
    توصلهما فيبقيان بلا أثر. */
 shell:()=>{}, shellBack:()=>false,
 /* المرحلة D: revealSec يستشيره أوّلاً — قشرةُ الهاتف تفتح القسمَ ورقةً
    وتُعيد true. quiet: زرُّ وكالةٍ سيُنقَر في مكانه، فلا كشف. */
 shellPanel:()=>false
};

/* ═══ وعدٌ لا يسقط صامتاً ═══ P2-007
   كانت أربعون سلسلةَ `.then()` و`import()` بلا catch نهائيّ، وأكثرُها
   يُنفَّذ من نقرةٍ أو أمرٍ متزامن: فشلُ تحميل الوحدة (شبكةٌ منقطعة ·
   عاملُ خدمةٍ بكاشٍ ناقص · خطأٌ في الوحدة نفسها) كان يصير
   unhandled rejection لا يراه المستخدم — يضغط الزرَّ فلا يحدث شيء.

   `safe(p,label)` تُعلّق مصيدةً واحدةً تُبلِّغ بـHOOK.report وتُعيد
   null، فمن ينتظر النتيجة يفحصها. و`lazy(fn,label)` تغليفٌ لاستيرادٍ
   كسولٍ يُنادى من مسارٍ متزامن: `void` صريحٌ فلا ينتظره أحد.
   والرسالةُ تذكر ما كان يُفعَل — «بوابة التسليم» لا «TypeError». */
const msgOf=e=>{
 const m=(e&&e.message)?String(e.message):String(e||"خطأ");
 return m.length>140?m.slice(0,140)+"…":m;
};
export function safe(p,label){
 return Promise.resolve(p).catch(e=>{
  HOOK.report("er",(label?label+": ":"")+msgOf(e));
  return null;
 });
}
export const lazy=(fn,label)=>{
 let p;
 try{p=fn()}catch(e){p=Promise.reject(e)}
 void safe(p,label);
};
