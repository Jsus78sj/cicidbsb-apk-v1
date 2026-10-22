/* ═══ أزرارُ الرسم باللمس ═══ المرحلة ١ من خطّة الهاتف
   الأداةُ تُنهى بـEnter وتُلغى بـEsc وتُغلَق بـC — ثلاثتُها تحتاج لوحةَ
   مفاتيحٍ فيزيائية. على الهاتف كان المستخدمُ يرسم جداراً ثم لا يعرف كيف
   يقف، فيفتح لوحةَ المفاتيح الافتراضية لتغطّي نصفَ الرسم.
   هنا شريطٌ صغيرٌ يظهر **أثناء الأداة وحدها** في منطقة الإبهام:
     ✓ إنهاء   = Enter     (يظهر حين تقبله الخطوة: سلسلةٌ أو تأكيد)
     ⭘ إغلاق   = C         (يظهر حين تعرضه الخطوة)
     ↶ تراجع   = U داخل الأداة، وإلا تراجعٌ عامّ
     ✕ إلغاء   = Esc
   والأزرارُ تنادي المسارَ نفسَه الذي تناديه المفاتيح (registry.js) فلا
   سلوكَ ثانٍ ينحرف. والإظهارُ بالتنسيق (touch.css) لا بـhidden: على
   الحاسوب بفأرةٍ لا يُرى شيء.
   syncTouchBar تُنادى مع كلّ حركة مؤشّر (من syncPrompt) فهي تقارن بصمةً
   ولا تبني إلا إن تغيّرت. */
import * as R from "../tools/registry.js";
import {undo} from "../core/state.js";
import {jrAdd,jrTaint} from "../core/journal.js";
import {HOOK} from "./bus.js";
import {draw,V,W2S,panBy,fit,selList,setSel,delSel} from "./canvas.js";
import {delSay} from "../core/ents.js";
import {S,touch,autosave} from "../core/state.js";
import {fieldsOf,composeVals} from "./dyninput.js";
import {lenOf,angOf} from "../core/coords.js";
import {deg} from "../core/units.js";
import {escapeHtml as esc} from "../core/escape.js";
import {haptic} from "../platform/index.js";

const $=s=>document.querySelector(s);

/* ما يظهر الآن — دالّةٌ خالصة على حالة الأداة، مختبَرة */
export function barFor(def,step){
 if(!def)return [];
 const so=(step&&step.opts)||{};
 const L=[];
 if(step&&(step.loop||step.confirm))L.push({k:"ok",g:"✓",n:"إنهاء"});
 if(so.c)L.push({k:"close",g:"⭘",n:(so.c.n||"إغلاق")});
 L.push({k:"undo",g:"↶",n:"تراجع"});
 L.push({k:"aids",g:"⚙",n:"مساعدات"});
 L.push({k:"esc",g:"✕",n:"إلغاء"});
 return L;
}
/* ═══ المرحلة ٢ · حقلا القياس ═══
   على الهاتف لا سطرَ أوامرٍ ظاهراً أثناء الرسم (وضع الرسم · touch.css)،
   فالقياسُ يُكتَب في حقلين فوق الأزرار: **الطول والزاوية** — لا صيغة
   @5<45. والحقلان من fieldsOf نفسِها (dyninput.js) والتركيبُ composeVals
   نفسُها، فالمعنى واحدٌ مع الإدخال الحركيّ وسطر الأوامر.
   ونصُّ الحقل الفارغ (placeholder) هو القيمةُ الحيّة تحت الإصبع، فيرى
   المستخدمُ «٣٫٢٥٠» وهو يسحب ويكتب فوقها إن أراد غيرها.
   وأزرارُ الزوايا الجاهزة تقفل الاتجاه: لمسةٌ على ٩٠ ثم سحبٌ = جدارٌ
   رأسيّ بلا كتابة. */
export const TAP2_WAIT=280;
export const ANGLES=[0,45,90,180,270];
/* المرحلة D · خطوةُ الإطار (box:1 — غرفة سريعة · مستطيل · ورقة …):
   الركنُ المقابلُ ليس امتداداً لخطّ، فالطولُ والزاوية يعطيان قُطراً لا
   غرفةً ٤×٥. بعد الركن الأوّل: **العرض والطول** ⇒ «@ع,ط» (نسبيٌّ من
   الركن، parsePt نفسُه). والحاسوبُ لا يتغيّر: dyninput.js كما هو. */
