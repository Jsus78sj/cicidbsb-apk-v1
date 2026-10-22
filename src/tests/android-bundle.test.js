/* ═══ حزمةُ أندرويد المجمَّعة ═══ المرحلة D
   يبني dist/ في مجلّدٍ مؤقّت ثم يجمّعه بـ scripts/bundle-android.js ويقيس
   الناتج: المداخلُ الثلاثةُ موجودة، index.html لا يذكر src/ ولا preload،
   رابطُ CSS واحدٌ يحمل كلَّ الملفّات بترتيبها، وكلُّ استيرادٍ بين القطع يُحَلّ.
   (التشغيلُ الحقيقيُّ في Chromium — إقلاعٌ ورسمٌ وحفظٌ واستعادة — مسجَّلٌ في
   CHANGES.md؛ هنا ما يُقاس بلا متصفّح.) بلا esbuild يُتخطّى ويُقال.
   التشغيل:  node src/tests/android-bundle.test.js                       */
import {execFileSync} from "node:child_process";
import {mkdtempSync,readFileSync,existsSync,readdirSync,rmSync} from "node:fs";
import {join,dirname} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";
import {group,ok,eq,summary} from "./harness.js";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"../..");
const BA=await import("../../scripts/bundle-android.js");
const es=BA.findEsbuild();
if(!es){
 group("esbuild غير متوفّر",()=>ok(true,"تُخطّي — npm install يثبّته (devDependencies)"));
 process.exit(summary()?1:0);
}
const TMP=mkdtempSync(join(tmpdir(),"cd-apk-"));
execFileSync(process.execPath,[join(ROOT,"scripts/build-dist.js")],{cwd:ROOT,stdio:"ignore",env:{...process.env,BUILD_OUT:TMP}});
const srcHtml=readFileSync(join(TMP,"index.html"),"utf8");
const cssOrder=[...srcHtml.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
process.env.WWW_DIR=TMP;
const {bundle}=await import("../../scripts/bundle-android.js?run");
const r=bundle();
const html=readFileSync(join(TMP,"index.html"),"utf8");

group("الناتج",()=>{
 ok(r.ok,"جُمِّع");
 BA.ENTRIES.forEach(e=>ok(existsSync(join(TMP,"b",e.split("/").pop())),`b/${e.split("/").pop()}`));
 ok(r.chunks>10,`${r.chunks} قطعةً كسولة — import() بقي كسولاً`);
 ok(r.after.files<r.before.files/2,`${r.before.files} ⇐ ${r.after.files} ملفاً`);
 ok(!existsSync(join(TMP,"src")),"src/ حُذف من الحزمة");
});
group("index.html",()=>{
 ok(!/src="\.?\/?src\//.test(html)&&!/href="\.?\/?src\//.test(html),"لا مسارَ إلى src/");
 ok(!/modulepreload/.test(html),"ولا modulepreload");
 eq((html.match(/rel="stylesheet"/g)||[]).length,1,"رابطُ CSS واحد");
 BA.ENTRIES.forEach(e=>ok(html.includes(`src="b/${e.split("/").pop()}"`),`يحمّل b/${e.split("/").pop()}`));
 const i=n=>html.indexOf(`src="b/${n}"`);
 ok(i("bootguard.js")<i("app.js"),"الحارسُ قبل التطبيق كما كان");
 const refs=[...html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)].map(m=>m[1]).filter(u=>!/^(https?:|data:|blob:|mailto:)/.test(u));
 const miss=refs.filter(u=>!existsSync(join(TMP,u.replace(/^\.\//,""))));
 eq(miss.length,0,`كلُّ ${refs.length} مرجعاً محليّاً موجود`+(miss.length?" — "+miss.slice(0,3).join(" · "):""));
});
group("CSS بترتيبه",()=>{
 const css=readFileSync(join(TMP,"css/app.css"),"utf8");
 const pos=cssOrder.map(h=>css.indexOf(`/* ${h} */`));
 ok(cssOrder.length>20&&pos.every(p=>p>=0),`${cssOrder.length} ملفاً كلُّها في app.css`);
 ok(pos.every((p,i)=>!i||p>pos[i-1]),"وبترتيب الروابط نفسه (الأسبقيّة)");
 ok(cssOrder[cssOrder.length-1]==="css/touch.css","touch.css آخراً كما كان");
});
group("كلُّ استيرادٍ بين القطع يُحَلّ",()=>{
 const B=join(TMP,"b"), files=[...readdirSync(B).filter(f=>f.endsWith(".js")),...readdirSync(join(B,"c")).map(f=>"c/"+f)];
 let n=0; const bad=[];
 files.forEach(f=>{
  const t=readFileSync(join(B,f),"utf8");
  for(const m of t.matchAll(/(?:from|import\()\s*"(\.{1,2}\/[^"]+)"/g)){
   n++; const p=join(B,dirname(f),m[1]); if(!existsSync(p))bad.push(f+" ⇐ "+m[1]);
  }
 });
 ok(n>50,`${n} استيراداً`);
 eq(bad.length,0,"كلُّها موجودة"+(bad.length?" — "+bad.slice(0,3).join(" · "):""));
 ok(!files.some(f=>/["']\.\.\/src\//.test(readFileSync(join(B,f),"utf8"))),"ولا شيءَ يعود إلى src/");
});
rmSync(TMP,{recursive:true,force:true});
process.exit(summary()?1:0);
