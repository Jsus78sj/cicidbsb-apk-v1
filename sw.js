/* ═══ Service Worker — CivilDraft ═══
   القاعدة: الشبكة أولاً لكل شيءٍ من نفس الأصل، والكاش احتياطٌ عند
   انقطاع الاتصال فقط. لا «كاش أولاً» لأي مورد (HTML منه) — وإلا علق
   المستخدم على نسخةٍ قديمة بعد كل ترقية، وهو ما يمنعه no-cache في
   netlify.toml و_headers. ما نجح جلبُه يُخزَّن (r.ok وحده) فيعمل
   التطبيق بلا اتصال بعد زيارةٍ واحدة.
   طلباتُ المزوّد الخارجيّ (المفتاح في ترويسته) وغير GET لا نعترضها.

   ═══ ما أُصلح في P6-002 ═══
   ١) اسمُ الكاش مرتبطٌ برقم النسخة لا رقماً يدوياً يُنسى. المصدرُ
      الواحد src/core/version.js، والنصُّ هنا مطابقٌ له حرفاً بحارسٍ
      في الاختبار (العاملُ لا يستورد وحدات).
   ٢) CORE يشمل ما يلزم للعمل دون اتصالٍ بعد أوّل زيارة — لا خمسةَ
      ملفّاتٍ فقط. والقائمةُ مولَّدةٌ لا مكتوبةٌ بيد: scripts/gen-sw-core.js
      يقرأ رسمَ الاستيراد ويكتبها، والاختبارُ يتحقّق أنها محدَّثة.
   ٣) التثبيتُ مرِنٌ: ملفٌّ واحدٌ يفشل لا يُسقِط العاملَ كلَّه
      (addAll ذرّيّة — فنضيف واحداً واحداً ونتجاوز الفاشل).
   ٤) التحديثُ يصل المستخدمَ: لا skipWaiting أعمى على صفحةٍ حيّة —
      العاملُ الجديد ينتظر، ويُبلِّغ الصفحةَ برسالة، والصفحةُ تسأل
      المستخدم ثم تُرسل SKIP_WAITING فيُفعَّل ويُعاد التحميل مرّةً
      واحدة. وأوّلُ تثبيتٍ (لا عاملَ قبله) يُفعَّل فوراً بلا سؤال.
   ٥) الكاشاتُ القديمة تُحذَف في activate، وحدُّ عددٍ للمدخلات يمنع
      نموّاً بلا سقف.                                                */
const VERSION="2.2.0";                 /* = src/core/version.js */
const CACHE=`civildraft-v${VERSION}`;
const MAXENTRIES=400;                  /* سقفُ مدخلات الكاش */

/* ═══ CORE ═══ مولَّدة: node scripts/gen-sw-core.js
   لا تُحرَّر بيدٍ — السطرانِ أدناه علامتا التوليد. */