export const BOX_F=Object.freeze([{k:"w",n:"العرض",u:"م"},{k:"h",n:"الطول",u:"م"}]);
export function composeBox(V){
 const v=i=>String((V&&V[i])==null?"":V[i]).trim();
 const w=v(0), h=v(1);
 if(!w&&!h)return "";
 return `@${w||"0"},${h||"0"}`;
}
export function measureFor(step){
 if(step&&step.box&&!step.ent&&!step.text&&!step.confirm&&!step.ang&&R.baseOf())return BOX_F.slice();
 const F=fieldsOf(step);
 return F&&F.length?F:null;
}
/* ═══ المرحلة ٨ · شريطُ التحديد ═══
   على الهاتف لا Delete ولا M ولا CP: كان الحذفُ والنقلُ مدفونين في قائمة
   الضغط المطوّل. الآن: عنصرٌ محدَّدٌ بلا أداةٍ ⇒ الشريطُ نفسُه في موضعه
   نفسِه يعرض أفعالَ التحديد — نقل · نسخ · تدوير · حذف · خصائص · ✕.
   والأفعالُ هي الأدواتُ نفسُها (move/copy/rotate تبدأ بالتحديد الجاري)
   وdelSel نفسُها التي يناديها Delete — لا مسارَ ثانٍ. */
export const SEL_ACTS=[
 {k:"s:move",  g:"✥",n:"نقل"},
 {k:"s:copy",  g:"⧉",n:"نسخ"},
 {k:"s:rotate",g:"⟳",n:"تدوير"},
 {k:"del",     g:"🗑",n:"حذف"},
 {k:"props",   g:"☰",n:"خصائص"},
 {k:"clear",   g:"✕",n:"إلغاء"}];
export const selFor=n=>n>0?SEL_ACTS.slice():[];
let SIG=null, MF=null;
const mIn=i=>$(`#touchBar [data-tm="${i}"]`);
function rowM(F){
 const hasA=F.some(f=>f.k==="a");
 return `<div class="tbM" role="group" aria-label="القياس">`
  +F.map((f,i)=>`<label class="tbF tbF-${f.k}"><span>${esc(f.n)}</span>`
   +`<input type="text" inputmode="decimal" enterkeyhint="done"`
   +` spellcheck="false" autocomplete="off" data-tm="${i}"`
   +` aria-label="${esc(f.n)} ${esc(f.u)}"><i>${esc(f.u)}</i></label>`).join("")
  +(hasA?`<span class="tbA" role="radiogroup" aria-label="زاوية جاهزة">`
   +ANGLES.map(a=>`<button type="button" data-ta="${a}" role="radio"`
    +` aria-checked="false">${a}°</button>`).join("")+`</span>`:"")
  +(F.some(f=>f.k==="L")?`<button type="button" class="tbLast" data-tb="last" hidden`
   +` aria-label="كرّر آخر طول">↺ <span></span></button>`:"")
  +`<button type="button" class="tbGo" data-tb="apply" aria-label="طبّق القياس">طبّق</button>`
  +`</div>`;
}
export function syncTouchBar(){
 const box=$("#touchBar");
 const on=R.active();
 const nSel=on?0:selList().length;
 const root=document.documentElement;
 if(root&&root.classList){
  if(root.classList.contains("cdDraw")!==on)root.classList.toggle("cdDraw",on);
  const so=nSel>0;
  if(root.classList.contains("cdSel")!==so)root.classList.toggle("cdSel",so);
  /* خطوةُ نصٍّ حرّ (اسم · نصّ) تحتاج سطرَ الأوامر: وضعُ الرسم يُبقيه لها */
  const st=on?R.step():null, tx=!!(st&&st.text);
  if(root.classList.contains("cdText")!==tx)root.classList.toggle("cdText",tx);
  const ms=!!(st&&measureFor(st));
  if(root.classList.contains("cdMeas")!==ms)root.classList.toggle("cdMeas",ms);
 }
 if(!box)return false;
 const st=on?R.step():null;
 const L=on?barFor(R.T.def,st):selFor(nSel);
 const F=on?measureFor(st):null;
 const s=L.map(x=>x.k+":"+x.n).join(",")+"|"+(F?F.map(f=>f.k).join(","):"");
 if(s!==SIG){
  SIG=s; MF=F;
  box.innerHTML=(F?rowM(F):"")
   +`<div class="tbB">`+L.map(x=>`<button type="button" data-tb="${x.k}"`
    +` class="tb-${x.k}" aria-label="${x.n}">`
    +`<b aria-hidden="true">${x.g}</b><span>${x.n}</span></button>`).join("")
   +`</div>`;
  if(!L.length){aidsOpen=false; LASTLEN=null}
  else if(aidsOpen)setAids(true);
 }
 liveFill();
 return true;
}
/* ═══ المرحلة ٧ · «آخرُ طول» ═══ الجدرانُ تتكرّر: غرفةٌ ٤×٤ أربعةُ أطوالٍ
   متساوية. آخرُ قطعةٍ وُضعت في الأداة الجارية تصير زرّاً «↺ ٤٫٠٠٠» في صفّ
   القياس، ولمستُه تضع القطعةَ التالية بالطول نفسِه على الاتجاه الجاري. */
