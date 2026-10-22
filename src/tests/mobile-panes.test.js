/* ═══ المرحلة D من خطّة الهاتف: الخصائصُ والطبقاتُ والطوابقُ والتصديرُ والحصر ═══
   أوراقٌ سفليّةٌ تتبنّى قسمَ اللوحة الحيَّ نفسَه (props-sheet.js):
   ١ · الجدول: كلُّ قسمٍ له ورقة، وما ليس مُدرَجاً ورقةٌ باسمه
   ٢ · «خصائص» في شريط التحديد ⇒ ورقةُ الخصائص بالحقول نفسِها، والتعديلُ
       يمرّ بمُثبِّت props.js (المقبولُ يُكتَب والمرفوضُ لا)
   ٣ · الرجوعُ يغلقها ويُعيد القسمَ إلى موضعه وحالِه (لا أثرَ على الحاسوب)
   ٤ · revealSec (laysDlg …) ⇒ ورقة · وزرُّ الوكالة (xSave) يُنقَر بلا ورقة
   ٥ · الطوابق: صفوفٌ تبدّل الطابقَ النشط ومفتاحا «الكلّ» و«الشبح»
   ٦ · الحصر: جدولا المساحات والفتحات + التسعير وجدولُ الكميات
   ٧ · تبديلُ الورقة يُعيد المتبنّى قبل الكتابة · والنقرُ داخل القسم للوحة
   ٨ · سطحٌ سفليٌّ واحد في كلّ ورقة · unmount يُعيد كلَّ شيء
   ٩ · mobile.css: العرضُ العموديُّ الكبير تحت .mPane وبلا !important
   node src/tests/mobile-panes.test.js */
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {shim,shimCanvas,shimDOM,setVal,group,groupAsync,ok,eq,summary} from "./harness.js";
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const rd=p=>{try{return readFileSync(join(ROOT,p),"utf8")}catch(e){return ""}};

shim(); shimCanvas();
const doc=shimDOM();
for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status",
 "touchBar","optbar","log","side","sideE","cv"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
globalThis.confirm=globalThis.confirm||(()=>true);
for(const f of ["draw","openings","modify","boq"])await import(`../tools/${f}.js`).catch(()=>{});

const $=s=>doc.querySelector(s);
const ST=await import("../core/state.js");
const W =await import("../core/walls.js");
const R =await import("../tools/registry.js");
const CV=await import("../ui/canvas.js");
const PN=await import("../ui/panels.js");
const PR=await import("../ui/props.js");
const TB=await import("../ui/touchbar.js");
const AC=await import("../ui/actions.js");
const {HOOK}=await import("../ui/bus.js");
const PS=await import("../shell/mobile/props-sheet.js");
const C =await import("../shell/mobile/chrome.js");
const CAT=await import("../shell/mobile/catalog.js");
const LIVE=await import("../shell/mobile/live.js");

ST.newState();
PR.buildSide();
PR.wireForms();
PR.loadForms();
TB.initTouchBar();
const log=[];
HOOK.report=(c,m)=>log.push(String(m));
HOOK.refresh=()=>PR.refresh(false);
HOOK.props=()=>{PR.renderProps(); HOOK.shell(); TB.syncTouchBar()};
HOOK.prompt=()=>{TB.syncTouchBar(); HOOK.shell()};
R.H.draw=CV.draw; R.H.sel=()=>CV.selList(); R.H.setSel=l=>CV.setSel(l||[],null);
const runs=[];
const run=spec=>{runs.push(spec); const a=AC.ACTIONS[spec.act]; return a?a.fn():false};

