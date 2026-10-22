/* ═══ المرحلة B من خطّة الهاتف: هيكلُ قشرة الهاتف ═══
   المنجَز حين: «اختبارٌ يُثبت أن سطحاً سفلياً واحداً فقط ظاهر في كل حالة».
   ١ · آلةُ الحالات: الأولويّة، وسطحٌ سفليٌّ واحد، والترويسةُ تُخفى تحت الورقة
   ٢ · الأشرطة: محتوى كلّ حالة من الأداة/التحديد نفسيهما، والخامل خمسُ فئات
   ٣ · الورقة: موضعُ السحب والـflick، والمقبضُ يغلقها
   ٤ · الـDOM: العدُّ الفعليّ للسطوح الظاهرة بعد paint() في كل حالة
   ٥ · الرجوع: الورقة ▸ الأداة ▸ التحديد
   ٨ · المرحلة D: القشرةُ مفعَّلة (ready=true) والهاتفُ المكتشَفُ يُقلع عليها
   ١٠ · التركيبُ الحيّ: mount يُخرج أسطحَ الحاسوب، يتبنّى #touchBar،
        يتبع الأداةَ والتحديد، يفتح الورقةَ ويغلقها بالرجوع، ثمّ unmount
        يُعيد كلَّ شيءٍ إلى موضعه
   ١١ · المزامنةُ لا تعيد البناء بلا تغيير (بصمة) · الترويسةُ نصٌّ لا أزرارٌ ميتة
   ١٢ · mobile.css: صفر !important وكلُّ قاعدةٍ تحت سمة القشرة
   التشغيل:  node src/tests/mobile-shell.test.js                  */
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {shim,shimCanvas,shimDOM,group,groupAsync,ok,eq,deep,summary} from "./harness.js";
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const rd=p=>{try{return readFileSync(join(ROOT,p),"utf8")}catch(e){return ""}};

shim(); shimCanvas();
const doc=shimDOM();
/* أدواتُ touchbar (المستعملة للأزرار) تحتاج #cv كما في touch-shell */
for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status","touchBar","optbar","cv"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
for(const f of ["draw","modify"])await import(`../tools/${f}.js`);

const M=await import("../shell/mobile/machine.js");
const A=await import("../shell/mobile/actionbar.js");
const T=await import("../shell/mobile/topbar.js");
const S=await import("../shell/mobile/sheet.js");
const C=await import("../shell/mobile/chrome.js");
const SEL=await import("../shell/select.js");
const MOB=await import("../shell/mobile/index.js");

const combos=[];
for(const sheet of [false,true])for(const tool of [false,true])for(const sel of [0,1,3])
 combos.push({sheet,tool,sel});

group("١ · آلةُ الحالات",()=>{
 eq(M.stateOf({}),"idle","لا شيء ⇒ خامل");
 eq(M.stateOf({sel:2}),"sel","تحديدٌ وحده ⇒ تحديد");
 eq(M.stateOf({tool:true,sel:2}),"tool","الأداةُ تغلب التحديد");
 eq(M.stateOf({sheet:true,tool:true,sel:2}),"sheet","الورقةُ تغلب كلَّ شيء");
 eq(M.stateOf({sheet:true}),"sheet","ورقةٌ وحدها");
 eq(M.stateOf({sel:0}),"idle","تحديدٌ صفر ⇒ خامل");
 eq(M.STATES.join(","),"idle,tool,sel,sheet","الحالاتُ الأربع");
 let bad=0;
 for(const c of combos){const s=M.stateOf(c); if(!M.STATES.includes(s))bad++}
 eq(bad,0,"كلُّ التركيبات تعطي حالةً معروفة");
});

group("٢ · سطحٌ سفليٌّ واحدٌ في كلّ حالة (المنطق)",()=>{
 for(const st of M.STATES){
  const p=M.planOf(st);
  eq(p.bottom,st,`${st}: السطحُ السفليّ هو الحالةُ نفسُها`);
 }
 let multi=0, none=0;
 for(const c of combos){
  const st=M.stateOf(c);
  const visible=["idle","tool","sel","sheet"].filter(s=>s===M.planOf(st).bottom);
  if(visible.length>1)multi++;
  if(visible.length<1)none++;
 }
 eq(multi,0,"لا تركيبةَ فيها أكثرُ من سطحٍ سفليّ");
 eq(none,0,"ولا تركيبةَ فيها صفر");
 ok(!M.topVisible("sheet"),"الترويسةُ تُخفى تحت الورقة");
 ok(M.topVisible("idle")&&M.topVisible("tool")&&M.topVisible("sel"),"وتظهر في الباقي");
 let thr=false; try{M.planOf("tv")}catch(e){thr=true}
 ok(thr,"حالةٌ غريبة ترمي خطأً بدل أن تُرسَم بصمت");
});

