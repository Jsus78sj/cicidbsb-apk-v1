/* ═══ المرحلة D · معيارُ الإنجاز: السيناريو الكامل على قشرة الهاتف ═══
   الخطّة: «سيناريو phone-e2e (غرفة ٤×٥ + باب + حفظ) يمرّ على القشرة
   الجديدة بأقلّ من ١٧ لمسة».
   كلُّ لمسةٍ هنا على ما يراه المستخدم في القشرة: الشريطُ السفليّ (الفئات)،
   مربّعاتُ الورقة، #touchBar المتبنّى (حقلا القياس · ✕)، القماش، وزرُّ
   «احفظ المشروع» داخل ورقة التصدير. **ولا حدثَ لوحة مفاتيح**، ولا نداءَ
   مباشرٌ لأداةٍ أو فعل. والحقلُ يُعَدّ لمسة (كما في phone-e2e.test.js:
   حقلٌ + حقلٌ + «طبّق» = ٣)، والحفظُ يُفتَح كما هو (toJSON ⇒ fromJSON).
   node src/tests/phone-e2e-shell.test.js */
import {shim,shimCanvas,shimDOM,fire,group,groupAsync,ok,eq,summary} from "./harness.js";
shim(); shimCanvas();
const doc=shimDOM();
for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status",
 "touchBar","optbar","log","side","sideE","cv"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
for(const f of ["draw","openings","modify","quickroom"])await import(`../tools/${f}.js`);
const $=s=>doc.querySelector(s);
const ST=await import("../core/state.js");
const R =await import("../tools/registry.js");
const CV=await import("../ui/canvas.js");
const PR=await import("../ui/props.js");
const TB=await import("../ui/touchbar.js");
const AC=await import("../ui/actions.js");
const PJ=await import("../io/project.js");
const {HOOK}=await import("../ui/bus.js");
const LIVE=await import("../shell/mobile/live.js");
const C =await import("../shell/mobile/chrome.js");

let keys=0;
const kd=()=>keys++;
doc.addEventListener("keydown",kd);

ST.newState();
PR.buildSide(); PR.wireForms(); PR.loadForms();
TB.initTouchBar();
CV.V.w=390; CV.V.h=560; CV.V.dpr=1; CV.V.k=0.05; CV.V.cx=2000; CV.V.cy=2500;
R.loadOpts();
ST.S.rb.snap=0; ST.S.rb.grid=0;
R.H.draw=CV.draw; R.H.hit=(x,y,k)=>CV.hitTest(x,y,k);
R.H.sel=()=>CV.selList(); R.H.setSel=l=>CV.setSel(l||[],null);
R.H.prompt=()=>{TB.syncTouchBar(); HOOK.shell()};
HOOK.prompt=()=>{TB.syncTouchBar(); HOOK.shell()};
HOOK.props=()=>{PR.renderProps(); HOOK.shell(); TB.syncTouchBar()};
HOOK.refresh=()=>PR.refresh(false);
/* «احفظ المشروع»: المعالجُ نفسُه في inspector.js يُنزّل ملفّاً؛ هنا يلتقط النصّ */
let saved=null;
$("#xSave").onclick=()=>{saved=PJ.toJSON()};
const h=await LIVE.mount({run:spec=>{const a=AC.ACTIONS[spec.act]; return a?a.fn():false}});

let taps=0;
const tapEl=(el,what)=>{
 if(!el)throw new Error("لا زرَّ: "+what);
 if(el.disabled)throw new Error("معطّل: "+what);
 taps++;
 if($("#touchBar").contains(el))$("#touchBar").dispatchEvent({type:"click",target:el,preventDefault(){}});
 else if(h.refs.root.contains(el)&&!el.closest("[data-pane-host]"))h.refs.root.dispatchEvent({type:"click",target:el,preventDefault(){}});
 else el.click();
};
const cat=k=>tapEl(h.refs.bars.idle.querySelector(`[data-k="${k}"]`),k);
const tile=label=>tapEl([...h.refs.sheet.body.querySelectorAll(".mTile")].find(b=>b.textContent.trim()===label),label);
const tb=k=>tapEl($(`#touchBar [data-tb="${k}"]`),k);
const field=(i,v)=>{const el=$(`#touchBar [data-tm="${i}"]`); if(!el)throw new Error("لا حقل "+i); taps++; el.value=v};
const cv=$("#cv");
const tapAt=(wx,wy)=>{
 const s=CV.W2S(wx,wy);
 const ev={pointerType:"touch",pointerId:100+taps,offsetX:s[0],offsetY:s[1],clientX:s[0],clientY:s[1],button:0};
 fire(cv,"pointerdown",ev); fire(cv,"pointerup",ev); taps++;
 HOOK.shell();
};