group("١ · جدولُ الأوراق",()=>{
 for(const id of ["props","lays","levels","export","qty"])ok(!!PS.PANES[id],`ورقةُ «${id}» معلَنة`);
 eq(PS.paneOf("props"),"props","الخصائص ⇒ ورقتها");
 eq(PS.paneOf("sched"),"qty","جدولُ المساحات ⇒ الحصر");
 eq(PS.paneOf("osched"),"qty","وجدولُ الفتحات ⇒ الحصر");
 eq(PS.paneOf("sheet"),"proj","الورقةُ وبلوكُ العنوان ⇒ المشروع");
 eq(PS.paneOf("insp"),"sec:insp","قسمٌ غيرُ مُدرَج ⇒ ورقةٌ باسمه");
 eq(PS.paneOf(""),null,"لا قسم ⇒ لا ورقة");
 const secs=Object.values(PS.PANES).flatMap(p=>p.secs);
 const miss=secs.filter(s=>!$(`details.sec[data-sec="${s}"]`));
 eq(miss.length,0,"كلُّ قسمٍ مُدرَجٍ يبنيه props.js فعلاً"+(miss.length?" — "+miss:""));
 const def=PS.paneDef("sec:insp",doc);
 ok(def&&def.n==="الفاحص","وعنوانُ القسم المفرد من ملخّصه");
 const more=CAT.CATALOG.find(c=>c.k==="cat:more").items;
 ok(more.filter(x=>x.t==="pane").every(x=>PS.PANES[x.id]),"كلُّ pane في «المزيد» معلَنٌ في PANES");
 ok(["lays","levels","export","qty"].every(id=>more.some(x=>x.t==="pane"&&x.id===id)),"«المزيد»: الطبقات · الطوابق · التصدير · الحصر");
});

const h=await LIVE.mount({run});
const tap=el=>h.refs.root.dispatchEvent({type:"click",target:el,preventDefault(){}});
const tbTap=k=>{const b=$(`#touchBar [data-tb="${k}"]`); if(!b)return false; $("#touchBar").dispatchEvent({type:"click",target:b,preventDefault(){}}); return true};
const body=()=>h.refs.sheet.body;
const propsSec=$('details.sec[data-sec="props"]');
const home=propsSec.parentElement, homeNext=propsSec.nextSibling;

let w;
await groupAsync("٢ · «خصائص» في شريط التحديد ⇒ ورقةُ الخصائص",async()=>{
 w=W.addWall([0,0],[4000,0],200,"int","c");
 CV.setSel([{k:"wall",id:w.id}],{k:"wall",id:w.id});
 HOOK.props();
 eq(h.state(),"sel","تحديدٌ ⇒ شريطُ التحديد");
 ok(tbTap("props"),"زرُّ «خصائص» في #touchBar");
 eq(h.state(),"sheet","فتُفتح ورقة");
 eq(h.pane(),"props","ورقةُ الخصائص");
 eq(h.refs.sheet.head.textContent,"الخصائص","بعنوانها");
 ok(body().contains(propsSec),"القسمُ الحيُّ نفسُه في الورقة (تبنٍّ لا نسخة)");
 ok(propsSec.open,"ومفتوح");
 const fT=body().querySelector('#props [data-p="t"]');
 ok(!!fT,"حقلُ السماكة مرسومٌ داخل الورقة (panels يراه مرئيّاً)");
 eq(C.visibleBottom(h.refs),1,"سطحٌ سفليٌّ واحد: الورقة");
 setVal(fT,"0.30");
 eq(w.t,300,"التعديلُ من الورقة يُكتَب بمُثبِّت props.js");
 setVal(body().querySelector('#props [data-p="t"]'),"سلام");
 eq(w.t,300,"والمرفوضُ لا يُكتَب");
 ok(/ليس طولاً/.test($("#log").textContent),"ويُقال سببُه كما على الحاسوب");
 /* النقرُ داخل القسم للوحة: data-p هنا حقلٌ لا نتيجةُ بحث */
 const before=h.state();
 tap(body().querySelector('#props [data-p="t"]'));
 eq(h.state(),before,"لمسُ حقلٍ لا يُغلق الورقة ولا يُنفّذ شيئاً");
 eq(h.pane(),"props","والورقةُ باقية");
});