group("٣ · محتوى الأشرطة",()=>{
 const idle=A.itemsFor("idle",{});
 eq(idle.map(x=>x.n).join("·"),"رسم·تعديل·إضافة·تأشير·المزيد","الخامل: خمسُ فئات بالترتيب");
 ok(idle.length<=5,"الخامل ≤ ٥ أزرار (المبدأ: ٥ فئات بدل ٧ تبويبات)");
 const sel=A.itemsFor("sel",{nSel:2});
 eq(sel.map(x=>x.k).join(","),"s:move,s:copy,s:rotate,del,props,clear","التحديد: أفعالُ touchbar نفسُها");
 deep(A.itemsFor("sheet",{}),[],"الورقةُ لا أزرارَ شريطٍ تحتها");
 eq(A.itemsFor("tool",{def:null}).length,0,"أداةٌ بلا تعريف ⇒ لا أزرار");
 const pr={id:"wall",hint:"",opts:{}};
 const tl=A.itemsFor("tool",{def:pr,step:{loop:true}});
 ok(tl.some(x=>x.k==="ok")&&tl.some(x=>x.k==="undo")&&tl.some(x=>x.k==="esc"),"الأداة: ✓ ↶ ✕ من barFor نفسها");
 const top=T.topFor("idle",{name:"CivilDraft"});
 eq(top.map(x=>x.k).join(","),"menu,title,undo,redo,search","الترويسة الخاملة: ☰ · اسم · ↶ ↷ · 🔍");
 eq(T.topFor("sheet",{}),null,"الترويسةُ تحت الورقة: لا محتوى");
 eq(T.topFor("sel",{nSel:4})[0].n,"محدَّد: 4","التحديد يعرض عدَّه");
});

group("٤ · الورقة السفليّة",()=>{
 eq(S.settle("half",0,800),"half","بلا سحب ⇒ تبقى");
 eq(S.settle("half",300,800),"closed","سحبٌ نحو الأسفل ٣٧٪ من الارتفاع ⇒ تُغلق");
 eq(S.settle("half",-300,800),"full","سحبٌ ٣٧٪ نحو الأعلى من النصف ⇒ كاملة");
 eq(S.settle("half",-100,800),"half","سحبٌ صغير نحو الأعلى يبقى نصفاً");
 eq(S.settle("full",100,800),"full","كاملةٌ + سحبٌ صغير نحو الأسفل تبقى كاملة");
 eq(S.settle("full",300,800),"half","كاملةٌ + سحبٌ ٣٧٪ نحو الأسفل ⇒ نصف");
 eq(S.settle("closed",-300,800),"half","مغلقةٌ + سحبٌ ٣٧٪ للأعلى ⇒ نصف");
 eq(S.settle("half",0,800,-1),"full","flick للأعلى يقفز موضعاً مهما قصر السحب");
 eq(S.settle("full",0,800,1),"half","flick للأسفل من الكاملة ⇒ نصف");
 eq(S.settle("half",0,800,1),"closed","flick للأسفل من النصف ⇒ مغلقة");
 eq(S.settle("full",0,800,-1),"full","لا موضعَ أعلى من الكاملة");
 eq(S.settle("closed",0,0),"closed","ارتفاعٌ صفر ⇒ لا حركة");
 let thr=false; try{S.settle("x",0,800)}catch(e){thr=true}
 ok(thr,"موضعٌ غريب يُرفَض");
 eq(S.SNAPS.join(","),"closed,half,full","ثلاثةُ مواضع");
});

group("٥ · الـDOM: العدُّ الفعليّ للسطوح السفليّة",()=>{
 const refs=C.buildChrome(doc);
 doc.body.appendChild(refs.root);
 let worst=0, perState={};
 for(const c of combos){
  const st=M.stateOf(c);
  C.paint(refs,st,{def:{id:"wall",hint:"",opts:{}},step:{loop:true},nSel:c.sel},"half");
  const n=C.visibleBottom(refs);
  perState[st]=n;
  if(n!==1)worst=Math.max(worst,n);
 }
 eq(worst,0,"في كلِّ تركيبةٍ: سطحٌ سفليٌّ واحدٌ ظاهر بالضبط");
 eq(perState.idle+perState.tool+perState.sel+perState.sheet,4,"وكلُّ حالةٍ تحقّقت");

 C.paint(refs,"idle",{});
 ok(!refs.top.hidden,"خامل: الترويسةُ ظاهرة");
 eq(refs.bars.idle.hidden,false,"خامل: شريطُ الخامل ظاهر");
 eq(refs.bars.idle.querySelectorAll("button").length,5,"خامل: خمسةُ أزرار");
 ok(refs.sheet.el.hidden,"خامل: الورقةُ مخفيّة");

 C.paint(refs,"sel",{nSel:2});
 ok(refs.bars.idle.hidden&&!refs.bars.sel.hidden,"تحديد: شريطُ التحديد وحده");
 ok(refs.bars.sel.querySelector('[data-k="del"]')!==null,"تحديد: زرُّ الحذف ظاهر");

 C.paint(refs,"sheet",{},"full");
 ok(refs.top.hidden,"ورقة: الترويسةُ مخفيّة");
 ok(refs.bars.idle.hidden&&refs.bars.tool.hidden&&refs.bars.sel.hidden,"ورقة: لا شريطَ تحتها");
 eq(refs.sheet.el.getAttribute("data-snap"),"full","ورقة: موضعُها المطلوب");

 C.paint(refs,"sheet",{},"half");
 const again=C.paint(refs,"idle",{});
 eq(again.bottom,"idle","عودةٌ إلى الخامل تُغلق الورقة");
 ok(refs.sheet.el.hidden,"والورقةُ مغلقةٌ بعد العودة");
});

