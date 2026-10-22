/* ═══ المرحلة ٤ من خطّة الهاتف: السيناريو الكامل بإصبعٍ وحدَها ═══
   معيارُ الخطّة: «غرفةٌ ٤×٥ بباب، محفوظة، بلا لوحة مفاتيح». هنا يُنفَّذ
   كما يفعله المستخدمُ على الهاتف — أحداثُ لمسٍ على اللوح ولمساتٌ على
   أزرار #touchBar فقط، **ولا حدثَ لوحة مفاتيحٍ واحد** — ثم يُعَدّ ما
   لزمه من لمسات. والحفظُ هو toJSON ثم fromJSON نفسُهما: ما يُحفَظ يُفتَح.
   (والتجربةُ على هاتفٍ حقيقيٍّ تبقى: هذا يثبت المنطقَ لا الإحساس.)
   التشغيل:  node src/tests/phone-e2e.test.js                        */
import {shim,shimCanvas,shimDOM,fire,group,ok,eq,summary} from "./harness.js";
shim(); shimCanvas();
const doc=shimDOM();
for(const id of ["cv","touchBar","optbar","thumb"]){
 const e=doc.createElement(id==="cv"?"canvas":"div");
 e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
for(const f of ["draw","openings","modify"])await import(`../tools/${f}.js`);
const R =await import("../tools/registry.js");
const TB=await import("../ui/touchbar.js");
const CV=await import("../ui/canvas.js");
const ST=await import("../core/state.js");
const PJ=await import("../io/project.js");
const PR=await import("../tools/presets.js");

/* لا لوحةَ مفاتيح: أيُّ keydown يُسجَّل خطأً */
let keys=0;
const kd=()=>keys++;
if(globalThis.addEventListener)globalThis.addEventListener("keydown",kd);
doc.addEventListener&&doc.addEventListener("keydown",kd);

ST.newState();
CV.V.w=390; CV.V.h=560; CV.V.dpr=1; CV.V.k=0.05; CV.V.cx=2000; CV.V.cy=2500;
R.loadOpts(); R.setOpt("wall","chain",1);
ST.S.rb.snap=0; ST.S.rb.grid=0;            /* نقاطٌ مضبوطةٌ بلا التقاطٍ يحرّفها */
TB.initTouchBar();
/* الوصلُ نفسُه الذي يصنعه app.js بين الأدوات واللوح والواجهة */
R.H.draw=CV.draw; R.H.hit=(x,y,k)=>CV.hitTest(x,y,k);
R.H.sel=()=>CV.selList(); R.H.setSel=l=>CV.setSel(l||[],null);
R.H.prompt=()=>TB.syncTouchBar();
const cv=doc.getElementById("cv");
let taps=0;
const tapAt=(wx,wy)=>{               /* لمسةٌ على اللوح: نزولٌ ثم رفعٌ في الموضع */
 const s=CV.W2S(wx,wy);
 const ev={pointerType:"touch",pointerId:100+taps,offsetX:s[0],offsetY:s[1],clientX:s[0],clientY:s[1],button:0};
 fire(cv,"pointerdown",ev); fire(cv,"pointerup",ev); taps++;
};
const btn=k=>{TB.runTouch(k); taps++};
const measure=(L,a)=>{TB.applyMeasure([L,a]); taps+=3};   /* حقلٌ + حقلٌ + «طبّق» */

group("١ · غرفة ٤×٥ بالحقلين والأزرار",()=>{
 R.begin("wall"); taps++;                    /* لمسةُ «جدار» في الشريط */
 TB.syncTouchBar();
 ok(doc.documentElement.classList.contains("cdDraw"),"وضعُ الرسم");
 tapAt(0,0);
 eq(R.T.ctx.pts.length,1,"الركنُ الأوّل من لمسةٍ ورفع");
 measure("4","0");
 measure("5","90");
 TB.syncTouchBar();
 eq(TB.lastLen(),5000,"آخرُ طولٍ ٥ م");
 measure("4","180");
 btn("close");                               /* ⭘ يغلق الشكل */
 btn("esc");                                 /* ✕ يُنهي الأداة */
 eq(ST.S.walls.length,4,"أربعةُ جدران");
 const L=ST.S.walls.map(w=>Math.round(Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]))).sort((a,b)=>a-b);
 eq(L.join(","),"4000,4000,5000,5000","٤ · ٤ · ٥ · ٥ م بالضبط");
 ok(!R.active(),"والأداةُ انتهت");
});

group("٢ · باب على الجدار السفليّ",()=>{
 const p=PR.SIZES.find(x=>x.id==="s.door.room");
 PR.applySize(p); taps++;                    /* «باب غرفة» من الشريط */
 eq(R.T.def&&R.T.def.id,"door","أداةُ الباب");
 tapAt(2000,0);                              /* منتصفُ الجدار السفليّ */
 btn("esc");
 eq(ST.S.opens.length,1,"بابٌ واحد");
 eq(ST.S.opens[0].kind,"door","مفرد");
});

group("٣ · الحفظ يُفتَح كما هو",()=>{
 const txt=PJ.toJSON();
 ok(typeof txt==="string"&&txt.length>100,"ملفُّ مشروع");
 ST.newState();
 eq(ST.S.walls.length,0,"مشروعٌ فارغ");
 PJ.fromJSON(txt);
 eq(ST.S.walls.length,4,"الفتحُ يعيد الجدران الأربعة");
 eq(ST.S.opens.length,1,"والباب");
 taps++;                                     /* لمسةُ «حفظ» */
});

group("٤ · المعيار",()=>{
 eq(keys,0,"صفرُ حدثِ لوحة مفاتيح");
 ok(taps<=20,`${taps} لمسةً للغرفة والباب والحفظ (الحدّ ٢٠)`);
});
summary();