group("٣ · الرجوعُ يُغلق ويُعيد القسمَ إلى موضعه",()=>{
 ok(h.back(),"الرجوعُ يُغلق الورقة");
 eq(h.state(),"sel","فيعود شريطُ التحديد");
 eq(propsSec.parentElement,home,"القسمُ عاد إلى أبيه");
 eq(propsSec.nextSibling,homeNext,"وإلى موضعه بين إخوته");
 eq(h.pane(),null,"ولا ورقةَ لوحة");
 CV.setSel([],null); HOOK.props();
 eq(h.state(),"idle","وبلا تحديد ⇒ خامل");
});

group("٤ · revealSec ⇒ ورقة · وزرُّ الوكالة بلا ورقة",()=>{
 const lays=$('details.sec[data-sec="lays"]'), lHome=lays.parentElement;
 const wasOpen=lays.open;
 AC.ACTIONS.laysDlg.fn();
 eq(h.pane(),"lays","laysDlg ⇒ ورقةُ الطبقات");
 ok(body().contains(lays)&&!!body().querySelector("#lays"),"قسمُ الطبقات الحيّ");
 ok(!!body().querySelector("#lAll"),"وأزرارُه بمستمعيها");
 h.closeSheet();
 eq(lays.parentElement,lHome,"ويعود");
 eq(lays.open,wasOpen,"بحاله (مفتوحاً كان أو مطويّاً)");
 /* projDlg ⇒ المشروع + الورقة وبلوك العنوان */
 AC.ACTIONS.projDlg.fn();
 eq(h.pane(),"proj","projDlg ⇒ ورقةُ المشروع");
 ok(!!body().querySelector("#mName")&&!!body().querySelector("#shSize"),"المشروعُ والورقةُ معاً");
 h.closeSheet();
 /* قسمٌ غيرُ مُدرَج */
 AC.revealSec("insp");
 eq(h.pane(),"sec:insp","الفاحص ⇒ ورقةٌ باسمه");
 ok(!!body().querySelector("#bInsp"),"وفيها زرُّه");
 h.closeSheet();
 /* الوكالة: زرُّ #xSave يُنقَر في مكانه، ولا ورقةَ تُفتح فوق القماش */
 let saved=0;
 const xs=$("#xSave"); const prev=xs.onclick; xs.onclick=()=>{saved++};
 AC.ACTIONS.xSave.fn();
 eq(saved,1,"«احفظ المشروع» يُنفَّذ");
 eq(h.state(),"idle","بلا ورقة");
 xs.onclick=prev;
});

group("٥ · الطوابق",()=>{
 ST.S.levelDefs=[{n:0,name:"أرضي"},{n:1,name:"الأوّل"}];
 ST.S.meta.level=0;
 h.openPane("levels");
 eq(h.refs.sheet.head.textContent,"الطوابق","ورقةُ الطوابق");
 const rows=body().querySelectorAll("[data-lv]");
 eq(rows.length,2,"صفٌّ لكلّ طابق");
 ok(/●/.test(body().querySelector('[data-lv="0"]').textContent),"النشطُ مُعلَم");
 tap(body().querySelector('[data-lv="1"]'));
 eq(ST.S.meta.level,1,"لمسةٌ ⇒ الطابقُ النشط");
 ok(/●/.test(body().querySelector('[data-lv="1"]').textContent),"والعلامةُ انتقلت");
 eq(h.state(),"sheet","والورقةُ باقية");
 const a0=+ST.S.opt.levelAll||0;
 tap(body().querySelector('[data-lvo="all"]'));
 eq(+ST.S.opt.levelAll,a0?0:1,"«كل الطوابق» يتبدّل");
 const g0=+ST.S.opt.ghost||0;
 tap(body().querySelector('[data-lvo="ghost"]'));
 eq(+ST.S.opt.ghost,g0?0:1,"و«الشبح»");
 runs.length=0;
 tap(body().querySelector('[data-a="levelMgrDlg"]'));
 eq(runs[0]&&runs[0].act,"levelMgrDlg","«إدارة الطوابق» = levelMgrDlg نفسُه");
 eq(h.state(),"idle","وتُغلَق الورقةُ لنافذته");
 ST.S.meta.level=0;
});