let LASTLEN=null;
export const lastLen=()=>LASTLEN;
function trackLast(){
 const ctx=R.T.ctx, P=ctx&&ctx.pts;
 if(!P||P.length<2)return;
 const a=P[P.length-2], b=P[P.length-1];
 const L=Math.round(lenOf(a,b));
 if(L>=50)LASTLEN=L;
}
/* القيمةُ الحيّة في نصّ الحقل الفارغ · وإبرازُ الزاوية المقفلة */
function liveFill(){
 trackLast();
 const lb=$("#touchBar .tbLast");
 if(lb){
  const show=LASTLEN!=null&&!!R.baseOf();
  if(lb.hidden===show)lb.hidden=!show;
  const t=show?(LASTLEN/1000).toFixed(3):"";
  const sp=lb.querySelector("span");
  if(sp&&sp.textContent!==t)sp.textContent=t;
 }
 if(!MF)return;
 const b=R.baseOf(), g=R.T.ghost;
 MF.forEach((f,i)=>{
  const el=mIn(i); if(!el)return;
  let v="";
  if(g){
   if(f.k==="L")v=b?(lenOf(b,g)/1000).toFixed(3):"";
   else if(f.k==="a")v=b?angOf(b,g).toFixed(1):"";
   else if(f.k==="x")v=(g[0]/1000).toFixed(3);
   else if(f.k==="y")v=(g[1]/1000).toFixed(3);
   else if(f.k==="w")v=b?((g[0]-b[0])/1000).toFixed(3):"";
   else if(f.k==="h")v=b?((g[1]-b[1])/1000).toFixed(3):"";
  }
  if(el.placeholder!==v)el.placeholder=v;
 });
 const lk=R.T.lock;
 document.querySelectorAll("#touchBar [data-ta]").forEach(x=>{
  const on=lk!=null&&+x.dataset.ta===+lk;
  if(x.getAttribute("aria-checked")!==String(on))x.setAttribute("aria-checked",String(on));
 });
}
/* ═══ المرحلة ٥ · مساعداتُ الرسم ═══
   وضعُ الرسم (المرحلة ٢) يُخفي شريطَ الحالة والتنقّل، ومعهما مفاتيحُ
   الالتقاط والتعامد والشبكة وزرُّ الملاءمة — وعلى الهاتف لا F3 ولا F8.
   فصارت هنا: زرُّ ⚙ يفتح لوحةً صغيرةً فوق الأزرار، كلُّ مفتاحٍ فيها
   يبدّل S.rb بالمسار نفسِه الذي يسلكه شريطُ الحالة (HOOK.rbToggle ⇐
   keymap.rbToggle)، والملاءمةُ هي fit() نفسُها. */
export const AIDS=[
 {k:"snap",n:"التقاط"},{k:"ortho",n:"تعامد"},{k:"polar",n:"قطبيّ"},
 {k:"grid",n:"شبكة"},{k:"gsnap",n:"خطوة الشبكة"}];
