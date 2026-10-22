/* ═══ مراجعةُ المرحلة D · عيوبٌ أُصلحت (قشرة الهاتف) ═══
   ١ · وضعُ التبويب في الإرساء: القسمُ المخفيُّ بـhidden (ليس التبويبَ
       الحاليّ) كان يُنقَل إلى الورقة مخفيّاً ⇒ ورقةٌ فارغة. الآن يُكشَف
       ويعود مخفيّاً عند الإغلاق.
   ٢ · الإرساءُ مخفيٌّ بالتنسيق فكان panels.js يرسم كلَّ لوحاته على الهاتف
       مع كلّ تراجع ولا يراها أحد. الآن data-m-off ⇒ لا رسم، والورقةُ وحدها.
   ٣ · زرُّ وكالةٍ ترسمه لوحتُه (احذف المحدَّد · #pDel) يُرسَم قسراً قبل نقره.
   ٤ · قسمٌ غيرُ موجود: رسالةٌ لا صمت (كان يكمل إلى الإرساء المخفيّ).
   ٥ · ورقةُ الطوابق تتبع التغييرَ من خارجها (تراجع · فتح) وهي مفتوحة.
   ٦ · unmount يُزيل العلامة فيعود الحاسوبُ يرسم لوحاته.
   node src/tests/mobile-panes-review.test.js */
import {shim,shimCanvas,shimDOM,group,ok,eq,summary} from "./harness.js";
shim(); shimCanvas();
const doc=shimDOM();
for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status",
 "touchBar","optbar","log","side","sideE","cv"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
globalThis.confirm=globalThis.confirm||(()=>true);
for(const f of ["draw","openings","modify"])await import(`../tools/${f}.js`).catch(()=>{});
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
const LIVE=await import("../shell/mobile/live.js");

ST.newState();
PR.buildSide(); PR.wireForms(); PR.loadForms();
TB.initTouchBar();
const log=[];
HOOK.report=(c,m)=>log.push(String(m));
HOOK.refresh=()=>PR.refresh(false);
HOOK.props=()=>{PR.renderProps(); HOOK.shell(); TB.syncTouchBar()};
HOOK.prompt=()=>{TB.syncTouchBar(); HOOK.shell()};
R.H.draw=CV.draw; R.H.sel=()=>CV.selList(); R.H.setSel=l=>CV.setSel(l||[],null);
const run=spec=>{const a=AC.ACTIONS[spec.act]; return a?a.fn():false};

const h=await LIVE.mount({run});
const body=()=>h.refs.sheet.body;
const st=id=>PN.stats().find(p=>p.id===id)||{};

group("١ · قسمٌ مخفيٌّ بوضع التبويب يُكشَف في الورقة ويعود مخفيّاً",()=>{
 const lays=$('details.sec[data-sec="lays"]');
 lays.hidden=true;                       /* كما يفعل dock.js لغير التبويب الحاليّ */
 h.openPane("lays");
 ok(body().contains(lays),"القسمُ في الورقة");
 eq(lays.hidden,false,"وظاهرٌ فيها (لا ورقةَ فارغة)");
 ok(PN.visible("lays"),"وpanels.js يراه مرئيّاً فيرسمه");
 h.closeSheet();
 eq(lays.hidden,true,"وعند الإغلاق يعود مخفيّاً كما كان (التبويبُ لم يتغيّر)");
 lays.hidden=false;
});

group("٢ · الإرساءُ المخفيُّ لا يُرسَم على الهاتف",()=>{
 ok($("#side").hasAttribute("data-m-off"),"#side موسومٌ بالقشرة");
 eq(PN.visible("sched"),false,"جدولُ المساحات في الإرساء: غيرُ مرئيّ");
 const n0=st("sched").n;
 PN.markAllDirty(); PN.renderVisible(1);
 eq(st("sched").n,n0,"فلا يُعاد رسمُه مع التراجع/الفتح");
 h.openPane("qty");
 ok(st("sched").n>n0,"وفي ورقة الحصر يُرسَم");
 h.closeSheet();
});

group("٣ · زرُّ وكالةٍ ترسمه لوحتُه يُرسَم قبل نقره",()=>{
 const w=W.addWall([0,0],[4000,0],200,"int","c");
 CV.setSel([{k:"wall",id:w.id}],{k:"wall",id:w.id});
 const n0=st("props").n;
 eq(HOOK.shellPanel("props",{quiet:true}),true,"الوكالةُ بلا ورقة");
 ok(st("props").n>n0,"لكنّ لوحةَ الخصائص رُسمت قسراً");
 ok(!!$("#pDel"),"فزرُّ «احذف» موجود");
 const before=ST.S.walls.length;
 AC.ACTIONS.delSel.fn();
 eq(ST.S.walls.length,before-1,"و«احذف المحدَّد» من البحث يحذف فعلاً");
 CV.setSel([],null);
});

group("٤ · قسمٌ غيرُ موجود: رسالةٌ لا صمت",()=>{
 log.length=0;
 eq(HOOK.shellPanel("لا-قسم"),true,"القشرةُ تملك الكشف (لا رجوعَ إلى الإرساء المخفيّ)");
 ok(log.some(m=>/غير متاحة على الهاتف/.test(m)),"ويُقال للمستخدم");
 eq(h.state(),"idle","ولا ورقةَ فارغة");
});

group("٥ · ورقةُ الطوابق تتبع التغييرَ من خارجها",()=>{
 ST.S.meta.levels=[{n:0,name:"أرضي"},{n:1,name:"أوّل"}];
 ST.S.meta.level=0;
 h.openPane("levels");
 ok(/●/.test(body().querySelector('[data-lv="0"]').textContent),"الأرضيُّ نشط");
 ST.S.meta.level=1;                     /* تراجعٌ أو فتحٌ من خارج الورقة */
 HOOK.shell();
 ok(/●/.test(body().querySelector('[data-lv="1"]').textContent),"والمزامنةُ تنقل العلامة");
 const el=body().querySelector('[data-lv="1"]');
 HOOK.shell();
 eq(body().querySelector('[data-lv="1"]'),el,"وبلا تغيير لا يُعاد البناء (لا سرقةَ تركيز)");
 h.closeSheet();
 ST.S.meta.level=0;
});

group("٦ · unmount يُعيد الإرساءَ للحاسوب",()=>{
 h.unmount();
 eq($("#side").hasAttribute("data-m-off"),false,"العلامةُ أُزيلت");
 ok(PN.visible("sched")||!$("#sched")||!$('details.sec[data-sec="sched"]').open,"والإرساءُ مرئيٌّ لـpanels.js مجدّداً");
});

summary();