group("٦ · الحصر والتسعير",()=>{
 h.openPane("qty");
 eq(h.refs.sheet.head.textContent,"حصر وتسعير","ورقةُ الحصر");
 ok(!!body().querySelector("#sched")&&!!body().querySelector("#osched"),"جدولا المساحات والفتحات");
 ok(!!body().querySelector("#bAsCsv"),"وتصديرُهما CSV");
 runs.length=0;
 const pr=body().querySelector('[data-a="pricingDlg"]');
 ok(!!pr,"زرُّ التسعير في رأس الورقة");
 h.openPane("qty");
 const bq=body().querySelector('[data-t="boq"]');
 ok(!!bq,"وجدولُ الكميات");
 if(R.findTool("boq")){
  tap(bq);
  ok(h.state()!=="sheet","جدولُ الكميات يُنفَّذ والورقةُ تُغلَق");
  if(R.active())R.cancel(true);
 }else ok(true,"(أداةُ boq غير مسجّلة في هذه البيئة)");
 h.openPane("qty");
 tap(body().querySelector('[data-a="pricingDlg"]'));
 eq(runs[0]&&runs[0].act,"pricingDlg","التسعير = pricingDlg نفسُه");
});

group("٧ · تبديلُ الورقة يُعيد المتبنّى قبل الكتابة",()=>{
 const ex=$('details.sec[data-sec="export"]'), exHome=ex.parentElement;
 h.openPane("export");
 ok(body().contains(ex)&&!!body().querySelector("#xDpi"),"التصديرُ بخياراته (الدقّة · الخلفية · كل الأوراق)");
 h.openSheet("cat:draw");
 eq(ex.parentElement,exHome,"فتحُ فئةٍ فوقها يُعيد قسمَ التصدير أوّلاً");
 ok(!!$("#xSave"),"و#xSave حيٌّ في الصفحة (لم يُمحَ بـinnerHTML)");
 h.openPane("export");
 h.openPane("lays");
 eq(ex.parentElement,exHome,"ورقةٌ فوق ورقة: الأولى تعود");
 h.openSearch();
 ok(!body().querySelector('details.sec'),"البحثُ لا يحمل أقساماً");
 h.closeSheet();
 const all=[...doc.querySelectorAll("details.sec")];
 ok(all.every(d=>$("#side").contains(d)||$("#sideE").contains(d)),"وكلُّ قسمٍ في الإرساء بعد الإغلاق");
});

group("٨ · سطحٌ سفليٌّ واحد في كلّ ورقة · و«المزيد» بلمستين",()=>{
 const bad=[];
 for(const id of Object.keys(PS.PANES)){
  h.openPane(id);
  if(C.visibleBottom(h.refs)!==1)bad.push(id);
  if(!h.refs.top.hidden)bad.push(id+": الترويسة");
 }
 eq(bad.length,0,"كلُّ ورقةٍ سطحٌ واحد"+(bad.length?" — "+bad:""));
 h.closeSheet();
 const more=h.refs.bars.idle.querySelector('[data-k="cat:more"]');
 tap(more);
 const i=CAT.CATALOG.find(c=>c.k==="cat:more").items.findIndex(x=>x.id==="export");
 tap(body().querySelector(`[data-c="cat:more"][data-x="${i}"]`));
 eq(h.pane(),"export","«المزيد» ▸ «حفظ وتصدير» = لمستان");
 ok(!!body().querySelector("#xSave"),"و«احفظ المشروع» فيها");
 h.closeSheet();
});