let aidsOpen=false;
export const aidsIsOpen=()=>aidsOpen;
function aidsHtml(){
 return `<div class="tbPop" role="group" aria-label="مساعدات الرسم">`
  +AIDS.map(a=>`<button type="button" data-tg="${a.k}" aria-pressed="${!!+S.rb[a.k]}">`
   +`${esc(a.n)}</button>`).join("")
  +`<button type="button" data-tb="fit" class="tbFit">ملاءمة العرض</button></div>`;
}
export function toggleAid(k){
 if(!AIDS.some(a=>a.k===k))return null;
 if(typeof HOOK.rbToggle==="function")HOOK.rbToggle(k);
 else{
  S.rb[k]=S.rb[k]?0:1;
  if(k==="ortho"&&S.rb.ortho)S.rb.polar=0;
  if(k==="polar"&&S.rb.polar)S.rb.ortho=0;
  touch(); autosave(); HOOK.toggles(); draw();
 }
 syncAids();
 return !!+S.rb[k];
}
function syncAids(){
 document.querySelectorAll("#touchBar [data-tg]").forEach(b=>{
  const on=String(!!+S.rb[b.dataset.tg]);
  if(b.getAttribute("aria-pressed")!==on)b.setAttribute("aria-pressed",on);
 });
}
export function setAids(on){
 const box=$("#touchBar"); if(!box)return false;
 aidsOpen=!!on;
 let pop=box.querySelector(".tbPop");
 if(aidsOpen&&!pop){box.insertAdjacentHTML("afterbegin",aidsHtml()); pop=box.querySelector(".tbPop")}
 if(!aidsOpen&&pop)pop.remove();
 const b=box.querySelector(".tb-aids");
 if(b)b.setAttribute("aria-expanded",String(aidsOpen));
 return aidsOpen;
}
export const resetTouchBar=()=>{SIG=null; MF=null; aidsOpen=false};
/* تطبيقُ الحقلين: التركيبُ ثم المسارُ نفسُه الذي يسلكه سطرُ الأوامر */
export function applyMeasure(vals){
 /* الحقولُ من الخطوة **الجارية** لا من آخر بناء: كانت MF تُقرأ وحدها،
    فإن تقدّمت الخطوة قبل المزامنة (س،ص ← طول،زاوية) رُكِّب «5,90» نقطةً
    مطلقة بدل «@5<90» — جدارٌ بطول ٩٠ م. (كشفه phone-e2e · المرحلة ٤) */
 if(!R.active())return false;
 /* قيَمٌ ممرَّرة ⇒ حقولُ الخطوة الآن · قيَمٌ من الحقول المرسومة ⇒ الحقولُ
    التي رآها المستخدمُ وكتب فيها (MF) — المعنى ما قصده لا ما صار */
 const F=vals?measureFor(R.step()):(MF||measureFor(R.step()));
 if(!F)return false;
 const V0=vals||F.map((_,i)=>{const el=mIn(i); return el?el.value:""});
 const s=F[0].k==="w"?composeBox(V0):composeVals(F,V0);
 if(!s)return false;
 R.lockLen(null); R.T.lock=null;
 jrAdd(s);
 R.feedText(s);
 F.forEach((_,i)=>{const el=mIn(i); if(el)el.value=""});
 HOOK.prompt(); draw();
 return s;
}
export function pickAngle(a){
 if(!R.active())return false;
 const cur=R.T.lock;
 /* لمسةٌ ثانيةٌ على الزاوية المقفلة نفسِها تفكّ القفل */
 if(cur!=null&&+cur===deg(+a)){R.lockAng(null); return null}
 R.lockAng(deg(+a));
 const F=MF||[];
 const i=F.findIndex(f=>f.k==="a");
 const el=i>=0?mIn(i):null;
 if(el)el.value=String(a);
 return R.T.lock;
}
/* ═══ لوحةُ المفاتيح لا تغطّي النقطة ═══
   حين يُركَّز حقلٌ تصعد لوحةُ المفاتيح ويقصر اللوح (interactive-widget=
   resizes-content)، فقد تختفي نقطةُ الأساس تحتها. بعد أن يستقرّ الحجم
   يُزاح العرضُ لتعود النقطةُ إلى منتصف ما بقي — إزاحةٌ لا تكبير. */