/* CORE:BEGIN */
const CORE=[
 "./","./index.html","./manifest.json","./favicon.svg",
 "./favicon.ico","./apple-touch-icon.png","./css/base.css","./css/blocks.css",
 "./css/boot.css","./css/cmd.css","./css/dock.css","./css/guide.css",
 "./css/helpbot.css","./css/history.css","./css/learn.css","./css/mobile.css",
 "./css/modern.css","./css/palette.css","./css/panels.css","./css/pricing.css",
 "./css/report.css","./css/ribbon.css","./css/status.css","./css/studio.css",
 "./css/theme.css","./css/tokens.css","./css/tools.css","./css/touch.css",
 "./css/tour.css","./css/underlay.css","./css/util.css","./css/view3d.css",
 "./css/welcome.css","./icons/college-logo.svg","./icons/icon-192.png","./icons/icon-512.png",
 "./icons/icon-maskable-192.png","./icons/icon-maskable-512.png","./src/ai/ctx.js","./src/ai/generate.js",
 "./src/ai/help/answer.js","./src/ai/help/intent.js","./src/ai/help/kb.js","./src/ai/help/provider.js",
 "./src/ai/lang.js","./src/ai/lint.js","./src/ai/macrorun.js","./src/ai/net.js",
 "./src/ai/ops.js","./src/ai/opsrun.js","./src/ai/plan.js","./src/ai/review.js",
 "./src/ai/run.js","./src/ai/smartblocks.js","./src/ai/templates_lib.js","./src/app.js",
 "./src/bootguard.js","./src/core/arcmath.js","./src/core/areas.js","./src/core/autodim.js",
 "./src/core/batch.js","./src/core/blocks.js","./src/core/boq.js","./src/core/callouts.js",
 "./src/core/clouds.js","./src/core/code.js","./src/core/cols.js","./src/core/compare.js",
 "./src/core/coords.js","./src/core/delegate.js","./src/core/dims.js","./src/core/dimstyles.js",
 "./src/core/elevation.js","./src/core/entreg.js","./src/core/ents.js","./src/core/escape.js",
 "./src/core/fixt.js","./src/core/geom.js","./src/core/groups.js","./src/core/hatches.js",
 "./src/core/inspect.js","./src/core/journal.js","./src/core/laydef.js","./src/core/layers.js",
 "./src/core/level.js","./src/core/levelAlign.js","./src/core/limits.js","./src/core/live.js",
 "./src/core/ltypes.js","./src/core/macros.js","./src/core/migrate-autosave.js","./src/core/model3d.js",
 "./src/core/modify.js","./src/core/opens.js","./src/core/osnap.js","./src/core/parse.js",
 "./src/core/perf.js","./src/core/plines.js","./src/core/pricing.js","./src/core/proj3d.js",
 "./src/core/ref.js","./src/core/render.js","./src/core/roof.js","./src/core/section.js",
 "./src/core/shape.js","./src/core/sheet.js","./src/core/sindex.js","./src/core/stairs.js",
 "./src/core/state.js","./src/core/struct.js","./src/core/tabledef.js","./src/core/tables.js",
 "./src/core/templates.js","./src/core/trace.js","./src/core/underlay.js","./src/core/units.js",
 "./src/core/validate.js","./src/core/version.js","./src/core/walls.js","./src/guide/auto.js",
 "./src/guide/catalog.js","./src/guide/courses.js","./src/guide/dockPane.js","./src/guide/engine.js",
 "./src/guide/floater.js","./src/guide/lessons.js","./src/guide/sketch.js","./src/guide/usage.js",
 "./src/guide/viewer.js","./src/guide/wire.js","./src/io/backup.js","./src/io/boq.js",
 "./src/io/boqcsv.js","./src/io/boqpdf.js","./src/io/boqreport.js","./src/io/cp1256.js",
 "./src/io/dxf.js","./src/io/dxfarc.js","./src/io/dxfin.js","./src/io/elev.js",
 "./src/io/export.js","./src/io/pdf.js","./src/io/png.js","./src/io/project.js",
 "./src/io/report.js","./src/io/sect.js","./src/io/snaps.js","./src/io/store.js",
 "./src/io/style.js","./src/io/svg.js","./src/io/zip.js","./src/learn/acts.js",
 "./src/learn/cards.js","./src/learn/cert.js","./src/learn/lessons.js","./src/learn/runner.js",
 "./src/learn/sandbox.js","./src/platform/index.js","./src/shell/contract.js","./src/shell/desktop/index.js",
 "./src/shell/mobile/actionbar.js","./src/shell/mobile/catalog.js","./src/shell/mobile/chrome.js","./src/shell/mobile/index.js",
 "./src/shell/mobile/live.js","./src/shell/mobile/machine.js","./src/shell/mobile/props-sheet.js","./src/shell/mobile/sheet.js",
 "./src/shell/mobile/topbar.js","./src/shell/select.js","./src/tools/annotate.js","./src/tools/areas.js",
 "./src/tools/blockcollect.js","./src/tools/blockops.js","./src/tools/blocks.js","./src/tools/boq.js",
 "./src/tools/boqreport.js","./src/tools/cleanup.js","./src/tools/clouds.js","./src/tools/dedup.js",
 "./src/tools/draw.js","./src/tools/elev.js","./src/tools/groups.js","./src/tools/levelmgr.js",
 "./src/tools/macros.js","./src/tools/modify.js","./src/tools/openings.js","./src/tools/parts.js",
 "./src/tools/presets.js","./src/tools/ref.js","./src/tools/registry.js","./src/tools/roof.js",
 "./src/tools/section.js","./src/tools/sheet.js","./src/tools/showcase.js","./src/tools/sketch.js",
 "./src/tools/tplscript.js","./src/tutor/engine.js","./src/tutor/lessons.js","./src/ui/actions.js",
 "./src/ui/ai.js","./src/ui/appcmds.js","./src/ui/appmenu.js","./src/ui/backnav.js",
 "./src/ui/blockdraw.js","./src/ui/blockpanel.js","./src/ui/bus.js","./src/ui/canvas.js",
 "./src/ui/cmdkeys.js","./src/ui/cmdline.js","./src/ui/ctxmenu.js","./src/ui/defaults.js",
 "./src/ui/dock.js","./src/ui/dyninput.js","./src/ui/fabdrag.js","./src/ui/focustrap.js",
 "./src/ui/gallery.js","./src/ui/gate.js","./src/ui/helpbot.js","./src/ui/helpbutton.js",
 "./src/ui/helppan.js","./src/ui/historypanel.js","./src/ui/hygiene.js","./src/ui/icons.js",
 "./src/ui/inspector.js","./src/ui/keymap.js","./src/ui/layout.js","./src/ui/lazy-tools.js",
 "./src/ui/learn.js","./src/ui/levelManager.js","./src/ui/levelbar.js","./src/ui/navbar.js",
 "./src/ui/optbar.js","./src/ui/overlay.js","./src/ui/palette.js","./src/ui/panels.js",
 "./src/ui/presenter.js","./src/ui/pricingPanel.js","./src/ui/props.js","./src/ui/quickprops.js",
 "./src/ui/recentbar.js","./src/ui/ribbon/beginner.js","./src/ui/ribbon/custom.js","./src/ui/ribbon/editor.js",
 "./src/ui/ribbon/overflow.js","./src/ui/ribbon/render.js","./src/ui/ribbon/schema.js","./src/ui/ribbon/wire.js",
 "./src/ui/rpt.js","./src/ui/searchcommon.js","./src/ui/statusbar.js","./src/ui/store.js",
 "./src/ui/studio.js","./src/ui/styleManager.js","./src/ui/sugg.js","./src/ui/theme.js",
 "./src/ui/toast.js","./src/ui/touchbar.js","./src/ui/touchtext.js","./src/ui/tour.js",
 "./src/ui/underlayPanel.js","./src/ui/view3d.js","./src/ui/viewcmds.js","./src/ui/viewport.js",
 "./src/ui/welcome-model.js","./src/ui/welcome.js","./src/boot-splash.js","./src/core/dimension-input.js",
 "./src/core/guided-room-wizard.js","./src/core/guided-room.js","./src/core/quick-draw-transaction.js","./src/core/quick-draw.js",
 "./src/core/quick-opening.js","./src/core/quick-preview.js","./src/core/quick-room.js","./src/core/quick-wall.js",
 "./src/core/strict-edit.js","./src/tools/guidedroom.js","./src/tools/quickdraw.js","./src/tools/quickopening.js",
 "./src/tools/quickroom.js","./src/tools/quickwall.js","./src/ui/guidedroom-action.js","./src/ui/guidedroom.js"
];
/* CORE:END */

