/* Quick-draw tools register before app.js builds the command palette. */
import "./tools/quickdraw.js";
import "./tools/quickwall.js";
import "./tools/quickopening.js";
import "./tools/quickroom.js";
import "./tools/guidedroom.js";

/* ═══ شاشة الإقلاع ═══
   لا تُقرّر بنفسها متى «اكتمل» الإقلاع — تصغي فقط لحدثٍ يُطلقه
   bootOk() الحقيقي في bootguard.js (انظر التعديل هناك)، وهو نفس
   النداء الذي يُنادى في آخر سطرٍ من boot() داخل app.js. لا مؤقّت
   نجاحٍ موازٍ هنا، ولا تخمينٌ لحالة الإقلاع من مصدرٍ آخر.

   ومهلة الأمان أدناه (١٠ث) لا «تنجح» الإقلاع ولا تُخفي الشعار:
   الإخفاءُ هو ما يُنتج الشاشةَ البيضاء الصامتة، وهي أخطر حالةٍ في
   برنامجٍ يحمل عمل المستخدم. بدلاً من ذلك تُحوّل الشعارَ إلى
   شاشة فشلٍ صريحة، وتُنزله تحت صندوق #bootErr (bootguard.js) كي
   تُقرأ رسالةُ السبب فوقه. وإن وصل bootOk متأخّراً فالمستمعُ نفسه
   يُخفي الشعار كالمعتاد. */

const SAFETY_MS = 10000;
const SLOW_MS   = 45000;
let hidden = false;

function hideSplash(){
 if(hidden)return;
 hidden = true;
 const el = document.getElementById("splash");
 if(!el)return;
 el.classList.add("splash-hide");
 el.setAttribute("aria-hidden", "true");
 const remove = () => el.remove();
 el.addEventListener("transitionend", remove, {once:true});
 setTimeout(remove, 450);
}

function showBootFail(){
 if(hidden)return;
 const el = document.getElementById("splash");
 if(!el)return;
 el.style.zIndex = "9000";
 el.setAttribute("aria-label", "CivilDraft — تعذّر الإقلاع");
 const tag = el.querySelector(".splash-tag");
 if(tag){
  tag.textContent = document.getElementById("bootErr")
   ? "تعذّر الإقلاع — راجع الرسالة أعلى الشاشة"
   : "تعذّر الإقلاع — أعِد تحميل الصفحة (السبب في وحدة التحكّم)";
  tag.style.color = "#ffb3b3";
 }
 const bar = el.querySelector(".splash-bar");
 if(bar)bar.style.display = "none";
 const mark = el.querySelector(".splash-mark");
 if(mark)mark.style.animation = "none";
}

addEventListener("civildraft:bootok", hideSplash, {once:true});
const t0 = Date.now();
function safety(){
 const loading = typeof document !== "undefined"
  && (document.readyState === "loading" || document.readyState === "interactive");
 if(loading && Date.now()-t0 < SLOW_MS){setTimeout(safety, 2000); return}
 showBootFail();
}
setTimeout(safety, SAFETY_MS);
