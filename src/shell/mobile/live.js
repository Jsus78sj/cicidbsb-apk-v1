/* ═══ قشرة الهاتف · التركيبُ الحيّ ═══
   يُحمَّل كسولاً من index.js عند mount وحده، فعقدُ القشرة (id · ready)
   يبقى خفيفاً بلا DOM ولا قماش.

   المرحلة C: الفئاتُ الخمسُ تفتح شبكةَ أدواتها (catalog.js)، و«ابحث»
   يفتح ورقةَ بحثٍ تعيد استعمالَ palette.js، و«مؤخّراً» أعلاها.
   كلُّ ما يُنفَّذ يمرّ بالمسار نفسه الذي تمرّ به الأزرارُ على الحاسوب:
   R.begin للأدوات، وrunSpec({act}) للأفعال.

   المرحلة D: اللوحاتُ أوراق (props-sheet.js). كلُّ revealSec على الهاتف
   (laysDlg · projDlg · «خصائص» في شريط التحديد …) يمرّ بـHOOK.shellPanel
   فيفتح ورقةً تتبنّى القسمَ الحيَّ نفسَه بدل لوحةٍ في إرساءٍ مخفيّ. */
import * as R from "../../tools/registry.js";
import {HOOK} from "../../ui/bus.js";
import {selList,draw} from "../../ui/canvas.js";
import {S} from "../../core/state.js";
import {touchText} from "../../ui/touchtext.js";
import {runTouch} from "../../ui/touchbar.js";
import {open as openAppMenu} from "../../ui/appmenu.js";
import {recentList,noteUse} from "../../ui/recentbar.js";
/* palette.js ثقيل (الفهرس والأدلّة): يُحمَّل مع القشرة نفسها لا قبلها */
import {setOverride} from "../select.js";
import {stateOf,onBack} from "./machine.js";
import {CATALOG,itemAt} from "./catalog.js";
import {TPL} from "../../tools/presets.js";
import {buildChrome,paint} from "./chrome.js";
import {wireDrag} from "./sheet.js";
import {escapeHtml as esc} from "../../core/escape.js";
import {paneOf,paneDef,paneShell,adopt,release,refreshLevels,setLevel,toggleLevelOpt} from "./props-sheet.js";
import {renderVisible,markAllDirty,renderPanel,panelIds} from "../../ui/panels.js";

/* أسطحُ الحاسوب التي تُخرَج من التدفّق (ودورُها انتقل إلى #mTop أو
   الشريط السفليّ أو الورقة). #side/#sideE/#cmdWrap/#optbar تبقى في
   مكانها وتُخفى بـmobile.css لأنّ لها حالاتٍ تُفتح فيها. */
export const PARK=Object.freeze(["#top","#ribbon","#tools","#navbar",
 "#fabDock","#thumb","#qpCard","#status"]);
/* مراجعةُ D: الإرساءُ مخفيٌّ بالتنسيق (mobile.css) لا بـhidden، فكان
   panels.js يراه «مرئيّاً» ويعيد رسمَ كلّ لوحاته (الجداول · المحاور ·
   الحالة …) مع كلّ تراجعٍ وفتح على الهاتف ولا يراها أحد. السمةُ هنا
   يقرؤها panels.js (shown) فلا يُرسَم إلّا ما في الورقة. */
const DOCK_OFF=Object.freeze(["#side","#sideE"]);

/* أعضاءُ عائلة: الثابتةُ من الكتالوج، والقوالبُ من presets.js نفسِها */
export function membersOf(g){
 if(!g||g.t!=="grp")return [];
 if(g.src==="tpl")return TPL.map(t=>({t:"tpl",id:t.id,n:String(t.label||t.id).replace(/^قالب:\s*/,""),ref:t}));
 return g.items.slice();
}
const tile=(x,attrs)=>`<button type="button" class="mTile${x.t==="grp"?" mGrp":""}" ${attrs}>`
 +`<span>${esc(x.n)}</span></button>`;

/* الكتالوجُ يُبنى إلى ورقة فئةٍ: شبكةُ أزرار + «كل الأدوات» (البحث).
   وورقةُ العائلة (gi) شبكةُ أعضائها + «‹ رجوع» إلى فئتها. */
