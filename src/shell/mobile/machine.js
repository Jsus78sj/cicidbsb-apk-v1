/* ═══ آلةُ الحالات · قشرة الهاتف ═══ المرحلة B من خطّة الهاتف
   حالةٌ واحدةٌ في كلّ وقت، وتُستنتَج من حقائقَ ثلاث لا من أعلام يدويّة:
     sheet : ورقةٌ سفليّةٌ مفتوحة
     tool  : أداةٌ نشطة (الرسم)
     sel   : عدد المحدَّد
   الأولويّة: ورقة ▸ أداة ▸ تحديد ▸ خامل. فالورقةُ فوق كلّ شيء (طبقةٌ
   مؤقّتةٌ تُغلَق بالسحب أو بالرجوع)، والأداةُ تغلب التحديد لأن التحديدَ
   أثناءَ الرسم يُلغى بالإنهاء.

   القاعدةُ الحاكمة: **سطحٌ سفليٌّ واحدٌ فقط ظاهر** = bottomOf(state).
   والعلويّ يُخفى في حالة الورقة وحدها (الورقةُ تغطّيه).

   دالّةٌ خالصة بلا DOM: يقرؤها paint() في chrome.js ويحرسها tests/mobile-shell.test.js. */

export const STATES=Object.freeze(["idle","tool","sel","sheet"]);

export function stateOf({sheet=false,tool=false,sel=0}={}){
 if(sheet)return "sheet";
 if(tool)return "tool";
 if(sel>0)return "sel";
 return "idle";
}

/* السطحُ السفليّ الظاهر في كلّ حالة: واحدٌ دائماً، ومعرّفُه هو الحالة */
export const bottomOf=state=>state;

/* الترويسةُ تُخفى تحت الورقة فقط */
export const topVisible=state=>state!=="sheet";

/* الخطّة كاملةً لحالةٍ: ما يظهر وما يُخفى (تُقرأ مرّةً لكلّ بناء) */
export function planOf(state){
 if(!STATES.includes(state))throw new Error("حالةٌ غير معروفة: "+state);
 return {state, top:topVisible(state), bottom:bottomOf(state)};
}

/* زرّ الرجوع: الأعلى مكاناً يُغلَق أوّلاً (الورقة ▸ الأداة ▸ التسلّح ▸ التحديد)
   التسلّحُ (المرحلة C): أداةُ تعديلٍ اختيرت بلا تحديدٍ تنتظر العناصر.
   الرجوعُ يُلغيها ويُبقي ما حُدِّد، فلا يضيع تحديدٌ بلمسةٍ واحدة. */
export function onBack({sheet=false,tool=false,sel=0,armed=false}={}){
 if(sheet)return "closeSheet";
 if(tool)return "cancelTool";
 if(armed)return "disarm";
 if(sel>0)return "clearSel";
 return "none";
}