/* إضافةٌ واحدةً واحدة: الفاشلُ يُتجاوَز ولا يُسقِط التثبيت */
async function warm(){
 const c=await caches.open(CACHE);
 let ok=0, bad=0;
 for(const u of CORE){
  try{
   const r=await fetch(u,{cache:"reload"});
   if(r&&r.ok){await c.put(u,r.clone()); ok++} else bad++;
  }catch(e){bad++}
 }
 return {ok,bad};
}
async function trim(){
 try{
  const c=await caches.open(CACHE);
  const ks=await c.keys();
  if(ks.length<=MAXENTRIES)return 0;
  const drop=ks.slice(0,ks.length-MAXENTRIES);
  await Promise.all(drop.map(k=>c.delete(k)));
  return drop.length;
 }catch(e){return 0}
}
self.addEventListener("install",e=>{
 /* لا skipWaiting هنا: الترقيةُ لا تُفرَض على صفحةٍ حيّة (البند ٤) */
 e.waitUntil(warm());
});
self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  /* أعلِم كلَّ صفحةٍ أنّ نسخةً جديدةً صارت فعّالة */
  const cs=await self.clients.matchAll({type:"window"});
  cs.forEach(c=>{try{c.postMessage({type:"SW_ACTIVATED",version:VERSION})}catch(e){}});
 })());
});
/* الصفحةُ تطلب التفعيل بعد موافقة المستخدم */
self.addEventListener("message",e=>{
 const d=e&&e.data;
 if(d&&d.type==="SKIP_WAITING")self.skipWaiting();
 if(d&&d.type==="VERSION"&&e.source&&e.source.postMessage)
  e.source.postMessage({type:"SW_VERSION",version:VERSION});
});
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 let url;
 try{url=new URL(req.url)}catch(err){return}
 if(url.origin!==self.location.origin)return;
 e.respondWith(
  fetch(req).then(r=>{
   if(r&&r.ok&&r.type==="basic"){
    const c=r.clone();
    caches.open(CACHE).then(cache=>cache.put(req,c))
     .then(()=>trim()).catch(()=>{});
   }
   return r;
  }).catch(()=>caches.match(req).then(hit=>
   hit||(req.mode==="navigate"?caches.match("./index.html"):undefined)))
 );
});
