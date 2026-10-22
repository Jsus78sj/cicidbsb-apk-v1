/* ═══ حارسُ الوصول لقشرة الهاتف ═══ المرحلة C (مقابلُ ui-reach للقشرة الجديدة)
   المنجَز حين (الخطّة): «أي أداة من الـ40 في الكتالوج بلمستين، وأي أداة
   من الـ150 بالبحث، وحارس ui-reach أخضر للقشرة الجديدة».
   ui-reach يحرس الحاسوب (الشريط · الأفعال · مداخل معلَنة) ولا يعدّ لوحةَ
   الأوامر مدخلاً. على الهاتف لا شريط: المدخلُ كتالوجٌ أو بحث. فهنا:
   ١ · كلُّ أداةٍ يُقلع بها التطبيق (app.js + boot-splash.js + وحدات الواجهة
       المسجِّلة) إمّا في الكتالوج وإمّا تُوجَد **باسمها** في أوّل ١٢ نتيجة
       — ١٠٠٪ لا ٩٠٪ (الفحصُ السابق كان يقبل فوات عُشر الأدوات)
   ٢ · كلُّ فعلٍ هو زرٌّ في الشريط يُوجَد كذلك على الهاتف
   ٣ · لا مفتاحَ ميّتٌ في الكتالوج
   node src/tests/mobile-reach.test.js */
import {shim,shimCanvas,shimDOM,group,ok,eq,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim(); shimCanvas();
const DOC=shimDOM();
{const cv=DOC.createElement("canvas"); cv.setAttribute("id","cv"); DOC.body.appendChild(cv);}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};

const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");
const toolsOf=f=>[...src(f).matchAll(/["']\.\/tools\/([\w.]+)\.js["']/g)].map(m=>m[1]);

const failed=[];
for(const f of new Set([...toolsOf("src/app.js"),...toolsOf("src/boot-splash.js")])){
 try{await import(`../tools/${f}.js`)}catch(e){failed.push(`tools/${f}: ${e&&e.message}`)}
}
/* وحداتُ الواجهة التي تسجّل أدواتٍ (القائمةُ نفسُها في ui-reach) */
const uiMods=["hygiene","gate","levelManager","styleManager","underlayPanel",
 "pricingPanel","view3d","appcmds","viewcmds","blockpanel"];
for(const f of uiMods){
 try{await import(`../ui/${f}.js`)}catch(e){failed.push(`ui/${f}: ${e&&e.message}`)}
}
const R=await import("../tools/registry.js");
const SC=await import("../ui/ribbon/schema.js");
const {ACTIONS}=await import("../ui/actions.js");
const {paletteQuery}=await import("../ui/palette.js");
const CAT=await import("../shell/mobile/catalog.js");

const leaf=CAT.leaves();
const inCat=new Set(leaf.map(x=>x.t+":"+x.id));
const found=(label,key)=>paletteQuery(label,12).some(it=>it.key===key);

group("الاستيراد",()=>{
 eq(failed.join(" | "),"","كلُّ ما يُقلع به التطبيق يُستورَد");
});

group("١ · كلُّ أداةٍ مسجَّلة: كتالوجٌ أو بحثٌ باسمها",()=>{
 const tools=R.toolList().filter(d=>d&&d.id);
 ok(tools.length>=150,`${tools.length} أداةً مسجَّلة (الخطّة: ~١٥٠)`);
 const miss=tools.filter(d=>!inCat.has("cmd:"+d.id)&&!found(d.label||d.id,d.id)).map(d=>`${d.id}(${d.label})`);
 eq(miss.length,0,"لا أداةَ بلا مدخلٍ على الهاتف"+(miss.length?" — "+miss.slice(0,10).join("، "):""));
 const noLabel=tools.filter(d=>!d.label).map(d=>d.id);
 eq(noLabel.length,0,"كلُّ أداةٍ لها اسمٌ يُبحَث به"+(noLabel.length?" — "+noLabel:""));
});

group("٢ · كلُّ فعلٍ في الشريط له مدخلٌ على الهاتف",()=>{
 const acts=[...new Set(SC.ribbonActs())];
 ok(acts.length>10,`${acts.length} فعلاً في الشريط`);
 /* أفعالٌ تُخفيها اللوحةُ عمداً لأنّ أداةً تؤدّيها (palette.js: seen) */
 const SAME={delSel:"del"};
 for(const [a,t] of Object.entries(SAME))ok(inCat.has("cmd:"+t),`«${a}» ≡ أداة «${t}» في الكتالوج`);
 const miss=acts.filter(a=>{
  if(inCat.has("act:"+a))return false;
  if(SAME[a]&&inCat.has("cmd:"+SAME[a]))return false;
  const n=ACTIONS[a]&&ACTIONS[a].n;
  return !(n&&found(n,a))&&!found(a,a);
 });
 eq(miss.length,0,"كلُّها بالكتالوج أو بالبحث"+(miss.length?" — "+miss.slice(0,10).join("، "):""));
});

group("٣ · الكتالوج: لا مفتاحَ ميّت",()=>{
 const deadC=leaf.filter(x=>x.t==="cmd"&&!R.findTool(x.id)).map(x=>x.id);
 eq(deadC.length,0,"كلُّ cmd مسجَّل"+(deadC.length?" — "+deadC:""));
 const deadA=leaf.filter(x=>x.t==="act"&&!ACTIONS[x.id]).map(x=>x.id);
 eq(deadA.length,0,"كلُّ act موجود"+(deadA.length?" — "+deadA:""));
 /* المعرّفُ الحقيقيّ لا لقبٌ: findTool يقبل الألقاب، والكتالوج يُشير للأصل */
 const alias=leaf.filter(x=>x.t==="cmd"&&R.findTool(x.id)&&R.findTool(x.id).id!==x.id).map(x=>x.id);
 eq(alias.length,0,"الكتالوجُ يُشير لمعرّف الأداة لا لقبِها"+(alias.length?" — "+alias:""));
});

summary();