export function keepVisible(p,m=40){
 if(!p||!V.w||!V.h)return false;
 const q=W2S(p[0],p[1]);
 if(q[0]>=m&&q[0]<=V.w-m&&q[1]>=m&&q[1]<=V.h-m)return false;
 panBy(V.w/2-q[0],V.h/2-q[1]);
 return true;
}
const keepNow=()=>keepVisible(R.baseOf()||R.T.ghost);
/* التنفيذ: المسارُ نفسُه الذي تسلكه المفاتيح في keymap.js */
export function runTouch(k){
 if(k==="esc"){
  if(R.active())R.cancel();
 }else if(k==="aids"){
  setAids(!aidsOpen); return true;
 }else if(k==="fit"){
  fit(); setAids(false);
 }else if(k.startsWith("s:")){
  const id=k.slice(2);
  if(R.active()||!selList().length)return false;
  R.begin(id);
 }else if(k==="del"){
  if(R.active())return false;
  const r=delSel();
  if(r)HOOK.report("ok","حُذف "+delSay(r)+(r.skipped?` · تُخطّي ${r.skipped}`:""));
  HOOK.refresh(false);
 }else if(k==="props"){
  /* قشرة الهاتف: ورقةُ الخصائص · وإلّا زرُّ الإرساء كما كان */
  if(!HOOK.shellPanel("props")){const fb=$("#fabDock"); if(fb)fb.click()}
 }else if(k==="clear"){
  setSel([],null); HOOK.props();
 }else if(k==="last"){
  if(LASTLEN==null||!applyMeasure([String(LASTLEN/1000),""]))return false;
 }else if(k==="apply"){
  if(!applyMeasure())return false;
 }else if(k==="ok"){
  if(R.active()){jrAdd("enter"); R.enter()}
 }else if(k==="close"){
  const st=R.step();
  if(st&&st.opts&&st.opts.c)R.feedText("c");
 }else if(k==="undo"){
  const st=R.step(), ctx=R.T.ctx;
  const inTool=R.active()&&ctx&&(ctx.pts.length||ctx.made.length);
  if(inTool){
   if(st&&st.opts&&st.opts.u)R.feedText("u"); else R.undoStep();
  }else{
   const ok=undo(); if(ok)jrTaint("تراجع");
   HOOK.report(ok?"in":"wr",ok?"اتعمل تراجع":"مافيش حاجة تتراجع عنها");
   HOOK.refresh(false);
  }
 }else return false;
 try{haptic("tap")}catch(_){}
 HOOK.prompt(); draw();
 return true;
}
export function initTouchBar(){
 const box=$("#touchBar");
 if(!box||box.dataset.wired)return false;
 box.dataset.wired="1";
 /* pointerdown يمنع سرقةَ التركيز من اللوحة (فلا تقفز لوحةُ المفاتيح
    الافتراضية) والنقرةُ نفسُها تنفِّذ */
 box.addEventListener("pointerdown",e=>{
  if(e.target.closest&&e.target.closest("[data-tb],[data-ta],[data-tg]"))e.preventDefault();
 });
 box.addEventListener("click",e=>{
  const tg=e.target.closest&&e.target.closest("[data-tg]");
  if(tg){e.preventDefault(); toggleAid(tg.dataset.tg); return}
  const a=e.target.closest&&e.target.closest("[data-ta]");
  if(a){e.preventDefault(); pickAngle(+a.dataset.ta); HOOK.prompt(); return}
  const b=e.target.closest&&e.target.closest("[data-tb]");
  if(!b)return;
  e.preventDefault();
  runTouch(b.dataset.tb);
 });
 /* «تمّ» في لوحة المفاتيح = طبّق · والمفاتيحُ لا تتسرّب إلى الاختصارات */
 box.addEventListener("keydown",e=>{
  if(!e.target.dataset||e.target.dataset.tm===undefined)return;
  e.stopPropagation();
  if(e.key==="Enter"){e.preventDefault(); applyMeasure()}
  else if(e.key==="Escape"){e.target.value=""; e.target.blur()}
 });
 box.addEventListener("focusin",e=>{
  if(e.target.dataset&&e.target.dataset.tm!==undefined)setTimeout(keepNow,350);
 });
 if(typeof window!=="undefined"&&window.visualViewport
    &&window.visualViewport.addEventListener)
  window.visualViewport.addEventListener("resize",()=>{
   const A=document.activeElement;
   if(A&&A.dataset&&A.dataset.tm!==undefined)setTimeout(keepNow,60);
  });
 /* نقرةٌ بإصبعين = تراجع (canvas.js ينادي الخطّاف) */
 /* ومرّتان متتاليتان = ملاءمة: التراجعُ ينتظر ٢٨٠ مللي ثانية ليعرف */
 let t2=null;
 HOOK.tap2=()=>{
  if(t2){clearTimeout(t2); t2=null; fit(); return}
  t2=setTimeout(()=>{t2=null; runTouch("undo")},TAP2_WAIT);
 };
 /* لمسةٌ على اللوح تُغلق لوحةَ المساعدات */
 document.addEventListener("pointerdown",e=>{
  if(aidsOpen&&e.target&&e.target.id==="cv")setAids(false);
 },true);
 syncTouchBar();
 return true;
}