function catSheet(k,gi){
 const c=CATALOG.find(x=>x.k===k);
 if(!c)return null;
 if(gi!=null){
  const g=c.items[gi];
  if(!g||g.t!=="grp")return null;
  const grid=membersOf(g).map((x,j)=>tile(x,`data-c="${esc(k)}" data-x="${gi}" data-y="${j}"`)).join("");
  return {title:g.n, html:`<button type="button" class="mWide" data-m="up">‹ ${esc(c.n)}</button>`
   +`<div class="mGrid">${grid}</div>`
   +`<button type="button" class="mWide" data-m="search">🔍 كل الأدوات</button>`};
 }
 const grid=c.items.map((x,i)=>tile(x,`data-c="${esc(k)}" data-x="${i}"`)).join("");
 let h=`<div class="mGrid">${grid}</div>`
  +`<button type="button" class="mWide" data-m="search">🔍 كل الأدوات</button>`;
 if(k==="cat:more")h+=`<button type="button" class="mWide" data-m="desktop">الواجهة المكتبية</button>`;
 return {title:c.n, html:h};
}

/* ورقةُ البحث: حقلٌ + «مؤخّراً» حين لا كتابة + النتائج */
const searchShell=()=>
 `<input type="search" class="mQ" data-q="" placeholder="اكتب اسم أداة…" `
 +`aria-label="ابحث عن أداة أو أمر" autocomplete="off" spellcheck="false">`
 +`<div class="mRes" data-res=""></div>`;

const isQ=t=>!!(t&&t.getAttribute&&t.getAttribute("data-q")!==null);

const rowBtn=(attrs,label,sub)=>
 `<button type="button" class="mRow" ${attrs}><span>${esc(label)}</span>`
 +(sub?`<small>${esc(sub)}</small>`:"")+`</button>`;