group("٦ · الورقة تُغلق بمقبضها وتُبلغ موضعَها",()=>{
 const refs=C.buildChrome(doc);
 doc.body.appendChild(refs.root);
 C.paint(refs,"sheet",{},"half");
 const seen=[];
 const off=S.wireDrag(refs.sheet,()=>800,()=>refs.sheet.el.getAttribute("data-snap"),n=>seen.push(n));
 const down={type:"pointerdown",clientY:400,timeStamp:0};
 refs.sheet.grip.dispatchEvent(down);
 /* ٣٠٠ بكسل في ٢٠٠٠ مللي ثانية = سرعةٌ بطيئة: المسافةُ وحدها تحسم */
 refs.sheet.el.dispatchEvent({type:"pointermove",clientY:700,timeStamp:2000});
 refs.sheet.el.dispatchEvent({type:"pointerup",clientY:700,timeStamp:2000});
 eq(seen[0],"closed","سحبٌ ٣٠٠ بكسل إلى الأسفل من النصف (بطيء) ⇒ مغلقة");
 ok(refs.sheet.el.hidden,"والمقبضُ أغلقها فعلاً في DOM");
 off();
 refs.sheet.grip.dispatchEvent({type:"pointerdown",clientY:0,timeStamp:0});
 refs.sheet.el.dispatchEvent({type:"pointerup",clientY:0,timeStamp:5});
 eq(seen.length,1,"بعد فكّ الربط لا يُنادى المستمع");
});

group("٧ · زرُّ الرجوع: الورقة ▸ الأداة ▸ التحديد",()=>{
 eq(M.onBack({sheet:true,tool:true,sel:2}),"closeSheet","الورقةُ أوّلاً");
 eq(M.onBack({tool:true,sel:2}),"cancelTool","ثمّ الأداة");
 eq(M.onBack({sel:2}),"clearSel","ثمّ التحديد");
 eq(M.onBack({}),"none","لا شيء ⇒ لا شيء (المنصّةُ تطلب ضغطةً ثانية)");
});

