/* ═══ نصوصُ اللمس ═══ المرحلة ١ من خطّة الهاتف
   الرسائلُ كُتبت لمن أمامه لوحةُ مفاتيح: «Ctrl+Z يتراجع عنها» ·
   «احفظ (Ctrl+S)» · «Esc يلغي». على الهاتف هذه أوامرُ لا يملك المستخدمُ
   مفاتيحَها، فتصير ضجيجاً يُعلِّم الخطأ. هنا مُرشِّحٌ واحد تمرّ به
   الرسائل قبل عرضها: على جهازٍ لمسيٍّ بلا فأرة يُبدَّل المفتاحُ بالزرِّ
   الذي يقابله على الشاشة (↶ ↷ ✓ ✕) أو يُحذَف إن لم يكن له مقابل.
   وعلى الحاسوب يعود النصُّ كما هو حرفاً — لا رسالةَ تتغيّر هناك.
   touchText خالصةٌ (الوضعُ وسيطٌ اختياريّ) ومختبَرةٌ في
   touch-shell.test.js. */

/* لمسٌ بلا مؤشّرٍ دقيق: هاتفٌ أو لوحٌ بلا فأرة. لوحٌ موصولٌ بفأرةٍ
   ولوحةِ مفاتيح يحتفظ بالاختصارات لأنّه يملكها فعلاً. */
export function touchOnly(){
 try{
  if(typeof document!=="undefined"&&document.documentElement
     &&document.documentElement.classList
     &&document.documentElement.classList.contains("native"))return true;
  if(typeof matchMedia!=="function")return false;
  const c=matchMedia("(pointer:coarse)"), f=matchMedia("(any-pointer:fine)");
  return !!(c&&c.matches)&&!(f&&f.matches);
 }catch(_){return false}
}

const MOD="(?:Ctrl|Cmd|⌘)";
/* الترتيبُ مقصود: الأطولُ قبل الأقصر (Ctrl+Shift+Z قبل Ctrl+Z) */
const RULES=[
 /* «… (Ctrl+S) احتياطاً» ⇒ «… احتياطاً» : الأقواسُ حولَ اختصارٍ وحدَه */
 [new RegExp(`\\s*[(（]\\s*${MOD}\\+[^)）]*[)）]`,"g"),""],
 /* مفتاحٌ وحدَه بين قوسين بعد تسميةٍ تكفي: «تأكيد (Enter)» · «إغلاق (C)» · «(F7)» */
 [/\s*[(（]\s*(?:Enter|Esc|Escape|F\d{1,2}|[A-Z]{1,3})\s*[)）]/g,""],
 [new RegExp(`${MOD}\\+Shift\\+Z`,"gi"),"↷"],
 [new RegExp(`${MOD}\\+Z\\b`,"gi"),"↶"],
 [new RegExp(`${MOD}\\+Y\\b`,"gi"),"↷"],
 [new RegExp(`${MOD}\\+S\\b`,"gi"),"زرّ الحفظ"],
 /* مقطعٌ بعد فاصلٍ «· Ctrl+Shift+H» يُحذَف بفاصله */
 [new RegExp(`\\s*·\\s*${MOD}(?:\\+[A-Za-z0-9]+)+`,"g"),""],
 /* وما بقي من اختصاراتٍ بلا مقابلٍ لمسيّ يُحذَف */
 [new RegExp(`${MOD}(?:\\+[A-Za-z0-9]+)+\\s*`,"g"),""],
 /* المفتاحان اللذان صار لهما زرّان على الشاشة */
 [/\bEsc\b|\bEscape\b/g,"✕"],
 [/\bEnter\b/g,"✓"],
 /* حرفا الخطوة في تلميحات الأدوات: «C يغلق · U يتراجع» */
 [/\bC(?=\s+يغلق)/g,"⭘"],
 [/\bU(?=\s+يتراجع)/g,"↶"],
 /* أقواسٌ فرغت · فواصلُ تكرّرت أو بقيت في طرف */
 [/[(（]\s*[)）]/g,""],
 [/\s*·\s*(?=·)/g,""],
 [/^\s*·\s*|\s*·\s*$/g,""],
 [/[ \t]{2,}/g," "]
];
export function touchText(s,on){
 const t=String(s==null?"":s);
 if(!(on===undefined?touchOnly():on))return t;
 if(!/Ctrl|Cmd|⌘|Esc|Enter|\b[CU]\s|\(\s*(?:[A-Z]{1,3}|F\d{1,2})\s*\)/i.test(t))return t;
 let r=t;
 for(const [re,to] of RULES)r=r.replace(re,to);
 return r.trim();
}