export async function mount(ctx={}){
 const doc=globalThis.document;
 if(!doc||!doc.body)return {unmount(){}};
 const P=await import("../../ui/palette.js");
 const $=s=>doc.querySelector(s);
 const refs=buildChrome(doc);
 const sheetSt={open:false, snap:"half", cat:null, grp:null, pane:null};
 /* أقسامُ اللوحات المتبنّاة في الورقة الآن (تُعاد قبل أيّ تبديل) */
 let held=[];
 const letGo=()=>{if(held.length){release(held); markAllDirty()} sheetSt.pane=null};
 /* التسلّح: أداةُ تعديلٍ اختيرت بلا تحديد (sel:1) تنتظر العناصرَ ثم ✓ */
 let armed=null;
 let last=[];                         /* نتائجُ البحث الظاهرة، بالترتيب */

 /* ١ · إخراجُ أسطح الحاسوب (مع موضع العودة) */
 const park=doc.createElement("div");
 park.setAttribute("id","mPark");
 park.setAttribute("hidden","");
 const parked=[];
 for(const sel of PARK){
  const el=$(sel);
  if(!el||!el.parentElement)continue;
  parked.push({el, parent:el.parentElement, next:el.nextSibling||null});
  park.appendChild(el);
 }
 /* شريطُ اللمس: يُتبنّى ويُعاد إلى مكانه */
 const tb=$("#touchBar");
 const tbHome=tb&&tb.parentElement?{parent:tb.parentElement, next:tb.nextSibling||null}:null;
 refs.touchBar=tb||null;
 doc.body.insertBefore(refs.root,doc.body.firstChild);
 doc.body.appendChild(park);
 const docks=DOCK_OFF.map(s=>$(s)).filter(Boolean);
 for(const d of docks)d.setAttribute("data-m-off","");

 /* ٢ · الحقائق والرسم */
 const facts=()=>{
  const on=!!R.active();
  const q=on?(R.promptText()||{}):{};
  const n=on?0:selList().length;
  const off=id=>{const b=$(id); return !!(b&&b.disabled)};
  return {sheet:sheetSt.open, tool:on, sel:n, nSel:n,
   armed:(!on&&armed)?armed.n:null,
   def:on?R.T.def:null, step:on?R.step():null,
   toolName:q.tool||"", hint:touchText(q.p||""),
   undoOff:off("#bUndo"), redoOff:off("#bRedo"),
   name:(S&&S.meta&&S.meta.name)||"CivilDraft"};
 };
 const sync=()=>{
  const f=facts();
  const plan=paint(refs,stateOf(f),f,sheetSt.snap);
  if(sheetSt.pane==="levels")refreshLevels(refs.sheet.body);
  return plan;
 };

 /* ٣ · الورقة */
 const setSheet=(title,html,snap)=>{
  letGo();
  sheetSt.open=true; sheetSt.snap=snap;
  refs.sheet.el.setAttribute("aria-label",title);
  refs.sheet.head.textContent=title;
  refs.sheet.body.innerHTML=html;
  sync();
 };
 const openSheet=(k,snap="half",gi=null)=>{
  const c=catSheet(k,gi);
  if(!c)return false;
  sheetSt.cat=k; sheetSt.grp=gi;
  setSheet(c.title,c.html,snap);
  return true;
 };
 const openSearch=()=>{
  sheetSt.cat="search"; sheetSt.grp=null;
  setSheet("ابحث",searchShell(),"full");
  renderResults("");
  const q=refs.sheet.body.querySelector("[data-q]");
  if(q&&q.focus)q.focus();
  return true;
 };
 /* ورقةُ لوحة: الأقسامُ الحيّةُ تُنقل إلى الحاضن ثمّ تُرسَم لأنّها صارت مرئيّة */
 const openPane=id=>{
  const def=paneDef(id,doc);
  if(!def)return false;
  sheetSt.cat="pane"; sheetSt.grp=null;
  setSheet(def.n,paneShell(def),def.snap||"half");
  sheetSt.pane=id;
  const host=refs.sheet.body.querySelector("[data-pane-host]");
  held=adopt(doc,host,def.secs);
  if(def.secs.length&&!held.length&&!def.head&&!def.build){
   refs.sheet.body.innerHTML=`<p class="mNote">«${esc(def.n)}» غير مبنيّة بعد</p>`;
  }
  try{renderVisible(0)}catch(_){}
  return true;
 };
 const closeSheet=()=>{
  letGo();
  sheetSt.cat=null; sheetSt.grp=null;
  if(!sheetSt.open)return false;
  sheetSt.open=false; sheetSt.snap="half";
  sync();
  return true;
 };
 const offDrag=wireDrag(refs.sheet,
  ()=>(globalThis.innerHeight||800),
  ()=>sheetSt.snap,
  next=>{if(next==="closed")closeSheet(); else{sheetSt.snap=next; sync()}});

 /* ٤ · التنفيذ: المسارُ نفسُه الذي تسلكه أزرارُ الحاسوب
    مراجعةُ C: كانت كلُّ أداةٍ لا تبقى فعّالةً بعد begin تُعلَن «تحتاج
    تحديداً» — ومنها الأوامرُ اللحظيّة الناجحة (معالجُ الغرفة)، ورسالةُ
    الأداة نفسِها تظهر معها فرسالتان. ولم تُسجَّل في «مؤخّراً». الآن:
    · sel:1 بلا تحديد ⇒ تسلّح (لا رفض): «انقر العناصر ثم ✓»
    · غيرُها: رسالةُ الأداة وحدها، وتُسجَّل إن بدأت أو نُفِّذت لحظيّاً
      بلا تحذير. ويُحكَم «بلا تحديد» برسالة الأداة نفسِها (wr «حدّد…»)
      فأيُّ أداةٍ من البحث تحتاج تحديداً تتسلّح كذلك. */
 const arm=(id,n)=>{
  const d=R.findTool(id);
  armed={id, n:n||(d&&d.label)||id};
  HOOK.report("in",`«${armed.n}»: انقر العناصر ثم ✓`);
  sync(); draw();
  return true;
 };
 const disarm=()=>{if(!armed)return false; armed=null; sync(); return true};
 const startTool=(id,meta={})=>{
  closeSheet();
  armed=null;
  if(meta.sel&&!R.active()&&!selList().length)return arm(id,meta.n);
  const rep0=R.H.rep; let warn=null;
  R.H.rep=(c,m)=>{if(c==="wr"&&warn===null)warn=String(m||""); return rep0(c,m)};
  try{R.histAdd(id); R.begin(id)}finally{R.H.rep=rep0}
  const on=R.active()&&R.T.id===id;
  if(!on&&!selList().length&&warn&&/^حدّد/.test(warn))return arm(id,meta.n);
  if(on||!warn)noteUse(id);
  HOOK.prompt(); sync(); draw();
  return true;
 };
 const goArmed=()=>{
  if(!armed||!selList().length)return false;
  const a=armed; armed=null;
  return startTool(a.id,{n:a.n});
 };
 const pick=(x,ci,gi)=>{
  if(!x)return false;
  if(x.t==="grp")return openSheet(ci,"half",gi);
  if(x.t==="pane")return openPane(x.id);
  if(x.t==="tpl"){
   closeSheet();
   P.paletteExec({kind:"tpl",key:x.id,ref:x.ref,label:x.n});
   sync(); draw(); return true;
  }
  if(x.t==="act"){
   closeSheet();
   if(ctx.run)ctx.run({act:x.id});
   sync(); return true;
  }
  return startTool(x.id,x);
 };
 const execResult=it=>{
  closeSheet();
  if(it&&it.kind==="cmd")return startTool(it.key,{n:it.label});
  P.paletteExec(it);
  sync(); draw();
  return true;
 };

 /* نتائجُ البحث: «مؤخّراً» حين لا كتابة، وإلّا ما يطابق palette.js */
 function renderResults(q){
  const box=refs.sheet.body.querySelector("[data-res]");
  if(!box)return;
  const t=String(q||"").trim();
  if(!t){
   const rec=recentList();
   last=[];
   box.innerHTML=(rec.length
    ?`<p class="mNote">مؤخّراً</p>`+rec.map(id=>{const d=R.findTool(id)||{};return rowBtn(`data-r="${esc(id)}"`,d.label||id)}).join("")
    :`<p class="mNote">اكتب اسم أداة. مثلاً: جدار · باب · بُعد</p>`);
   return;
  }
  last=P.paletteQuery(t,12);
  box.innerHTML=last.length
   ?last.map((it,i)=>rowBtn(`data-p="${i}"`,it.label||it.key,it.sub||"")).join("")
   :`<p class="mNote">لا شيء بهذا الاسم</p>`;
 }

 /* ٥ · النقرات والإدخال: تفويضٌ واحدٌ على الجذر */
 const onClick=e=>{
  const t=e.target;
  /* داخلَ قسمٍ متبنًّى: النقرةُ لمستمعي اللوحة نفسِها (data-p هناك حقلُ
     خصائص لا نتيجةُ بحث) — لا يلمسها التفويض */
  const host=t&&t.closest&&t.closest("[data-pane-host]");
  if(host&&refs.root.contains(host))return;
  const b=t&&t.closest&&t.closest("[data-k],[data-m],[data-c],[data-r],[data-p],[data-a],[data-t],[data-lv],[data-lvo]");
  if(!b||!refs.root.contains(b))return;
  if(tb&&tb.contains(b))return;          /* أزرارُ touchbar لها مستمعوها */
  if(e.preventDefault)e.preventDefault();
  /* مفتاحٌ غائبٌ = لا قيمة (لا ""): الأزرار الأخرى لا تحمل هذه السمات */
  const ds={};
  for(const a of ["k","m","c","x","y","r","p","a","t","lv","lvo"]){const v=b.getAttribute&&b.getAttribute("data-"+a); if(v!==null&&v!==undefined)ds[a]=v}
  if(ds.m==="search"){openSearch(); return}
  /* أفعالُ ورقة اللوحة: فعلٌ (runSpec) · أداة · طابق */
  if(ds.a!==undefined){closeSheet(); if(ctx.run)ctx.run({act:ds.a}); sync(); return}
  if(ds.t!==undefined){startTool(ds.t); return}
  if(ds.lv!==undefined){setLevel(ds.lv); refreshLevels(refs.sheet.body); HOOK.refresh(false); sync(); draw(); return}
  if(ds.lvo!==undefined){toggleLevelOpt(ds.lvo); refreshLevels(refs.sheet.body); HOOK.refresh(false); draw(); return}
  if(ds.m==="up"){if(sheetSt.cat)openSheet(sheetSt.cat,sheetSt.snap); return}
  if(ds.m==="desktop"){
   setOverride("desktop");
   try{globalThis.location.reload()}catch(_){}
   return;
  }
  if(ds.c!==undefined){
   if(ds.y!==undefined){
    const g=itemAt(ds.c,+ds.x);
    pick(membersOf(g)[+ds.y],ds.c,+ds.x);
   }else pick(itemAt(ds.c,+ds.x),ds.c,+ds.x);
   return;
  }
  if(ds.r!==undefined){startTool(ds.r); return}
  if(ds.p!==undefined){execResult(last[+ds.p]); return}
  if(refs.top.contains(b)){
   const k=ds.k;
   if(k==="menu")openAppMenu();
   else if(k==="search")openSearch();
   else if(k==="armGo")goArmed();
   else if(k==="armX")disarm();
   else if((k==="undo"||k==="redo")&&ctx.run)ctx.run({act:k});
   sync();
   return;
  }
  if(refs.bars.idle.contains(b)){
   if(sheetSt.open&&sheetSt.cat===ds.k)closeSheet(); else openSheet(ds.k);
   return;
  }
  /* لا #touchBar (بيئةٌ ناقصة): الأزرارُ المرسومةُ تنادي runTouch نفسَها */
  if(ds.k&&runTouch(ds.k)){sync(); draw()}
 };
 const onInput=e=>{
  const q=isQ(e.target);
  if(q)renderResults(e.target.value);
 };
 const onKeyDown=e=>{
  const q=isQ(e.target);
  if(q&&e.key==="Enter"&&last.length){
   if(e.preventDefault)e.preventDefault();
   execResult(last[0]);
  }
 };
 refs.root.addEventListener("click",onClick);
 refs.root.addEventListener("input",onInput);
 refs.root.addEventListener("keydown",onKeyDown);

 /* ٦ · الرجوع: الورقةُ أوّلاً، ثمّ backStep كما هو (أداة ▸ مفتوح ▸ تحديد) */
 const prevBack=HOOK.shellBack;
 /* revealSec ⇒ ورقة. quiet: زرُّ وكالةٍ (proxy) سيُنقَر في مكانه، فلا
    حاجةَ لكشف لوحته — يُكتفى بأنّ القشرةَ تملك الكشف */
 const prevPanel=HOOK.shellPanel;
 HOOK.shellPanel=(sec,o)=>{
  if(o&&o.quiet){
   /* مراجعةُ D: الإرساءُ لا يُرسَم على الهاتف، فزرُّ الوكالة الذي ترسمه
      لوحتُه ([data-brenum] · #pDel …) يُرسَم الآن قسراً قبل نقره */
   if(panelIds().includes(sec)){try{renderPanel(sec,1)}catch(_){}}
   return true;
  }
  if(openPane(paneOf(sec)))return true;
  /* قسمٌ لا يُبنى: كان revealSec يكمل إلى الإرساء المخفيّ فلا يرى المستخدم شيئاً */
  HOOK.report("wr",`«${sec}» غير متاحة على الهاتف · الواجهة المكتبية من «المزيد»`);
  return true;
 };
 /* ورقةُ عائلةٍ ترجع إلى فئتها أوّلاً، ثمّ تُغلَق؛ والتسلّحُ يُلغى قبل التحديد */
 const back=()=>{
  const f=facts();
  const a=onBack({...f, armed:!!armed&&!f.tool});
  if(a==="closeSheet"){
   if(sheetSt.grp!=null&&sheetSt.cat)return openSheet(sheetSt.cat,sheetSt.snap);
   return closeSheet();
  }
  if(a==="disarm")return disarm();
  return false;
 };
 HOOK.shellBack=back;
 const onKey=e=>{
  if(e.key==="Escape"&&(sheetSt.open||armed)&&back()){
   if(e.preventDefault)e.preventDefault();
   if(e.stopPropagation)e.stopPropagation();
  }
 };
 doc.addEventListener("keydown",onKey,true);

 /* ٧ · المزامنة: syncPrompt وHOOK.props تناديان HOOK.shell */
 const prevShell=HOOK.shell;
 HOOK.shell=sync;
 sync();

 return {
  refs, sync, openSheet, openSearch, closeSheet, openPane, pick, back,
  pane:()=>sheetSt.pane,
  armed:()=>armed?armed.id:null,
  state:()=>stateOf(facts()),
  unmount(){
   HOOK.shell=prevShell;
   HOOK.shellBack=prevBack;
   HOOK.shellPanel=prevPanel;
   letGo();
   for(const d of docks)d.removeAttribute("data-m-off");
   markAllDirty();
   doc.removeEventListener("keydown",onKey,true);
   refs.root.removeEventListener("click",onClick);
   refs.root.removeEventListener("input",onInput);
   refs.root.removeEventListener("keydown",onKeyDown);
   offDrag();
   if(tb&&tbHome)tbHome.parent.insertBefore(tb,tbHome.next&&tbHome.next.parentElement===tbHome.parent?tbHome.next:null);
   for(const p of parked.reverse())
    p.parent.insertBefore(p.el,p.next&&p.next.parentElement===p.parent?p.next:null);
   refs.root.remove();
   park.remove();
  }
 };
}
