#!/usr/bin/env node
/* ═══ حزمةُ تطبيق أندرويد ═══
   يبني dist/ بالطريقة المعتادة (build-dist.js بتحقّقه كلِّه) ثم ينسخه إلى
   www/ — مجلّدُ Capacitor — ويحذف ما لا معنى له داخل التطبيق:
     sw.js (لا عاملَ خدمةٍ في التطبيق — app.js لا يسجّله أصلاً هناك)
     _headers · 404.html · robots.txt (ترويساتُ ومسارات مضيف الويب)
   ويضيّق CSP: يُزيل منافذَ localhost (Ollama على الحاسوب لا وجود له
   على الهاتف) ويُبقي المزوّدين السحابيين للمساعد الذكي.
   ثم يجمّعه (scripts/bundle-android.js): ٢٤٩ طلباً عند الإقلاع ⇐ ٦٢.
   التشغيل:  node scripts/build-android.js [--no-bundle]   ثم   npx cap sync android */
import {execFileSync} from "node:child_process";
import {cpSync,rmSync,existsSync,readFileSync,writeFileSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const DIST=join(ROOT,"dist"), WWW=join(ROOT,"www");

execFileSync(process.execPath,[join(ROOT,"scripts/build-dist.js")],{stdio:"inherit",cwd:ROOT});
rmSync(WWW,{recursive:true,force:true});
cpSync(DIST,WWW,{recursive:true});
["sw.js","_headers","404.html","robots.txt"].forEach(f=>{
 const p=join(WWW,f); if(existsSync(p))rmSync(p);
});
const html=join(WWW,"index.html");
let s=readFileSync(html,"utf8");
s=s.replace(/\s+http:\/\/(?:localhost|127\.0\.0\.1):\d+/g,"");
writeFileSync(html,s,"utf8");
/* المرحلة D: تجميعٌ (esbuild) — يُتخطّى بـ --no-bundle للتشخيص */
if(!process.argv.includes("--no-bundle")){
 const {bundle}=await import("./bundle-android.js");
 bundle();
}
console.log("✓ www/ جاهزٌ لـ Capacitor — التالي: npx cap sync android");