group("٨ · القشرةُ مفعَّلة (نهاية المرحلة D)",()=>{
 eq(MOB.id,"mobile","عقدُ الهاتف: المعرّف");
 eq(MOB.ready,true,"جاهزة: الهاتفُ المكتشَفُ آليّاً يُقلع عليها");
 ok(typeof MOB.mount==="function","والعقدُ كاملٌ");
 ok(SEL.pickShell({coarse:true,w:390,h:844})==="mobile","الاختيارُ ما زال يعطي هاتفاً");
 ok(/data-chrome/.test(rd("src/shell/select.js")),"السمةُ data-chrome لا data-shell (تصادُمٌ مع الشريط)");
 ok(!/dataset\.chrome\s*=\s*["'](ribbon|classic)/.test(rd("src/ui/ribbon/wire.js")),"والشريطُ لا يكتب data-chrome");
 ok(/export const ready=true/.test(rd("src/shell/mobile/index.js")),"index.js: ready=true");
});

group("٩ · الرموزُ المُصدَّرة تُفحَص بأسمائها",()=>{
 eq(M.bottomOf("tool"),"tool","bottomOf: السطحُ السفليّ = الحالة");
 eq(A.IDLE_CATS.length,5,"IDLE_CATS: خمسُ فئات");
 eq(S.SNAP_AT.half,0.5,"SNAP_AT: نصفُ الشاشة هو الموضعُ الأوسط");
 eq(S.FLICK_V,0.5,"FLICK_V: عتبةُ الـflick");
 const b=S.buildSheet(doc,"اختبار");
 eq(b.el.getAttribute("data-snap"),"closed","buildSheet: تبدأ مغلقة");
 ok(b.el.hidden&&b.grip&&b.body,"buildSheet: مقبضٌ وجسمٌ وهي مخفيّة");
 S.setSnap(b.el,"full");
 eq(b.el.getAttribute("data-snap"),"full","setSnap: يكتب الموضع");
 ok(!b.el.hidden,"setSnap: الكاملة ظاهرة");
 S.setSnap(b.el,"closed");
 ok(b.el.hidden,"setSnap: المغلقة مخفيّة");
 let bad=false; try{S.setSnap(b.el,"x")}catch(e){bad=true}
 ok(bad,"setSnap: موضعٌ غريبٌ يُرفَض");
});

const R=await import("../tools/registry.js");
const {paletteQuery:P_QUERY}=await import("../ui/palette.js");
const CV=await import("../ui/canvas.js");
const {HOOK}=await import("../ui/bus.js");
const BN=await import("../ui/backnav.js");

const LIVE=await import("../shell/mobile/live.js");
const CAT=await import("../shell/mobile/catalog.js");
const ST=await import("../core/state.js");
const PRESETS=await import("../tools/presets.js");
const H=await MOB.mount({});
const H_OK=!!(H&&H.refs&&typeof H.unmount==="function");
H.unmount();
let h; const runs=[]; let lastRep="";
HOOK.report=(c,m)=>{lastRep=String(m)};
await groupAsync("١٠ · التركيبُ الحيّ",async()=>{
 const before=new Map(LIVE.PARK.map(s=>{const e=doc.querySelector(s); return [s,e&&e.parentElement]}));
 const tb=doc.querySelector("#touchBar"), tbHome=tb.parentElement;
 h=await LIVE.mount({run:a=>runs.push(a)});
 ok(H_OK,"index.mount (كسول) يُحمّل live.js ويركّب");
 ok(h&&typeof h.unmount==="function","mount يُرجع مقبضاً");
 const park=h.refs.root.parentElement&&[...doc.body.children].find(e=>e.getAttribute("id")==="mPark");
 ok(!!park&&park.hidden,"حاويةُ الإخراج موجودةٌ ومخفيّة");
 let out=0; for(const s of LIVE.PARK){const e=doc.querySelector(s); if(e&&park.contains(e))out++}
 eq(out,LIVE.PARK.length,"كلُّ أسطح الحاسوب المدرجة خرجت من التدفّق");
 eq(doc.body.firstChild,h.refs.root,"الهيكلُ أوّلُ body");
 eq(h.state(),"idle","يبدأ خاملاً");
 eq(C.visibleBottom(h.refs),1,"خامل: سطحٌ سفليٌّ واحد");

 /* تحديد ⇒ شريطُ التحديد يحمل #touchBar نفسَه */
 CV.setSel([{id:"x"}],null);
 const nSel=CV.selList().length;
 HOOK.shell();
 if(nSel>0){
  eq(h.state(),"sel","تحديدٌ ⇒ حالةُ التحديد");
  eq(tb.parentElement,h.refs.bars.sel,"#touchBar متبنًّى في شريط التحديد");
  eq(C.visibleBottom(h.refs),1,"تحديد: سطحٌ سفليٌّ واحد");
 }else ok(true,"(setSel لا يقبل كياناً وهمياً هنا — يُتخطّى)");
 CV.setSel([],null);

 /* أداة ⇒ شريطُ الأداة يحمله */
 R.begin("wall");
 HOOK.shell();
 eq(h.state(),"tool","أداةٌ نشطة ⇒ حالةُ الأداة");
 eq(tb.parentElement,h.refs.bars.tool,"#touchBar انتقل إلى شريط الأداة");
 ok(!h.refs.bars.tool.hidden&&h.refs.bars.idle.hidden,"شريطُ الأداة وحده ظاهر");
 ok(!!h.refs.top.querySelector(".mTop-title"),"الترويسة: اسمُ الأداة نصّاً");
 eq(h.refs.top.querySelectorAll("button").length,0,"ولا أزرارَ ميتةَ في الترويسة أثناء الأداة");

 /* ورقةٌ فوق الأداة، والرجوعُ يُغلقها أوّلاً ثمّ الأداة */
 ok(h.openSheet("cat:draw"),"فتحُ ورقة فئة");
 eq(h.state(),"sheet","الورقةُ تغلب الأداة");
 ok(h.refs.top.hidden,"الترويسةُ تحت الورقة");
 eq(C.visibleBottom(h.refs),1,"ورقة: سطحٌ سفليٌّ واحد");
 eq(h.refs.sheet.head.textContent,"رسم","عنوانُ الورقة اسمُ الفئة");
 eq(BN.backStep(),"shell","الرجوع ١: يُغلق الورقة");
 eq(h.state(),"tool","فتعود الأداة");
 eq(BN.backStep(),"tool","الرجوع ٢: يُلغي الأداة");
 HOOK.shell();
 eq(h.state(),"idle","فيعود الخامل");
 eq(BN.backStep(),null,"الرجوع ٣: لا شيء");

 /* نقرات */
 const cat=h.refs.bars.idle.querySelector('[data-k="cat:edit"]');
 cat.dispatchEvent({type:"click",target:cat,preventDefault(){}});
 h.refs.root.dispatchEvent({type:"click",target:cat,preventDefault(){}});
 eq(h.state(),"sheet","لمسةُ فئةٍ تفتح ورقتها");
 const srch=h.refs.sheet.body.querySelector('[data-m="search"]');
 ok(!!srch,"وفيها طريقُ البحث");
 h.refs.root.dispatchEvent({type:"click",target:srch,preventDefault(){}});
 eq(h.state(),"sheet","«ابحث» يفتح ورقة البحث (ورقةٌ أخرى، لا إغلاق)");
 eq(h.refs.sheet.head.textContent,"ابحث","عنوانُ ورقة البحث");
 ok(!!h.refs.sheet.body.querySelector("[data-q]"),"وفيها حقلُ الكتابة");
 h.closeSheet();
 const u=h.refs.top.querySelector('[data-k="undo"]');
 h.refs.root.dispatchEvent({type:"click",target:u,preventDefault(){}});
 eq(runs.length&&runs[0].act,"undo","↶ في الترويسة ⇒ ctx.run({act:\"undo\"}) (المسارُ نفسُه)");

 /* Escape يغلق الورقة */
 h.openSheet("cat:more");
 ok(!!h.refs.sheet.body.querySelector('[data-m="desktop"]'),"«المزيد» فيها مخرجٌ إلى المكتبية");
 const esc={type:"keydown",key:"Escape",preventDefault(){this.p=1},stopPropagation(){this.s=1}};
 doc.dispatchEvent(esc);
 eq(h.state(),"idle","Escape يغلق الورقة");

 h.unmount();
 let back=0; for(const [s,p] of before){const e=doc.querySelector(s); if(e&&e.parentElement===p)back++}
 eq(back,before.size,"unmount أعاد كلَّ سطحٍ إلى أبيه");
 eq(tb.parentElement,tbHome,"و#touchBar إلى موضعه");
 ok(!doc.body.contains(h.refs.root)&&!doc.body.contains(park),"ولا أثرَ للقشرة في الصفحة");
 eq(HOOK.shellBack(),false,"والرجوعُ عاد كما كان");
});

group("١١ · بصمةُ الرسم",()=>{
 const refs=C.buildChrome(doc);
 C.paint(refs,"idle",{});
 const b1=refs.bars.idle.querySelector("button");
 C.paint(refs,"idle",{});
 eq(refs.bars.idle.querySelector("button"),b1,"مزامنةٌ بلا تغيير لا تعيد بناءَ الأزرار");
 C.paint(refs,"sel",{nSel:1});
 C.paint(refs,"idle",{});
 ok(refs.bars.idle.querySelectorAll("button").length===5,"وتبني حين تتغيّر الحالة");
 const T=refs.top.innerHTML;
 C.paint(refs,"tool",{toolName:"جدار",hint:"انقر"});
 ok(/mTop-title/.test(refs.top.innerHTML)&&!/<button/.test(refs.top.innerHTML),"الترويسةُ أثناء الأداة نصٌّ");
 ok(/data-k="menu"/.test(T),"والخاملةُ أزرار");
});

group("١٢ · mobile.css",()=>{
 const css=rd("css/mobile.css");
 ok(css.length>500,"الملفُّ موجود");
 const body=css.replace(/\/\*[\s\S]*?\*\//g,"");
 eq((body.match(/!important/g)||[]).length,0,"صفر !important");
 eq((body.match(/@media/g)||[]).length,0,"بلا نقاط توقّف: select.js يقرّر");
 const sels=[...body.matchAll(/(^|\})\s*([^{}@]+)\{/g)].map(m=>m[2]).join(",").split(",").map(x=>x.trim()).filter(Boolean);
 const loose=sels.filter(x=>!x.startsWith('html[data-shell-active="mobile"]'));
 eq(loose.length,0,"كلُّ محدِّدٍ تحت سمة القشرة"+(loose.length?" — "+loose.slice(0,3):""));
 ok(rd("index.html").includes('href="css/mobile.css"'),"مربوطٌ في index.html");
});

/* ══ المرحلة C ══ */
const ALL_TOOLS=[...rd("src/app.js").matchAll(/["']\.\/tools\/([\w.]+)\.js["']/g)].map(m=>m[1]);
/* ما يُقلع به التطبيقُ فعلاً: أدواتُ app.js + أدواتُ boot-splash.js (quick* · guidedroom) */
const BOOT_TOOLS=[...rd("src/boot-splash.js").matchAll(/["']\.\/tools\/([\w.]+)\.js["']/g)].map(m=>m[1]);
for(const f of [...ALL_TOOLS,...BOOT_TOOLS])await import(`../tools/${f}.js`).catch(()=>{});
const ACTS=(await import("../ui/actions.js")).ACTIONS;

group("١٣ · الكتالوج: ٥ فئات × ٨ أدوات، كلُّ مفتاحٍ قائم",()=>{
 eq(CAT.CATALOG.length,5,"خمسُ فئات");
 ok(CAT.CATALOG.every(c=>c.items.length===8),"كلُّ فئةٍ ثمانيةُ أدوات بالضبط");
 const all=CAT.CATALOG.flatMap(c=>c.items);
 eq(all.length,40,"أربعونَ أداةً في الكتالوج");
 const leaf=CAT.leaves();
 const badCmd=leaf.filter(x=>x.t==="cmd"&&!R.findTool(x.id)).map(x=>x.id);
 eq(badCmd.length,0,"كلُّ cmd مسجَّلٌ في registry"+(badCmd.length?" — "+badCmd:""));
 const badAct=leaf.filter(x=>x.t==="act"&&!ACTS[x.id]).map(x=>x.id);
 eq(badAct.length,0,"كلُّ act موجودٌ في ACTIONS"+(badAct.length?" — "+badAct:""));
 const ids=all.map(x=>x.t+":"+x.id);
 eq(new Set(ids).size,ids.length,"لا تكرارَ في الكتالوج");
 ok(!leaf.some(x=>/quick|guided/.test(x.id)&&!["quickroom","guidedroom"].includes(x.id)),"لا «جدار سريع» في الكتالوج (توحيد المدخل)");
 ok(leaf.filter(x=>/room/.test(x.id)&&x.id!=="roomdim").every(x=>CAT.itemAt("cat:draw",1).items.includes(x)),"وضعا الغرفة داخل مدخل «غرفة» وحده");
 const fam=CAT.CATALOG.flatMap(c=>c.items).filter(x=>x.t==="grp");
 ok(fam.every(g=>g.src==="tpl"||g.items.length>=2),"كلُّ عائلةٍ فيها عضوان فأكثر");
 const lab=leaf.filter(x=>x.t==="cmd").map(x=>[x,R.findTool(x.id)]).filter(([x,d])=>d&&x.n.length>0);
 eq(lab.length,leaf.filter(x=>x.t==="cmd").length,"كلُّ مدخلٍ له اسم");
 ok(CAT.itemAt("cat:draw",0).id==="wall","itemAt يعيد الأداة");
 eq(CAT.itemAt("cat:nope",0),null,"فئةٌ مجهولة ⇒ لا شيء");
});

h=await LIVE.mount({run:a=>runs.push(a)});
const tap=el=>h.refs.root.dispatchEvent({type:"click",target:el,preventDefault(){}});
/* مراجعةُ C: كان هذا الفحصُ يتخطّى أدواتِ التعديل بلا تحديد («تُعلِن ولا
   تبدأ») فيمرّ والأداةُ لا تُستعمَل من الكتالوج أصلاً. الآن كلُّ مدخلٍ يجب
   أن يفعل شيئاً بلمسته الثانية: أداةٌ تبدأ · فعلٌ يُستدعى · عائلةٌ تُفتح ·
   أو أداةُ تحديدٍ تتسلّح (تنتظر العناصرَ ثم ✓). */
await groupAsync("١٤ · كلُّ مدخلٍ في الكتالوج بلمستين (فئة ▸ مدخل)",async()=>{
 const refs=h.refs;
 let bad=[];
 CV.setSel([],null);
 CAT.CATALOG.forEach((c,ci)=>c.items.forEach((x,xi)=>{
  if(R.active())R.cancel(true);
  h.back(); h.closeSheet(); h.sync();
  tap(refs.bars.idle.querySelector(`[data-k="${c.k}"]`));
  if(refs.sheet.el.hidden){bad.push(c.k+"/"+x.id+": الورقة لم تُفتح");return}
  const tl=refs.sheet.body.querySelector(`[data-c="${c.k}"][data-x="${xi}"]`);
  if(!tl){bad.push(c.k+"/"+x.id+": لا مربّع");return}
  runs.length=0; lastRep="";
  tap(tl);
  if(x.t==="grp"){
   if(refs.sheet.el.hidden||!refs.sheet.body.querySelector(`[data-x="${xi}"][data-y="0"]`))bad.push(x.id+": العائلةُ لم تُفتح");
   else if(refs.sheet.head.textContent!==x.n)bad.push(x.id+": عنوانُ العائلة");
  }else if(x.t==="cmd"&&x.sel){
   if(R.active())bad.push(x.id+": بدأت بلا تحديد");
   else if(h.armed()!==x.id)bad.push(x.id+": لم تتسلّح");
   else if(!/انقر العناصر/.test(refs.top.innerHTML))bad.push(x.id+": الترويسةُ لا تقول ما المطلوب");
  }else if(x.t==="pane"){
   /* المرحلة D: ورقةُ لوحة تُفتح بلمستها الثانية */
   if(refs.sheet.el.hidden||h.pane()!==x.id)bad.push(x.id+": ورقةُ اللوحة لم تُفتح");
   else if(refs.sheet.head.textContent!==x.n)bad.push(x.id+": عنوانُ الورقة");
  }else if(x.t==="cmd"){
   if(!(R.active()&&R.T.id===x.id))bad.push(x.id+": لم تبدأ");
   else if(h.state()!=="tool")bad.push(x.id+": الحالة ليست أداة");
  }else{
   if(!(runs[0]&&runs[0].act===x.id))bad.push(x.id+": لم يُستدعَ الفعل");
  }
 }));
 eq(bad.length,0,"الأربعون كلُّها بلمستين"+(bad.length?" — "+bad.slice(0,6).join("، "):""));
 if(R.active())R.cancel(true);
 h.back(); h.closeSheet();
});

await groupAsync("١٤ب · العائلات: كلُّ عضوٍ يعمل، و«رجوع» إلى الفئة",async()=>{
 const refs=h.refs;
 const bad=[];
 const fams=[];
 CAT.CATALOG.forEach(c=>c.items.forEach((x,xi)=>{if(x.t==="grp")fams.push([c,x,xi])}));
 /* المرحلة D: «حفظ وتصدير» صارت ورقةَ التصدير (pane) لا عائلة */
 ok(fams.length>=5,`عائلاتٌ ${fams.length}`);
 for(const [c,g,xi] of fams){
  const mem=LIVE.membersOf(g);
  if(!mem.length){bad.push(g.id+": فارغة");continue}
  mem.forEach((m,j)=>{
   if(R.active())R.cancel(true);
   h.closeSheet();
   h.openSheet(c.k,"half",xi);
   const el=refs.sheet.body.querySelector(`[data-c="${c.k}"][data-x="${xi}"][data-y="${j}"]`);
   if(!el){bad.push(g.id+"/"+m.id+": لا مربّع");return}
   runs.length=0; lastRep="";
   const nW=(ST.S.walls||[]).length;
   tap(el);
   if(m.t==="cmd"){
    const on=R.active()&&R.T.id===m.id;
    /* معالجُ الغرفة لحظيٌّ: يفتح نافذتَه ولا يبقى فعّالاً */
    if(!on&&m.id!=="guidedroom")bad.push(m.id+": لم تبدأ");
    if(!refs.sheet.el.hidden)bad.push(m.id+": الورقةُ لم تُغلَق");
   }else if(m.t==="act"){
    if(!(runs[0]&&runs[0].act===m.id))bad.push(m.id+": لم يُستدعَ");
   }else if(m.t==="tpl"){
    if(!(/كياناً|مرفوض|تعذّر/.test(lastRep)))bad.push(m.id+": القالبُ لم يُنفَّذ — "+lastRep);
   }
  });
 }
 eq(bad.length,0,"كلُّ أعضاء العائلات تعمل"+(bad.length?" — "+bad.slice(0,6).join("، "):""));
 if(R.active())R.cancel(true);
 /* «‹ رجوع» والرجوعُ يعيدان إلى الفئة لا إلى القماش */
 h.closeSheet();
 h.openSheet("cat:add","half",5);
 tap(refs.sheet.body.querySelector('[data-m="up"]'));
 ok(!refs.sheet.el.hidden&&refs.sheet.head.textContent==="إضافة","«‹ رجوع» يعيد إلى الفئة");
 h.openSheet("cat:add","half",5);
 h.back();
 ok(!refs.sheet.el.hidden&&refs.sheet.head.textContent==="إضافة","زرُّ الرجوع من العائلة ⇒ الفئة");
 h.back();
 ok(refs.sheet.el.hidden,"ورجوعٌ ثانٍ يغلق الورقة");
 /* القوالبُ تُقرأ من presets.js نفسِها */
 const tpl=CAT.CATALOG.flatMap(c=>c.items).find(x=>x.src==="tpl");
 eq(LIVE.membersOf(tpl).length,PRESETS.TPL.length,"«قوالب» = TPL كلُّها، لا قائمةٌ ثانية");
 /* «غرفة»: مدخلٌ واحدٌ بوضعين (الخطّة: ارسم بالإصبع / بالأبعاد) */
 const room=CAT.itemAt("cat:draw",1);
 ok(room.t==="grp"&&room.items.map(x=>x.id).join(",")==="quickroom,guidedroom","«غرفة» = إصبع · معالج");
});

await groupAsync("١٤ج · التسلّح: أداةُ تعديلٍ بلا تحديد ⇒ حدِّد ثم ✓",async()=>{
 const refs=h.refs;
 if(R.active())R.cancel(true);
 CV.setSel([],null); h.closeSheet(); h.sync();
 R.H.sel=()=>CV.selList();
 R.begin("wall"); R.feedPoint([0,0]); R.feedPoint([4000,0]); R.cancel(true);
 const w=ST.S.walls[ST.S.walls.length-1];
 h.openSheet("cat:edit");
 tap(refs.sheet.body.querySelector('[data-c="cat:edit"][data-x="0"]'));
 eq(h.armed(),"move","«نقل» بلا تحديد ⇒ متسلّح");
 ok(refs.sheet.el.hidden,"والورقةُ أُغلقت ليُرى القماش");
 const go=()=>refs.top.querySelector('[data-k="armGo"]');
 ok(go()&&go().hasAttribute("disabled"),"✓ معطّلٌ قبل التحديد");
 tap(go()); ok(!R.active(),"✓ المعطّل لا يبدأ شيئاً");
 CV.setSel([{k:"wall",id:w.id}],{k:"wall",id:w.id}); h.sync();
 ok(go()&&!go().hasAttribute("disabled"),"✓ يُفعَّل مع التحديد");
 ok(/محدَّد: 1/.test(refs.top.innerHTML),"والترويسةُ تعدّ المحدَّد");
 eq(C.visibleBottom(refs),1,"وسطحٌ سفليٌّ واحد (شريطُ التحديد)");
 tap(go());
 ok(R.active()&&R.T.id==="move","✓ ⇒ «نقل» يبدأ بالتحديد");
 eq(h.armed(),null,"والتسلّحُ انتهى");
 R.cancel(true);
 /* الرجوعُ يُلغي التسلّح ويُبقي التحديد */
 h.openSheet("cat:edit");
 CV.setSel([],null);
 tap(refs.sheet.body.querySelector('[data-c="cat:edit"][data-x="2"]'));
 eq(h.armed(),"rotate","«تدوير» متسلّح");
 CV.setSel([{k:"wall",id:w.id}],{k:"wall",id:w.id}); h.sync();
 ok(h.back()&&h.armed()===null,"الرجوع ⇒ يُلغى التسلّح");
 eq(CV.selList().length,1,"والتحديدُ باقٍ");
 /* أداةٌ تبدأ مباشرةً حين يوجد تحديد */
 h.openSheet("cat:edit");
 tap(refs.sheet.body.querySelector('[data-c="cat:edit"][data-x="1"]'));
 ok(R.active()&&R.T.id==="copy","مع تحديدٍ قائم: «نسخ» تبدأ فوراً");
 R.cancel(true);
 /* ✕ يُلغي */
 CV.setSel([],null); h.openSheet("cat:edit");
 tap(refs.sheet.body.querySelector('[data-c="cat:edit"][data-x="7"]'));
 eq(h.armed(),"del","«حذف» متسلّح");
 tap(refs.top.querySelector('[data-k="armX"]'));
 eq(h.armed(),null,"✕ يُلغي");
 /* رسالةٌ واحدة لا اثنتان: لا «تحتاج تحديداً» ثابتةٌ فوق رسالة الأداة */
 const src=rd("src/shell/mobile/live.js");
 ok(!/تحتاج تحديداً أولاً/.test(src),"لا رسالةٌ عامّةٌ كاذبةٌ للأوامر اللحظيّة");
 /* أداةُ تحديدٍ من البحث تتسلّح كذلك (برسالة الأداة نفسِها) */
 CV.setSel([],null);
 h.openSearch();
 const q=refs.sheet.body.querySelector("[data-q]");
 q.value="مرآة"; q.dispatchEvent({type:"input",target:q,preventDefault(){}});
 q.dispatchEvent({type:"keydown",key:"Enter",target:q,preventDefault(){}});
 eq(h.armed(),"mirror","«مرآة» من البحث بلا تحديد ⇒ متسلّحة");
 h.back();
});

await groupAsync("١٥ · البحث: الكتابةُ تُصفّي، Enter يُنفّذ الأوّل، و«مؤخّراً» أعلاه",async()=>{
 const refs=h.refs;
 if(R.active())R.cancel(true);
 h.closeSheet(); h.sync();
 h.openSearch();
 const box=refs.sheet.body.querySelector("[data-res]");
 ok(/مؤخّراً|اكتب اسم أداة/.test(box.innerHTML),"بلا كتابة: «مؤخّراً» أو تلميحٌ");
 const q=refs.sheet.body.querySelector("[data-q]");
 q.value="جدار";
  q.dispatchEvent({type:"input",target:q,preventDefault(){}});
 ok(box.innerHTML.includes('data-p="0"'),"الكتابةُ تملأ النتائج");
 q.value="zzqqxx";
 q.dispatchEvent({type:"input",target:q,preventDefault(){}});
 ok(/لا شيء/.test(box.innerHTML),"بلا تطابق: رسالةٌ لا قائمةٌ فارغة");
 q.value="جدار";
 q.dispatchEvent({type:"input",target:q,preventDefault(){}});
 q.dispatchEvent({type:"keydown",key:"Enter",target:q,preventDefault(){}});
 ok(R.active(),"Enter ينفّذ أوّل نتيجة");
 if(R.active())R.cancel(true);
 h.closeSheet();
 /* «مؤخّراً»: الأداةُ المستعملة تصير أعلى القائمة */
 h.openSearch();
 const rec=refs.sheet.body.querySelector("[data-res]").innerHTML;
 ok(/مؤخّراً/.test(rec)&&/data-r="wall"/.test(rec),"«مؤخّراً» تحوي الجدار بعد استعماله");
 h.closeSheet();
});

group("١٦ · الوصول بالبحث لكلِّ أداةٍ مسجَّلة (≈١٥٠)",()=>{
 const tools=R.toolList().filter(d=>d&&d.id&&d.label);
 const miss=[];
 for(const d of tools){
  const hits=P_QUERY(d.label,12).map(x=>x.key);
  if(!hits.includes(d.id))miss.push(d.id);
 }
 const pct=Math.round(100*(tools.length-miss.length)/Math.max(1,tools.length));
 ok(tools.length>=100,`عددُ الأدوات المسجَّلة ${tools.length}`);
 ok(pct===100,`الأداةُ تُوجَد باسمها في أوّل ١٢ نتيجة: ${pct}%`+(miss.length?" — فاتت: "+miss.slice(0,8).join("، "):""));
});

const TB=await import("../shell/mobile/topbar.js");
group("١٧ · ↶ ↷ تُعطَّلان حين لا شيء",()=>{
 const T=TB;
 const on=T.topFor("idle",{undoOff:true,redoOff:false});
 ok(on.find(x=>x.k==="undo").off===true&&on.find(x=>x.k==="redo").off===false,"المعطّلُ منهما فقط");
});

group("١٨ · mobile.css يُشغّل الكتالوج دون !important",()=>{
 const css=rd("css/mobile.css").replace(/\/\*[\s\S]*?\*\//g,"");
 eq((css.match(/!important/g)||[]).length,0,"صفر !important (بعد المرحلة C)");
 ok(/\.mGrid/.test(css)&&/\.mQ/.test(css),"أنماطُ الشبكة والبحث موجودة");
});

summary();