group("١ · غرفة ٤×٥: رسم ▸ غرفة ▸ بالإصبع ▸ ركن ▸ العرض والطول",()=>{
 eq(h.state(),"idle","يبدأ خاملاً");
 cat("cat:draw");
 eq(h.state(),"sheet","«رسم» تفتح ورقتها");
 tile("غرفة");
 tile("ارسم بالإصبع");
 eq(R.active()&&R.T.id,"quickroom","«غرفة سريعة» نشطة");
 eq(h.state(),"tool","وحالةُ الأداة");
 ok(h.refs.bars.tool.contains($("#touchBar")),"وشريطُ اللمس متبنًّى");
 tapAt(0,0);
 eq(R.T.ctx.pts.length,1,"الركنُ الأوّل من لمسة");
 TB.syncTouchBar();
 const ks=[...doc.querySelectorAll("#touchBar [data-tm]")].map(e=>e.getAttribute("aria-label")||"");
 ok(ks.length===2&&/العرض/.test(ks[0])&&/الطول/.test(ks[1]),"بعد الركن: حقلا العرض والطول (لا طولٌ وزاوية)");
 field(0,"4"); field(1,"5"); tb("apply");
 eq(ST.S.walls.length,4,"أربعةُ جدران");
 const L=ST.S.walls.map(w=>Math.round(Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]))).sort((a,b)=>a-b);
 eq(L.join(","),"4000,4000,5000,5000","٤ · ٤ · ٥ · ٥ م بالضبط");
 eq(ST.S.areas.length,1,"ومنطقةُ الغرفة");
 tb("esc");
 ok(!R.active(),"✕ يُنهي الأداة");
 HOOK.shell();
 eq(h.state(),"idle","فيعود الخامل");
});

group("٢ · باب: إضافة ▸ باب ▸ الجدار السفليّ ▸ ✕",()=>{
 cat("cat:add");
 tile("باب");
 eq(R.active()&&R.T.id,"door","أداةُ الباب");
 tapAt(2000,0);
 eq(ST.S.opens.length,1,"بابٌ واحد");
 eq(ST.S.opens[0].kind,"door","من نوع باب");
 if(R.active())tb("esc");
 ok(!R.active(),"والأداةُ انتهت");
 HOOK.shell();
});

group("٣ · الحفظ: المزيد ▸ حفظ وتصدير ▸ احفظ المشروع",()=>{
 cat("cat:more");
 tile("حفظ وتصدير");
 eq(h.pane(),"export","ورقةُ التصدير");
 eq(C.visibleBottom(h.refs),1,"سطحٌ سفليٌّ واحد");
 tapEl(h.refs.sheet.body.querySelector("#xSave"),"احفظ المشروع");
 ok(typeof saved==="string"&&saved.length>100,"ملفُّ مشروع");
 ST.newState();
 eq(ST.S.walls.length,0,"مشروعٌ فارغ");
 PJ.fromJSON(saved);
 eq(ST.S.walls.length,4,"الفتحُ يعيد الجدران الأربعة");
 eq(ST.S.opens.length,1,"والباب");
 h.closeSheet();
});

group("٤ · المعيار",()=>{
 eq(keys,0,"صفرُ حدثِ لوحة مفاتيح");
 ok(taps<17,`${taps} لمسةً للغرفة والباب والحفظ على القشرة الجديدة (الحدّ: أقلّ من ١٧)`);
 console.log(`   اللمسات: ${taps}`);
});
h.unmount();
summary();
