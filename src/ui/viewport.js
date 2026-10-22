/* ═══ viewport.js — ثبات الواجهة على الهاتف ═══
   1) ResizeObserver على #stage: لوحة الرسم تتبع حجم حاويتها مهما كان سبب
      تغيّره (فتح/إغلاق عمود، طيّ الشريط، لوحة المفاتيح) لا حدث النافذة وحده
      — كان هذا يترك مساحةً سوداء بجوار الرسم.
   2) «موقع سطح المكتب» على الهاتف: المتصفّح يمنح الصفحة ~980px فلا تعمل
      قواعد max-width:768. نضع الفئة dsk-on-phone على <html> لتتولّاها CSS. */
import {resize} from "./canvas.js";
import {keepObserver} from "../core/delegate.js";

/* المرحلة E: كان الشرطُ innerWidth>768 وحده، فالهاتفُ **الأفقيّ** (860×412)
   يُعامَل «موقعَ سطح مكتب» فيظهر #tools القديم بالتفاف (271 بكسلاً) ويصير
   اللوحُ صفراً. «موقعُ سطح المكتب» معناه أن الصفحةَ أعرضُ من الشاشة نفسها
   (~980 على شاشةٍ 412)، لا أن الشاشةَ عريضة. */
export function isDesktopSiteOnPhone(w=innerWidth,h=innerHeight,sc=screen,coarse=matchMedia("(pointer:coarse)").matches){
 const lo=Math.min(sc.width||9999,sc.height||9999), hi=Math.max(sc.width||0,sc.height||0)||lo;
 const cur=(h>=w)?lo:hi;           /* عرضُ الشاشة في اتجاهها الحاليّ */
 return !!coarse&&lo<=600&&w>768&&w>cur*1.15;
}
function sync(){
 document.documentElement.classList.toggle("dsk-on-phone",isDesktopSiteOnPhone());
}
/* المرحلة E: المسافةُ من أسفل اللوح إلى أسفل الشاشة (سطرُ الأوامر والسجلّ
   والحالة والشريط السفليّ) — تقرؤها العائماتُ على الهاتف (--stageBot في
   touch.css) فتبقى فوق اللوح ولا تركب سطرَ الأوامر مهما تغيّر ارتفاعُه. */
function stageBot(){
 const st=document.getElementById("stage");
 if(!st||!st.getBoundingClientRect)return;
 const h=(window.innerHeight||0)-st.getBoundingClientRect().bottom;
 try{document.documentElement.style.setProperty("--stageBot",Math.max(0,Math.round(h))+"px")}catch(e){}
}
/* المرحلة E · الهاتفُ الأفقيّ: ألواحُ الشريط تطفو (touch.css) — تظهر عند لمس
   تبويب، وتختفي بعد اختيار أمرٍ منها أو لمسِ أيّ شيءٍ خارج الشريط. فئةٌ لا
   تفضيل: لا تُحفَظ، ولا أثرَ لها خارج media query الأفقيّ القصير. */
const SHORT="(max-height:500px) and (orientation:landscape) and (pointer:coarse)";
export function peekFor(t){
 if(!t||!t.closest)return null;
 if(t.closest(".rbTab"))return true;
 if(t.closest("#rbPanes [data-cmd],#rbPanes [data-act],#rbPanes [data-tool]"))return false;
 if(t.closest("#ribbon"))return null;          /* داخل الشريط: لا تغيير */
 return false;
}
function wirePeek(){
 if(typeof document==="undefined"||!document.addEventListener)return;
 document.addEventListener("click",e=>{
  if(!matchMedia(SHORT).matches)return;
  const v=peekFor(e.target);
  if(v===null)return;
  /* بعد معالج الشريط: لمسُ أداةٍ يُفعِّلها ثم تُطوى الألواح */
  setTimeout(()=>document.documentElement.classList.toggle("rbPeek",v),0);
 },true);
}
export function initViewport(){
 sync(); stageBot(); wirePeek();
 addEventListener("resize",()=>{sync(); stageBot()});
 addEventListener("orientationchange",()=>setTimeout(()=>{sync();resize()},200));
 const st=document.getElementById("stage");
 if(st&&typeof ResizeObserver!=="undefined"){
  let raf=0;
  keepObserver("stage",new ResizeObserver(()=>{        /* P2-013 */
   if(raf)return;
   raf=requestAnimationFrame(()=>{raf=0; resize(); stageBot()});
  })).observe(st);
 }
 if(window.visualViewport)
  visualViewport.addEventListener("resize",()=>resize());
}
