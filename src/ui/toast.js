/* ═══ التنبيهُ العابر ═══ المرحلة ٨ من خطّة الهاتف
   السجلُّ على الهاتف سطران دائمان يأكلان من اللوح ٤٦ بكسلاً ولا يُقرأ
   منهما إلّا الأخير. فصار مخفيّاً في قشرة الهاتف (mobile.css)، وكلُّ رسالةٍ
   تظهر تنبيهاً أعلى اللوح لثانيتين ونصف (والخطأُ أربعاً) ثم تختفي.
   ولمسةُ التنبيه تفتح السجلَّ كاملاً (html.logOpen) ولمسةٌ ثانيةٌ تطويه.
   السجلُّ نفسُه يبقى المصدرَ ولقارئ الشاشة (aria-live)، والتنبيهُ نسخةٌ
   مرئيّةٌ مخفيّةٌ عنه فلا يُقرأ مرّتين. على الحاسوب لا شيء يتغيّر. */
const MS={er:4000,wr:3200};
let el=null, tm=null;
/* المرحلة F: «هل هذا هاتف؟» سؤالٌ للقشرة لا لعرض الشاشة (src/shell/select.js).
   قشرةُ الهاتف تكتب html[data-shell-active="mobile"] وتنسّق #toast في
   mobile.css؛ والهاتفُ بالواجهة المكتبية يرى السجلَّ كاملاً كالحاسوب. */
export const toastOn=()=>{
 try{const d=typeof document!=="undefined"&&document.documentElement;
  return !!(d&&d.dataset&&d.dataset.shellActive==="mobile")}
 catch(_){return false}
};
function node(){
 if(el)return el;
 if(typeof document==="undefined"||!document.createElement||!document.body)return null;
 el=document.createElement("div");
 el.id="toast"; el.setAttribute("aria-hidden","true"); el.hidden=true;
 el.addEventListener("click",()=>{
  const r=document.documentElement;
  r.classList.toggle("logOpen");
  hideToast();
 });
 document.body.appendChild(el);
 return el;
}
export function hideToast(){
 if(tm){clearTimeout(tm); tm=null}
 if(el)el.hidden=true;
}
export function toast(cls,msg){
 if(!toastOn())return false;
 const t=String(msg==null?"":msg).trim();
 if(!t)return false;
 const n=node(); if(!n)return false;
 n.className="t-"+(cls||"in");
 n.textContent=t;
 n.hidden=false;
 if(tm)clearTimeout(tm);
 tm=setTimeout(hideToast,MS[cls]||2500);
 return true;
}
