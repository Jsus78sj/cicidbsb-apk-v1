/* ═══ هيكلُ الهاتف في DOM ═══ المرحلة B
   يبني العناصرَ الخمسة (الترويسة · ثلاثةُ أشرطةٍ سفليّة · الورقة) داخل
   حاوية واحدة، ويُلصِق paint() الحالةَ عليها: يُخفي ما لا يخصّ الحالة
   بالسمة hidden، ويملأ المحتوى من actionbar.js وtopbar.js.

   الحاوية نفسها لا تُضاف للصفحة هنا: المستدعي (mount) يقرّر أين تقع.
   وهذا الملفّ لا يلمس الصفحة القائمة ولا touch.css.

   تصحيحاتُ المراجعة:
   · paint() تُنادى مع كلّ حركة مؤشّر (عبر HOOK.shell من syncPrompt)،
     فكانت تعيد بناءَ innerHTML في كلّ مرّة: تسرق التركيزَ من حقل القياس
     وتُسقِط الضغطةَ الجارية. الآن بصمةٌ لكلّ سطحٍ ولا بناءَ إلّا إن تغيّرت.
   · عناصرُ الترويسة غيرُ الفاعلة (الاسم · التلميح · العدد) كانت أزراراً
     لا تفعل شيئاً: صارت نصّاً، والأزرارُ ما له فعلٌ وحده.
   · «تبنّي» شريط اللمس: إن مُرِّر refs.touchBar (العنصرُ #touchBar الحيّ)
     يُنقَل هو نفسُه إلى شريط الأداة/التحديد بدل رسم نسخةٍ منه، فيبقى
     صفُّ القياس (الطول · الزاوية) وأزرارُ المساعدات ومستمعو touchbar.js
     كما هي حرفاً. ولا يُمسَح شريطٌ يحمله، وإلّا انفصل عن الصفحة فتعمى
     syncTouchBar عنه. */
import {planOf} from "./machine.js";
import {itemsFor} from "./actionbar.js";
import {topFor} from "./topbar.js";
import {buildSheet,setSnap} from "./sheet.js";
import {escapeHtml as esc} from "../../core/escape.js";

const BARS=Object.freeze(["idle","tool","sel"]);
/* عناصرُ الترويسة التي لها فعل؛ الباقي نصٌّ */
const TOP_ACTS=new Set(["menu","undo","redo","search","armGo","armX"]);

export function buildChrome(doc){
 const root=doc.createElement("div");
 root.setAttribute("id","mChrome");
 const top=doc.createElement("header");
 top.setAttribute("id","mTop");
 top.setAttribute("role","toolbar");
 top.setAttribute("aria-label","الشريط العلويّ");
 root.appendChild(top);
 const bars={};
 for(const s of BARS){
  const b=doc.createElement("nav");
  b.setAttribute("id","mBar-"+s);
  b.setAttribute("class","mBar");
  b.setAttribute("role","toolbar");
  b.setAttribute("hidden","");
  root.appendChild(b);
  bars[s]=b;
 }
 const sheet=buildSheet(doc,"ورقة");
 root.appendChild(sheet.el);
 return {root, top, bars, sheet, touchBar:null, sig:{}};
}

const btn=(x,cls)=>`<button type="button" data-k="${esc(x.k)}"`
 +` class="${cls}" aria-label="${esc(x.n)}"${x.off?" disabled":""}>`
 +(x.g?`<b aria-hidden="true">${esc(x.g)}</b>`:"")
 +`<span>${esc(x.n)}</span></button>`;
const txt=x=>`<span class="mTopT mTop-${esc(x.k)}">${esc(x.n)}</span>`;
const topHtml=T=>T.map(x=>TOP_ACTS.has(x.k)?btn(x,"mTopB"):txt(x)).join("");

/* يكتب innerHTML فقط إن تغيّرت البصمة */
function put(refs,key,el,html){
 const sig=refs.sig||(refs.sig={});
 if(sig[key]===html)return false;
 sig[key]=html;
 el.innerHTML=html;
 return true;
}
const show=(el,on)=>{
 if(on){if(el.hasAttribute?el.hasAttribute("hidden"):el.hidden)el.removeAttribute("hidden")}
 else if(!(el.hasAttribute?el.hasAttribute("hidden"):el.hidden))el.setAttribute("hidden","");
};

/* يُلصق الحالةَ: state من machine.stateOf، facts ما تحتاجه المحتويات */
export function paint(refs,state,facts={},sheetSnap="half"){
 const plan=planOf(state);
 const {top,bars,sheet}=refs;
 show(top,plan.top);
 put(refs,"top",top,topHtml(topFor(state,facts)||[]));
 const tb=refs.touchBar;
 for(const s of Object.keys(bars)){
  const b=bars[s];
  const on=s===plan.bottom;
  const adopt=tb&&(s==="tool"||s==="sel");
  if(adopt){
   if(on&&tb.parentElement!==b){
    if(refs.sig)refs.sig["bar:"+s]=null;
    b.innerHTML="";
    b.appendChild(tb);
   }
  }else if(on){
   put(refs,"bar:"+s,b,itemsFor(s,facts).map(x=>btn(x,"mBarB")).join(""));
  }else if(!(tb&&tb.parentElement===b)){
   put(refs,"bar:"+s,b,"");
  }
  show(b,on);
 }
 const want=state==="sheet"?sheetSnap:"closed";
 if(sheet.el.getAttribute("data-snap")!==want||(want==="closed")!==!!sheet.el.hidden)
  setSnap(sheet.el,want);
 return plan;
}

/* عددُ السطوح السفليّة الظاهرة الآن: الأشرطة غيرُ المخفيّة + الورقة */
export function visibleBottom(refs){
 let n=0;
 for(const s of Object.keys(refs.bars))if(!refs.bars[s].hidden)n++;
 if(!refs.sheet.el.hidden)n++;
 return n;
}