group("٩ · unmount",()=>{
 h.openPane("props");
 h.unmount();
 eq(propsSec.parentElement,home,"ورقةٌ مفتوحةٌ عند الفكّ: قسمُها يعود");
 eq(HOOK.shellPanel("lays"),false,"وHOOK.shellPanel عاد بلا أثر");
});

group("١١ · دوالُّ props-sheet مباشرةً",()=>{
 const rows=PS.levelRowsNow(ST.S);
 ok(rows.length>=1&&rows.every(r=>Number.isFinite(r.n)&&typeof r.name==="string"),"levelRowsNow: صفٌّ لكلّ طابق باسمه");
 ok(rows.some(r=>r.on),"وأحدُها النشط");
 eq(PS.setLevel(0),false,"setLevel: الطابقُ النشطُ أصلاً لا يُكتَب");
 eq(PS.setLevel(1),true,"setLevel: طابقٌ آخر يُكتَب");
 eq(ST.S.meta.level,1,"والنشطُ صار 1");
 eq(PS.setLevel("x"),false,"setLevel: قيمةٌ غير رقمية تُرفَض");
 ST.S.meta.level=0;
 eq(PS.toggleLevelOpt("nope"),null,"toggleLevelOpt: مفتاحٌ غريبٌ لا شيء");
 const a0=!!+ST.S.opt.levelAll;
 eq(PS.toggleLevelOpt("all"),!a0,"toggleLevelOpt: «الكلّ» يُقلب ويُعيد حالته");
 PS.toggleLevelOpt("all");
 const html=PS.paneShell(PS.paneDef("levels",doc));
 ok(/mPane/.test(html)&&/data-own="levels"/.test(html)&&/data-pane-host/.test(html),"paneShell: الحاضنُ والأصحابُ");
 ok(/data-a="levelMgrDlg"/.test(html),"وإدارةُ الطوابق فيها");
 const probe=doc.createElement("div");
 probe.innerHTML=`<section id="px"><details class="sec" data-sec="zz"><summary>ز</summary><p>ح</p></details></section>`;
 doc.body.appendChild(probe);
 const host=doc.createElement("div"); doc.body.appendChild(host);
 const d=doc.querySelector('details.sec[data-sec="zz"]');
 const got=PS.adopt(doc,host,["zz","غائب"]);
 eq(got.length,1,"adopt: يتبنّى القسمَ الموجود ويتخطّى الغائب");
 ok(host.contains(d)&&d.open,"ينقله إلى الحاضن ويفتحه");
 eq(PS.release(got),1,"release: يعيده ويُرجع عددَه");
 ok(probe.contains(d),"إلى أبيه الأصليّ");
 eq(PS.release(got),0,"وصفرٌ بعد ذلك");
 const body2=doc.createElement("div"); body2.innerHTML=PS.paneShell(PS.paneDef("levels",doc));
 ok(PS.refreshLevels(body2),"refreshLevels: يُعيد رسمَ صفوف الطوابق");
 eq(PS.refreshLevels(doc.createElement("div")),false,"وبلا صفوفٍ يقول لا");
});

group("١٠ · mobile.css",()=>{
 const css=rd("css/mobile.css").replace(/\/\*[\s\S]*?\*\//g,"");
 eq((css.match(/!important/g)||[]).length,0,"صفر !important");
 ok(/\.mPaneHost \.row2[\s\S]*?flex-direction:column/.test(css),"الحقولُ عموديّة");
 ok(/\.mPaneHost input[^{]*\{[^}]*min-block-size:48px/.test(css),"وبارتفاع ٤٨ للّمس");
 ok(/\.mPaneHost input[^{]*\{[^}]*font-size:16px/.test(css),"و١٦ بكسلاً (لا تكبيرَ تلقائيّ)");
 ok(/#side,\s*html\[data-shell-active="mobile"\] #sideE/.test(css),"والإرساءُ لا يُرى على الهاتف");
});

summary();
