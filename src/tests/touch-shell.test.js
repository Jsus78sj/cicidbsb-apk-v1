/* ═══ قشرةُ الهاتف واللمس ═══ المرحلة F من docs/MOBILE-PLAN.md
   كانت سبعةَ ملفّات (touch-phase1 … 8، ولا ٤) لمراحلِ «الهاتف بالواجهة
   المكتبية». دُمجت هنا، وكلُّ فحصٍ كان يقرأ كتلةَ هاتفٍ في touch.css صار
   يقرأ مصدرَها الوحيد اليوم: css/mobile.css وقشرةَ src/shell/mobile.
   والسلوكُ (شريطُ اللمس · القياس · الإصبع · القرص · التحديد · التنبيه)
   كما هو: تستعمله القشرةُ نفسُه.
     ١ · أزرارُ الرسم ✓ ⭘ ↶ ✕ · البطاقة · البحث · رسائلُ بلا مفاتيح · الإصبع
     ٢ · وضعُ الرسم · حقلا الطول والزاوية · لوحةُ المفاتيح · العدسة
     ٣ · الشريطُ و«المزيد» · المبتدئ · الجولة · زرُّ المساعدة · الرجوع
     ٥ · ⚙ المساعدات · إصبعان · قائمةُ الضغط المطوّل
     ٦ · الأداء: طبقةُ المخطّط المحفوظة · القرص
     ٧ · آخرُ طول · العدسةُ تسمّي · الاهتزاز · الأفقيّ
     ٨ · شريطُ التحديد · الترويسة · السجلُّ تنبيهاً
   التشغيل:  node src/tests/touch-shell.test.js                       */
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {shim,shimCanvas,shimDOM,fire,group,ok,eq,near,summary} from "./harness.js";
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const rd=p=>{try{return readFileSync(join(ROOT,p),"utf8")}catch(e){return ""}};
const TC=rd("css/touch.css"), MC=rd("css/mobile.css"), HTML=rd("index.html");
const LV=rd("src/shell/mobile/live.js");
const block=(css,q)=>{
 const i=css.indexOf(q); if(i<0)return "";
 let d=0,k=css.indexOf("{",i),s=k;
 for(;k<css.length;k++){ if(css[k]==="{")d++; else if(css[k]==="}"){d--; if(!d)break} }
 return css.slice(s,k+1);
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

shim(); shimCanvas();
const doc=shimDOM();
for(const id of ["touchBar","optbar","cv","thumb","recent","dynBox","ribbon","tour"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
for(const f of ["draw","openings","modify","annotate"])await import(`../tools/${f}.js`);
const R =await import("../tools/registry.js");
const TT=await import("../ui/touchtext.js");
const TB=await import("../ui/touchbar.js");
const DY=await import("../ui/dyninput.js");
const CV=await import("../ui/canvas.js");
const ST=await import("../core/state.js");
const BUS=await import("../ui/bus.js");
const {HOOK}=BUS;
const RN=await import("../ui/ribbon/render.js");
const FD=await import("../ui/fabdrag.js");
const BN=await import("../ui/backnav.js");
const TR=await import("../ui/tour.js");
const STO=await import("../ui/store.js");
const TO=await import("../ui/toast.js");
const SEL=await import("../shell/select.js");
const CAT=await import("../shell/mobile/catalog.js");

/* ════════ المرحلة 1 ════════ */
group("٤ · رسائلُ الهاتف بلا مفاتيح",()=>{
 const t=s=>TT.touchText(s,true);
 eq(t("احفظ المشروع ملفّاً (Ctrl+S) احتياطاً، ورسمك سليم."),
  "احفظ المشروع ملفّاً احتياطاً، ورسمك سليم.","القوسُ حول الاختصار يُحذَف بقوسه");
 eq(t("ماكرو · 3 سطراً — Ctrl+Z يتراجع عنه كلّه"),
  "ماكرو · 3 سطراً — ↶ يتراجع عنه كلّه","Ctrl+Z يصير زرَّ التراجع");
 eq(t("Ctrl+Shift+Z"),"↷","Ctrl+Shift+Z قبل Ctrl+Z");
 eq(t("جدار · Esc يلغي"),"جدار · ✕ يلغي","Esc يصير زرَّ الإلغاء");
 eq(t("لوحة السجل · Ctrl+Shift+H · قفز"),"لوحة السجل · قفز","المقطعُ بلا مقابلٍ يُحذَف بفاصله");
 eq(t("نقطتان لكل جدار · C يغلق · Enter ينهي السلسلة · Esc يخرج · U يتراجع"),
  "نقطتان لكل جدار · ⭘ يغلق · ✓ ينهي السلسلة · ✕ يخرج · ↶ يتراجع","وتلميحُ الأداة يسمّي الأزرار");
 eq(t("نصٌّ عاديّ بلا مفاتيح"),"نصٌّ عاديّ بلا مفاتيح","ما لا مفتاحَ فيه لا يُمَسّ");
 const s="احفظ (Ctrl+S) · Esc يلغي";
 eq(TT.touchText(s,false),s,"وعلى الحاسوب يبقى النصُّ حرفاً");
 ok(/touchText\(msg\)/.test(rd("src/ui/props.js")),"rep() يمرّر رسائلَ السجلّ بالمرشّح");
 ok(/eInfo=m=>[^\n]*touchText/.test(rd("src/ui/props.js")),"وeInfo كذلك");
 const app=rd("src/app.js");
 ok(/const p=touchText\(/.test(app)&&/const h=touchText\(/.test(app),
  "وموجِّهُ سطر الأوامر وتلميحُ الحالة");
});

group("١ · أزرار الرسم: ما يظهر",()=>{
 eq(TB.barFor(null,null).length,0,"لا أداة ⇒ لا أزرار");
 const ks=L=>L.map(x=>x.k).join(",");
 eq(ks(TB.barFor({id:"x"},{loop:1,opts:{c:{n:"إغلاق"},u:{n:"تراجع"}}})),
  "ok,close,undo,aids,esc","سلسلةٌ تقبل الإغلاق ⇒ الأربعة + ⚙ (المرحلة ٥)");
 eq(ks(TB.barFor({id:"x"},{p:"نقطة"})),"undo,aids,esc",
  "خطوةُ نقطةٍ واحدة ⇒ لا «إنهاء» يَعِد بما لا يفعل");
 eq(ks(TB.barFor({id:"x"},{confirm:1})),"ok,undo,aids,esc","خطوةُ تأكيد ⇒ «إنهاء»");
});

group("١ · أزرار الرسم: مسارُ المفاتيح نفسُه",()=>{
 R.loadOpts(); R.setOpt("wall","chain",1);
 R.begin("wall");
 ok(R.active(),"الجدار فعّال");
 TB.syncTouchBar();
 ok(doc.documentElement.classList.contains("cdDraw"),"html.cdDraw أثناء الأداة");
 R.feedPoint([0,0]); R.feedPoint([4000,0]); R.feedPoint([4000,3000]);
 const n0=ST.S.walls.length;
 ok(n0>=2,"جداران مرسومان");
 TB.runTouch("undo");
 eq(ST.S.walls.length,n0-1,"↶ يتراجع خطوةً داخل الأداة (U)");
 R.feedPoint([4000,3000]); R.feedPoint([0,3000]);
 const st=R.step();
 ok(st&&st.opts&&st.opts.c,"الخطوةُ تعرض الإغلاق");
 const n1=ST.S.walls.length;
 TB.runTouch("close");
 ok(ST.S.walls.length>n1,"⭘ يغلق الشكل (C)");
 if(R.active())TB.runTouch("esc");
 ok(!R.active(),"✕ يُنهي الأداة (Esc)");
 TB.syncTouchBar();
 ok(!doc.documentElement.classList.contains("cdDraw"),"وتُرفَع html.cdDraw");
 eq(TB.runTouch("???"),false,"مفتاحٌ مجهول لا يفعل شيئاً");
});

group("١ · أزرار الرسم: الصفحة والتنسيق",()=>{
 ok(/id="touchBar"[^>]*role="toolbar"/.test(HTML),"#touchBar في الصفحة بدور شريط أدوات");
 ok(/#touchBar\{display:none\}/.test(TC),"مخفيٌّ افتراضاً (الحاسوب)");
 ok(/html\.cdDraw #touchBar\{/.test(TC),"ويظهر أثناء الأداة وحدها");
 const b=block(TC,"#touchBar .tbB button{");
 ok(/block-size:48px/.test(b),"أهدافٌ بارتفاع ٤٨ بكسلاً");
 ok(/html\[data-shell-active="mobile"\] \.mBar #touchBar\{/.test(MC),"وفي القشرة يُتبنّى محتوى الشريط السفليّ");
 ok(/block-size:48px/.test(block(MC,'html[data-shell-active="mobile"] #touchBar .tbB button{')),"بأهدافِ ٤٨ بكسلاً مهما كان المؤشّر");
 ok(/syncTouchBar\(\)/.test(rd("src/app.js")),"syncPrompt يزامنه");
 ok(/touchbar\.js/.test(rd("sw.js")),"وفي قائمة العامل دون اتصال");
});

group("٢ · بطاقةُ الخيارات: الطيُّ والقشرة",()=>{
 const ob=rd("src/ui/optbar.js");
 ok(/id="obFold"/.test(ob),"زرُّ الطيّ يُبنى");
 ok(/data(set)?\.fold|dataset\.fold/.test(ob),"والحالةُ سمةٌ data-fold");
 ok(/if\(foldTool!==d\.id\)\{fold=true/.test(ob),"كلُّ أداةٍ جديدةٍ تبدأ مطويّة");
 ok(/t\.id==="cv"\)setFold\(true\)/.test(ob),"ولمسةُ اللوح تطويها");
 ok(/#obFold\{display:none\}/.test(TC),"الزرُّ لا يُرى على الحاسوب");
 /* المرحلة F: الطيُّ كان للهاتف بالمكتبية؛ في القشرة البطاقةُ مخفيّة وصفُّ
    القياس في الشريط السفليّ يحلّ محلّها */
 ok(!/data-fold="1"/.test(TC),"لا قاعدةَ طيٍّ في touch.css");
 ok(/html\[data-shell-active="mobile"\] #optbar\{display:none\}/.test(MC),"وفي القشرة البطاقةُ لا تُرى");
});

group("٣ · بحثٌ واحد",()=>{
 const am=rd("src/ui/appmenu.js");
 ok(/paletteQuery/.test(am)&&/paletteExec/.test(am),"قائمةُ التطبيق تسأل فهرسَ اللوحة وتنفّذ بمنفّذها");
 ok(!/type==="cmd"/.test(am),"ولا ترشيحَ للأدوات وحدها");
 const pl=rd("src/ui/palette.js");
 ok(/key:"app\.clean",label:"شاشة نظيفة"/.test(pl),"و«شاشة نظيفة» في ذلك الفهرس");
});

group("٥ · نطاقُ الإصبع",()=>{
 const cv=rd("src/ui/canvas.js");
 ok(/TOL=\{snap:\[16,28\],pick:\[14,22\],grip:\[8,22\]\}/.test(cv),"جدولٌ واحدٌ: فأرة/لمس");
 ok(/const tol=tolPx\("snap"\)/.test(cv),"الالتقاطُ منه");
 ok(!/14\/V\.k/.test(cv),"ولا ١٤ ثابتةٌ في الإبراز: المُبرَزُ هو ما يُلتقَط");
});

/* ════════ المرحلة 2 ════════ */
group("٣ · التركيبُ من حقلين",()=>{
 const F=[{k:"L"},{k:"a"}];
 eq(DY.composeVals(F,["5","45"]),"@5<45","طولٌ وزاوية ⇒ الصيغةُ نفسُها لسطر الأوامر");
 eq(DY.composeVals(F,["3.2",""]),"3.2","طولٌ وحدَه ⇒ على الاتجاه الجاري");
 eq(DY.composeVals(F,["","90"]),"<90","زاويةٌ وحدَها ⇒ قفل");
 eq(DY.composeVals(F,["",""]),"","فارغان ⇒ لا شيء");
 eq(DY.composeVals([{k:"x"},{k:"y"}],["2",""]),"2,0","نقطةُ البداية: س وص");
 eq(DY.composeVals([{k:"a"}],["30"]),"30","خطوةُ زاويةٍ وحدَها");
});

group("٣ · الحقلان في شريط اللمس يرسمان",()=>{
 R.loadOpts(); R.setOpt("wall","chain",1);
 R.begin("wall");
 TB.syncTouchBar();
 eq(TB.measureFor(R.step()).map(f=>f.k).join(","),"x,y","البداية: س وص");
 R.feedPoint([0,0]);
 TB.syncTouchBar();
 eq(TB.measureFor(R.step()).map(f=>f.k).join(","),"L,a","بعد الأساس: الطول والزاوية");
 ok(doc.documentElement.classList.contains("cdMeas"),"html.cdMeas: البطاقةُ تعلو صفَّ القياس");
 const n=ST.S.walls.length;
 eq(TB.applyMeasure(["4","0"]),"@4<0","«طبّق» يركّب ويغذّي");
 eq(ST.S.walls.length,n+1,"جدارٌ جديد");
 const w=ST.S.walls[ST.S.walls.length-1];
 ok(w&&Math.abs(Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1])-4000)<1,"طولُه ٤ م بالضبط");
 eq(TB.pickAngle(90),90,"زرُّ ٩٠° يقفل الاتجاه");
 eq(TB.pickAngle(90),null,"ولمسةٌ ثانية تفكّه");
 eq(TB.applyMeasure(["",""]),false,"فارغان ⇒ لا شيء يُغذّى");
 R.cancel(true);
 TB.syncTouchBar();
 ok(!doc.documentElement.classList.contains("cdDraw"),"✕ يُخرج من وضع الرسم");
});

group("٤ · لوحةُ المفاتيح لا تغطّي النقطة",()=>{
 CV.V.w=400; CV.V.h=300; CV.V.k=0.05; CV.V.cx=0; CV.V.cy=0;
 eq(TB.keepVisible([0,0]),false,"نقطةٌ ظاهرة ⇒ لا إزاحة");
 ok(TB.keepVisible([0,-5000])===true,"نقطةٌ تحت الحافّة ⇒ إزاحة");
 const q=CV.W2S(0,-5000);
 ok(Math.abs(q[0]-200)<1&&Math.abs(q[1]-150)<1,"وتعود إلى منتصف اللوح");
});

group("٢ · الشاشةُ النظيفة لا تُخفي القياس",()=>{
 const dy=rd("src/ui/dyninput.js");
 ok(!/UIS\.clean/.test(dy),"syncDyn لا يسأل عن clean");
});

group("١ · وضعُ الرسم في القشرة: سطحٌ واحد",()=>{
 /* المرحلة F: كانت كتلةُ ≤768 تُخفي أسطحَ الحاسوب أثناء الأداة بـ!important.
    القشرةُ تُخرجها من الصفحة كلَّ الوقت، والشريطُ السفليُّ يصير شريطَ الأداة. */
 ok(!/المرحلة ٢ · وضعُ الرسم/.test(TC),"لا كتلةَ «وضع الرسم» في touch.css");
 const park=(LV.match(/PARK=Object\.freeze\(\[([^\]]*)\]/)||[])[1]||"";
 for(const sel of ["#top","#ribbon","#status","#fabDock"])
  ok(park.includes(`"${sel}"`),`${sel} خارجُ الصفحة في القشرة`);
 ok(/html\[data-shell-active="mobile"\]:not\(\.logOpen\) #log\{display:none\}/.test(MC),"والسجلُّ تنبيهٌ عابر");
 ok(/html\[data-shell-active="mobile"\]:not\(\.cdText\) #cmdWrap\{display:none\}/.test(MC),"وسطرُ الأوامر لخطوة النصّ وحدها");
 ok(/#touchBar \.tbM\{display:none\}/.test(TC),"حقلا القياس لا يظهران على الحاسوب واللوح");
 ok(/\.mBar #touchBar \.tbM\{\s*display:flex/.test(MC),"ويظهران في القشرة");
 ok(/html\[data-shell-active="mobile"\] #dynBox\{display:none\}/.test(MC),"بدل الحقول عند المؤشّر");
});

group("٥ · الإصبع: الرفعُ يثبّت · العدسة · إصبعان",()=>{
 const cv=rd("src/ui/canvas.js");
 ok(/if\(liftable\(\)\)\{/.test(cv)&&/lift=\{id:e\.pointerId/.test(cv),"اللمسُ والأداةُ فعّالة لا يضع نقطة");
 ok(/if\(e\.type!=="pointercancel"\)\{onMove\(le\); onDown\(le\)\}/.test(cv),"الرفعُ يثبّت والإلغاءُ لا يضع شيئاً");
 ok(/if\(lift\)\{lift=null; loupeOff\(\)\}/.test(cv),"إصبعٌ ثانٍ يُلغي النقطةَ المعلَّقة");
 ok(/st&&st\.freehand/.test(cv.slice(cv.indexOf("const liftable"))),"والرسمُ الحرّ مستثنى");
 ok(/paintLoupe\(\);/.test(cv),"العدسةُ تُرسم بعد اللوح في الإطار نفسِه");
 ok(/HOOK\.tap2\(\)/.test(cv)&&/TAP2_MS=300/.test(cv),"نقرةٌ بإصبعين تنادي التراجع");
 ok(/runTouch\("undo"\)\},TAP2_WAIT\)/.test(rd("src/ui/touchbar.js")),"والخطّافُ هو زرُّ ↶ نفسُه (بعد مهلة الملاءمة · المرحلة ٥)");
 ok(/#loupe\.on\{display:block\}/.test(TC),"وللعدسة تنسيق");
});
group("٥ · سلوكٌ بأحداثِ لمسٍ حقيقيّة",()=>{
 const cv=doc.getElementById("cv");
 const {HOOK}=BUS;
 CV.V.w=400; CV.V.h=300; CV.V.k=0.05; CV.V.cx=0; CV.V.cy=0;
 R.setOpt("wall","chain",1); R.begin("wall");
 const P=(t,id,x,y)=>fire(cv,t,{pointerType:"touch",pointerId:id,offsetX:x,offsetY:y,clientX:x,clientY:y,button:0});
 P("pointerdown",1,100,100);
 eq(R.T.ctx.pts.length,0,"اللمسُ وحدَه لا يضع نقطة");
 ok(CV.LOUPE.on,"والعدسةُ ظاهرة");
 P("pointermove",1,120,100); P("pointerup",1,120,100);
 eq(R.T.ctx.pts.length,1,"الرفعُ يثبّت النقطة");
 eq(R.T.ctx.pts[0][0],-1600,"في موضع الرفع لا اللمس");
 ok(!CV.LOUPE.on,"والعدسةُ تختفي");
 P("pointerdown",4,100,100); P("pointercancel",4,100,100);
 eq(R.T.ctx.pts.length,1,"pointercancel لا يضع شيئاً");
 let u=0; const old=HOOK.tap2; HOOK.tap2=()=>u++;
 P("pointerdown",2,200,100); P("pointerdown",3,250,100);
 P("pointerup",2,200,100); P("pointerup",3,250,100);
 eq(u,1,"نقرةٌ بإصبعين ⇒ تراجع مرّةً واحدة");
 eq(R.T.ctx.pts.length,1,"ولا نقطةَ من الإصبعين");
 HOOK.tap2=old; R.cancel(true);
});

/* ════════ المرحلة 3 ════════ */
group("١ · أربعةُ تبويباتٍ والباقي في «المزيد»",()=>{
 eq(RN.PHONE_TABS.join(","),"draw,edit,view,out","رسم · تعديل · عرض · إخراج");
 RN.buildRibbon();
 const rb=doc.getElementById("ribbon");
 const tabs=[...rb.querySelectorAll(".rbTab")];
 eq(tabs.length,7,"الحاسوبُ يرى السبعةَ كما كانت");
 const sec=tabs.filter(b=>b.classList.contains("sec")).map(b=>b.dataset.tab);
 eq(sec.join(","),"annt,serv,mng","الثانويةُ ثلاثة");
 const menu=doc.getElementById("rbMoreMenu");
 ok(menu&&menu.hidden,"قائمة «المزيد» مغلقةٌ أوّلاً");
 const items=[...menu.querySelectorAll("[data-tab]")].map(b=>b.dataset.tab);
 eq(items.join(","),"annt,serv,mng","وفيها الثلاثة");
 ok(!!menu.querySelector('[data-act="beginner"]'),"ومفتاحُ وضع المبتدئ");
 eq(RN.toggleMoreTabs(),true,"تُفتح");
 ok(RN.moreTabsOpen(),"ومفتوحة");
 RN.setTab("annt");
 ok(!RN.moreTabsOpen(),"اختيارُ تبويبٍ يغلقها");
 const mb=doc.getElementById("rbMoreTab");
 ok(mb.classList.contains("on"),"و«المزيد» يُبرَز حين يكون الثانويُّ نشطاً");
 eq(mb.querySelector(".tn").textContent,"تأشير","ويحمل اسمَه");
 RN.setTab("draw");
 eq(mb.querySelector(".tn").textContent,"المزيد","ويعود اسمُه");
 ok(/#rbMoreTab, #rbMoreMenu\{display:none\}/.test(TC),"مخفيّان على الحاسوب");
 /* المرحلة F: الشريطُ لا يُرى على الهاتف (القشرة تُخرجه)، فالتبويباتُ السبعةُ
    ظاهرةٌ أينما ظهر، والهاتفُ خمسُ فئاتٍ في الكتالوج */
 ok(!/rbTab\.sec\{display:none/.test(TC),"لا إخفاءَ للثانوية في touch.css");
 eq(CAT.CATALOG.length,5,"والهاتفُ خمسُ فئات (catalog.js)");
 ok(/toggleMoreTabs\(\)/.test(rd("src/ui/ribbon/wire.js")),"والنقرةُ موصولة");
});

group("٢ · وضعُ المبتدئ في أوّل تشغيلٍ على الهاتف",()=>{
 const s=rd("src/ui/store.js");
 ok(/function phoneDefaults\(\)\{[\s\S]*?UIS\.beginner=1/.test(s),"phoneDefaults تشغّله");
 ok(/if\(!raw\)\{phoneDefaults\(\)/.test(s),"عند غياب التفضيلات وحده (أوّل تشغيل)");
});

group("٣ · جولةُ الهاتف",()=>{
 eq(TR.STEPS_PHONE.length,3,"ثلاثُ خطوات");
 ok(/جدار/.test(TR.STEPS_PHONE[0].t)&&/باب/.test(TR.STEPS_PHONE[1].t)&&/احفظ/.test(TR.STEPS_PHONE[2].t),
  "جدار ← باب ← حفظ");
 ok(TR.STEPS_PHONE.every(x=>!/Ctrl|F7|F1|Enter|Esc\b/.test(x.s)),"بلا اختصارات لوحة مفاتيح");
 ok(typeof TR.STEPS_PHONE[2].act.fn==="function","والحفظُ زرٌّ في البطاقة");
 TR.STEPS_PHONE[0].go();
 eq(R.T.def&&R.T.def.id,"wall","الخطوةُ الأولى تفعّل الجدار");
 R.cancel(true);
 ok(/CUR=\(!full&&isPhone\(\)\)\?STEPS_PHONE:STEPS/.test(rd("src/ui/tour.js")),"والحاسوبُ يبقى على الجولة الكاملة");
});

group("٤ · زرُّ المساعدة يُسحَب",()=>{
 eq(FD.placeFab(100,100,52,52,400,800,false).s,74,"LTR: المسافةُ من اليسار");
 eq(FD.placeFab(100,100,52,52,400,800,true).s,274,"RTL: المسافةُ من اليمين");
 const p=FD.placeFab(-50,5000,52,52,400,800,false);
 ok(p.s>=6&&p.t<=800-52-6,"ولا يخرج من الشاشة");
 ok(/makeDraggable\(helpBot&&helpBot\.fab\)/.test(rd("src/app.js")),"موصولٌ بزرّ المساعدة");
 ok(/body \.hb-fab\.moved\{/.test(TC),"وللموضع المسحوب تنسيق");
 ok(/html\[data-shell-active="mobile"\]\.cdDraw body \.hb-fab/.test(MC),"ويختفي أثناء الرسم (في القشرة)");
});

group("٥ · زرُّ الرجوع",()=>{
 R.begin("wall");
 eq(BN.backStep(),"tool","الأداةُ الجارية أوّلاً");
 ok(!R.active(),"وأُلغيت");
 RN.toggleMoreTabs(true);
 eq(BN.backStep(),"more","ثمّ المفتوح");
 eq(BN.backStep(),null,"ولا شيء ⇒ المنصّةُ تطلب ضغطةً ثانية");
 const P=rd("src/platform/index.js");
 ok(/initNative\(\{onPause,onBack\}=\{\}\)/.test(P)&&/r=onBack\(\)/.test(P),"المنصّةُ تسأل الواجهةَ أوّلاً");
 ok(/onBack:backStep/.test(rd("src/app.js")),"وapp.js يمرّر backStep");
});

/* ════════ المرحلة 5 ════════ */
group("١ · ⚙ مساعداتُ الرسم",()=>{
 R.begin("wall"); TB.resetTouchBar(); TB.syncTouchBar();
 const box=doc.getElementById("touchBar");
 ok(!!box.querySelector('[data-tb="aids"]'),"زرُّ ⚙ في شريط الرسم");
 eq(TB.AIDS.map(a=>a.k).join(","),"snap,ortho,polar,grid,gsnap","خمسةُ مفاتيح");
 TB.runTouch("aids");
 ok(TB.aidsIsOpen()&&!!box.querySelector(".tbPop"),"اللوحةُ تُفتح");
 ok(!!box.querySelector('[data-tb="fit"]'),"وفيها الملاءمة");
 const was=!!+ST.S.rb.ortho;
 eq(TB.toggleAid("ortho"),!was,"التعامدُ يتبدّل");
 eq(box.querySelector('[data-tg="ortho"]').getAttribute("aria-pressed"),String(!was),"والزرُّ يعكسه");
 ST.S.rb.polar=0; TB.toggleAid("polar");
 ok(!!+ST.S.rb.polar&&!+ST.S.rb.ortho,"القطبيُّ يُطفئ التعامد (كشريط الحالة)");
 eq(TB.toggleAid("nope"),null,"مفتاحٌ مجهول يُرفَض");
 TB.runTouch("aids");
 ok(!TB.aidsIsOpen()&&!box.querySelector(".tbPop"),"ولمسةٌ ثانية تُغلقها");
 R.cancel(true);
 ok(/HOOK\.rbToggle=k=>rbToggle\(k\)/.test(rd("src/app.js")),"وفي التطبيق تمرّ بـrbToggle نفسِها");
});

await (async()=>{
 TB.initTouchBar();
 let u=0, f=0;
 const ru=TB.runTouch;
 R.begin("wall"); R.feedPoint([0,0]); R.feedPoint([3000,0]);
 const n=ST.S.walls.length;
 HOOK.tap2(); await sleep(TB.TAP2_WAIT+60);
 group("٢ · إصبعان: مرّةً تراجع، ومرّتين ملاءمة",()=>{
  eq(ST.S.walls.length,n-1,"نقرةٌ واحدة ⇒ تراجع بعد المهلة");
 });
 CV.V.cx=99999; CV.V.cy=99999;
 HOOK.tap2(); HOOK.tap2(); await sleep(TB.TAP2_WAIT+60);
 group("٢ · (تابع)",()=>{
  eq(ST.S.walls.length,n-1,"نقرتان ⇒ لا تراجع");
  ok(CV.V.cx!==99999||CV.V.cy!==99999,"بل ملاءمة");
 });
 R.cancel(true);
})();

group("٣ · قائمةُ الضغط المطوّل",()=>{
 const t=s=>TT.touchText(s,true);
 eq(t("تأكيد (Enter)"),"تأكيد","(Enter) يُحذَف");
 eq(t("إلغاء الأداة (Esc)"),"إلغاء الأداة","(Esc) يُحذَف");
 eq(t("إغلاق (C)"),"إغلاق","حرفُ الخطوة يُحذَف");
 eq(t("افحص (F7)"),"افحص","ومفتاحُ الوظيفة");
 eq(TT.touchText("تأكيد (Enter)",false),"تأكيد (Enter)","والحاسوبُ كما هو");
 ok(/esc\(touchText\(r\.n\)\)/.test(rd("src/ui/ctxmenu.js")),"ctxmenu.js يمرّر التسميات بالمرشّح");
});

/* ════════ المرحلة 6 ════════ */
const L=CV.LSTAT;
const d=()=>({full:L.full,fx:L.fx,gest:L.gest});
CV.V.w=400; CV.V.h=300; CV.V.dpr=1; CV.V.k=0.05; CV.V.cx=0; CV.V.cy=0;

group("١ · الحركةُ لا تعيد رسم المخطّط",()=>{
 CV.draw();
 const a=d();
 CV.drawFx();
 const b=d();
 eq(b.fx-a.fx,1,"drawFx ⇒ إطارٌ حيّ");
 eq(b.full-a.full,0,"ولا إطارَ كاملاً");
 CV.drawFx(); CV.draw();
 const c=d();
 eq(c.full-b.full,1,"وdraw() يبقى كاملاً دائماً");
 const cv=doc.getElementById("cv");
 R.begin("wall");
 const e0=d();
 for(let i=0;i<20;i++)fire(cv,"mousemove",{offsetX:100+i,offsetY:100,clientX:100+i,clientY:100,button:0});
 const e1=d();
 eq(e1.full-e0.full,0,"عشرون حركةً بالأداة ⇒ صفرُ إطارٍ كامل");
 ok(e1.fx-e0.fx>=20,"وكلُّها إطاراتٌ حيّة");
 R.cancel(true);
});

group("٢ · المنظرُ تغيّر ⇒ كامل",()=>{
 CV.draw();
 CV.V.cx+=500;               /* تغييرٌ لم يمرّ بـdraw() */
 const a=d(); CV.drawFx(); const b=d();
 eq(b.full-a.full,1,"بصمةٌ لا تطابق ⇒ يعود كاملاً");
 eq(b.fx-a.fx,0,"ولا يُعرَض المحفوظُ القديم");
});

group("٣ · القرص",()=>{
 const g={k:0.05,cx:0,cy:0}, v={k:0.1,cx:200,cy:-100,w:400,h:300,dpr:2};
 const x=CV.gestXf(g,v);
 /* نقطةٌ عالميّة (1000,500): موضعُها عند البدء ثم بالتحويل = موضعُها الآن */
 const sx0=(1000-g.cx)*g.k+v.w/2, sy0=v.h/2-(500-g.cy)*g.k;
 const sx1=(1000-v.cx)*v.k+v.w/2, sy1=v.h/2-(500-v.cy)*v.k;
 near((sx0*v.dpr)*x.a+x.e, sx1*v.dpr,1e-6,"س تنطبق");
 near((sy0*v.dpr)*x.a+x.f, sy1*v.dpr,1e-6,"ص تنطبق");
 eq(x.a,2,"والمقياسُ نسبةُ k");
 const cv=doc.getElementById("cv");
 CV.draw();
 const P=(t,id,px,py)=>fire(cv,t,{pointerType:"touch",pointerId:id,offsetX:px,offsetY:py,clientX:px,clientY:py,button:0});
 P("pointerdown",11,100,100); P("pointerdown",12,200,100);
 /* بدءُ القرص نفسُه يرسم إطاراً كاملاً واحداً (abortDrag) — يُقاس ما بعده */
 const a=d();
 for(let i=1;i<=10;i++)P("pointermove",12,200+i*5,100);
 const b=d();
 ok(b.gest-a.gest>=10,"كلُّ حركة قرصٍ ⇒ صورةٌ محوَّلة");
 eq(b.full-a.full,0,"بلا إطارٍ كامل واحد أثناء القرص");
 P("pointerup",12,250,100); P("pointerup",11,100,100);
 const c=d();
 ok(c.full-b.full>=1,"والرفعُ يعيد الإطارَ الكامل");
});

group("٤ · مزامنةُ الواجهة",()=>{
 let n=0; const old=HOOK.prompt; HOOK.prompt=()=>n++;
 HOOK.promptSoon();
 eq(n,1,"الافتراضُ فوريّ (لا شيءَ يتأخّر في الاختبارات)");
 HOOK.prompt=old;
 const app=rd("src/app.js");
 ok(/HOOK\.promptSoon=\(\)=>\{if\(q\)return; q=1;/.test(app),"وفي التطبيق مرّةً لكلّ إطار");
 ok(/HOOK\.promptSoon\(\); drawFx\(\); return;/.test(rd("src/ui/canvas.js")),"والمسارُ الساخن يستعملها");
});

/* ════════ المرحلة 7 ════════ */
group("١ · آخرُ طول",()=>{
 R.loadOpts(); R.setOpt("wall","chain",1);
 R.begin("wall"); TB.resetTouchBar(); TB.syncTouchBar();
 eq(TB.lastLen(),null,"لا طولَ قبل أوّل قطعة");
 R.feedPoint([0,0]); R.feedPoint([4000,0]); TB.syncTouchBar();
 eq(TB.lastLen(),4000,"أوّلُ قطعةٍ ٤ م ⇒ آخرُ طول");
 const b=doc.getElementById("touchBar").querySelector(".tbLast");
 ok(b&&!b.hidden,"والزرُّ ظاهر");
 eq(b.querySelector("span").textContent,"4.000","ويقول ٤٫٠٠٠");
 R.T.ghost=[4000,3000];
 const n=ST.S.walls.length;
 TB.runTouch("last");
 eq(ST.S.walls.length,n+1,"لمستُه تضع قطعةً");
 const w=ST.S.walls[ST.S.walls.length-1];
 ok(Math.abs(Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1])-4000)<1,"بالطول نفسِه");
 R.cancel(true); TB.syncTouchBar();
 eq(TB.lastLen(),null,"وإنهاءُ الأداة يمسحه");
});

group("٢ · العدسةُ تسمّي",()=>{
 R.begin("wall"); R.feedPoint([0,0]);
 R.T.ghost=[3250,0]; CV.UI.osnap={m:"end",p:[3250,0]};
 eq(CV.loupeTag(),"نهاية · 3.250 م","نوعُ الالتقاط والطولُ الحيّ");
 CV.UI.osnap=null;
 eq(CV.loupeTag(),"3.250 م","بلا التقاط ⇒ الطولُ وحده");
 R.cancel(true);
 ok(/const tag=loupeTag\(\)/.test(rd("src/ui/canvas.js")),"وتُرسَم داخل العدسة");
});

group("٣ · اهتزازٌ في المتصفّح",()=>{
 const P=rd("src/platform/index.js");
 ok(/navigator\.vibrate\(kind==="snap"\?14:8\)/.test(P),"navigator.vibrate بديلُ Capacitor");
 ok(/!matchMedia\("\(pointer:coarse\)"\)\.matches\)return false/.test(P),"وعلى اللمس وحده");
});

group("٤ · الأفقيّ",()=>{
 /* المرحلة F: الهاتفُ الأفقيّ قشرةُ هاتفٍ (الضلعُ الأقصر < 600)، والشريطُ
    السفليُّ نفسُه بلا كتلةٍ للاتّجاه */
 eq(SEL.pickShell({coarse:true,w:860,h:412}),"mobile","860×412 ⇒ قشرةُ الهاتف");
 ok(!/orientation:landscape/.test(TC),"لا كتلةَ أفقيّةَ في touch.css");
 ok(!/@media/.test(MC),"ولا نقطةَ توقّفٍ في mobile.css");
});

/* ════════ المرحلة 8 ════════ */
group("١ · شريطُ التحديد",()=>{
 eq(TB.selFor(0).length,0,"لا تحديد ⇒ لا شريط");
 eq(TB.selFor(2).map(x=>x.k).join(","),"s:move,s:copy,s:rotate,del,props,clear","ستّةُ أفعال");
 R.loadOpts(); R.setOpt("wall","chain",1);
 R.begin("wall"); R.feedPoint([0,0]); R.feedPoint([4000,0]); R.cancel(true);
 const w=ST.S.walls[ST.S.walls.length-1];
 CV.setSel([{k:"wall",id:w.id}],{k:"wall",id:w.id});
 TB.resetTouchBar(); TB.syncTouchBar();
 ok(doc.documentElement.classList.contains("cdSel"),"html.cdSel مع التحديد");
 const box=doc.getElementById("touchBar");
 ok(!!box.querySelector('[data-tb="del"]'),"وزرُّ الحذف ظاهر");
 R.H.sel=()=>CV.selList();   /* كما يوصله app.js */
 TB.runTouch("s:move");
 eq(R.T.def&&R.T.def.id,"move","«نقل» يبدأ أداةَ النقل بالتحديد الجاري");
 R.cancel(true);
 CV.setSel([{k:"wall",id:w.id}],{k:"wall",id:w.id});
 const n=ST.S.walls.length;
 TB.runTouch("del");
 eq(ST.S.walls.length,n-1,"«حذف» يحذف المحدَّد (delSel نفسُها)");
 TB.syncTouchBar();
 ok(!doc.documentElement.classList.contains("cdSel"),"ولا تحديدَ بعده ⇒ يختفي الشريط");
 ok(/syncTouchBar\(\)\};/.test(rd("src/app.js").match(/HOOK\.props=[^\n]*/)[0]),"HOOK.props يزامنه");
 ok(/html\.cdSel #touchBar\{/.test(TC),"وله موضعٌ على اللوح");
 ok(/\.mBar #touchBar\{/.test(MC),"وفي القشرة هو الشريطُ السفليّ");
});

group("٢ · الترويسة",()=>{
 /* المرحلة F: ترويسةُ الحاسوب (#top · #qat) خارجُ الصفحة في القشرة، وترويستُها
    ٤٨ بكسلاً: ☰ · الاسم · ↶ ↷ · 🔍 بأهدافِ ٤٤ */
 ok(!/#qat button\[data-act=/.test(TC),"لا إخفاءَ لأزرار #qat في touch.css");
 ok(/"#top"/.test(LV),"#top خارجُ الصفحة في القشرة");
 ok(/--m-top:48px/.test(MC)&&/min-inline-size:44px; block-size:44px/.test(block(MC,'html[data-shell-active="mobile"] .mTopB{')),"وأزرارُ ترويستها ٤٤ بكسلاً");
});

group("٣ · السجلُّ تنبيهاً عابراً",()=>{
 eq(TO.toast("in","x"),false,"على الحاسوب لا تنبيه");
 const P=rd("src/ui/props.js");
 ok(/toast\(cls,d\.textContent\)/.test(P),"rep() يرسل كلَّ رسالةٍ إليه");
 ok(/:not\(\.logOpen\) #log\{display:none/.test(MC),"والسجلُّ مخفيٌّ في القشرة حتى يُفتح");
 const de=doc.documentElement;
 de.dataset.shellActive="mobile";
 eq(TO.toast("in","مرحبا"),true,"وفي القشرة يظهر (السمةُ لا عرضُ الشاشة)");
 TO.hideToast(); delete de.dataset.shellActive;
 eq(TO.toast("in","x"),false,"والسمةُ تُرفَع ⇒ لا تنبيه");
 ok(/aria-hidden","true"/.test(rd("src/ui/toast.js")),"ولا يُقرأ مرّتين (السجلُّ يُعلن)");
 ok(/MS=\{er:4000,wr:3200\}/.test(rd("src/ui/toast.js")),"والخطأُ يبقى أطول");
});

process.exit(summary()?1:0);
