/* ═══ زرُّ الرجوع في أندرويد ═══ المرحلة ٣ من خطّة الهاتف
   كان زرُّ الرجوع يرسل Escape اصطناعياً، فيُغلق أوّلَ ما يلتقطه مستمعُ
   المستند (اللوحة المنسدلة مثلاً) **قبل** الأداة الجارية، وإلغاءُ الأداة
   نفسُه لا يُعَدّ «معالَجاً» فيظهر «اضغط مرّةً أخرى للخروج» بعد كلّ
   إلغاء. الترتيبُ الآن صريحٌ وواحد:
     ١) الأداةُ الجارية تُلغى
     ٢) ما هو مفتوحٌ يُغلَق: قائمة «المزيد» · المساعد · ثمّ كلُّ ما يُغلقه
        Escape (القوائم · اللوحات · لوحة الأوامر · السجلّ)
     ٣) التحديدُ يُفرَّغ
     ٤) وإلّا: لا شيء — والمنصّةُ تطلب ضغطةً ثانيةً للخروج.
   backStep تُعيد اسمَ ما فعلته أو null. */
import * as R from "../tools/registry.js";
import {HOOK} from "./bus.js";
import {selList,setSel,draw} from "./canvas.js";
import {moreTabsOpen,toggleMoreTabs} from "./ribbon/render.js";

export function backStep(){
 /* قشرةُ الهاتف تُغلق ورقتَها أوّلاً (الأعلى مكاناً) */
 try{if(HOOK.shellBack&&HOOK.shellBack())return "shell"}catch(_){}
 if(R.active()){R.cancel(); HOOK.prompt(); return "tool"}
 if(moreTabsOpen()){toggleMoreTabs(false); return "more"}
 const hb=document.querySelector(".helpbot:not([hidden]) .hb-close");
 if(hb){hb.click(); return "help"}
 /* ما يُغلقه Escape: مستمعوه يعلنون المعالجةَ بـpreventDefault */
 try{
  const A=document.activeElement;
  if(A&&A.blur&&/input|textarea|select/i.test(A.tagName||""))A.blur();
  const had=selList().length;
  const ev=new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true});
  if(!document.dispatchEvent(ev))return "esc";
  /* Escape العامُّ يفرّغ التحديدَ بلا preventDefault: يُقاس أثرُه */
  if(had&&!selList().length){HOOK.prompt(); draw(); return "sel"}
 }catch(_){}
 if(selList().length){setSel([],null); HOOK.prompt(); draw(); return "sel"}
 return null;
}
