#!/usr/bin/env node
/* ═══ تجميعُ حزمة أندرويد ═══ المرحلة D
   www/ (من build-android.js) فيه ~٢٠٠ وحدة ES و٢٧ ملفَّ CSS: ٢٤٩ طلباً
   عند كلّ إقلاع. داخل WebView لا شبكة، لكنّ كلَّ طلبٍ يمرّ عبر جسر
   Capacitor، فالكلفةُ في العدد لا في الحجم.
   · JS: esbuild بثلاثة مداخل (boot-splash · bootguard · app) و--splitting:
     الاستيراداتُ الساكنةُ تُدمَج، والكسولةُ (import()) تبقى قطعاً تُحمَّل عند
     الحاجة — المساعد الذكي والـ3D والاستوديو والدروس لا تُبطئ الإقلاع.
   · CSS: دمجٌ بترتيب <link> نفسه في css/app.css (الترتيبُ هو الأسبقيّة).
   · index.html: المداخلُ إلى b/، ولا modulepreload، ورابطُ CSS واحد.
   · src/ يُحذف من www/ — لا يبقى إلا ما يُحمَّل فعلاً.
   esbuild من devDependencies؛ وإن غاب يبقى www/ غيرَ مجمَّع ويُقال (لا فشل).
   التشغيل:  node scripts/bundle-android.js   (يستدعيه build-android.js) */
import {execFileSync} from "node:child_process";
import {readFileSync,writeFileSync,rmSync,existsSync,readdirSync,statSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const WWW=process.env.WWW_DIR||join(ROOT,"www");
export const ENTRIES=["src/boot-splash.js","src/bootguard.js","src/app.js"];

export function findEsbuild(){
 const c=[process.env.ESBUILD,join(ROOT,"node_modules/.bin/esbuild")].filter(Boolean);
 for(const p of c)if(existsSync(p))return p;
 try{execFileSync("sh",["-c","command -v esbuild"],{stdio:"ignore"});return "esbuild"}catch(e){}
 return null;
}
const size=d=>readdirSync(d).reduce((n,f)=>{const p=join(d,f),s=statSync(p);return n+(s.isDirectory()?size(p):s.size)},0);
const count=d=>readdirSync(d).reduce((n,f)=>{const p=join(d,f);return n+(statSync(p).isDirectory()?count(p):1)},0);

export function bundle(){
 const html=join(WWW,"index.html");
 if(!existsSync(html))throw new Error("لا www/index.html — شغّل build-android.js أوّلاً");
 const es=findEsbuild();
 if(!es){console.log("⚠ esbuild غير متوفّر — www/ يبقى غيرَ مجمَّع (npm install يثبّته)");return {ok:false}}
 let s=readFileSync(html,"utf8");
 ENTRIES.forEach(e=>{ if(!s.includes(`src="${e}"`)&&!s.includes(`src="./${e}"`))
  throw new Error(`index.html لا يحمّل ${e} — تغيّر الإقلاع؟`) });
 const before={files:count(WWW),bytes:size(WWW)};

 /* ١ · JS */
 rmSync(join(WWW,"b"),{recursive:true,force:true});
 execFileSync(es,[...ENTRIES.map(e=>join(WWW,e)),"--bundle","--splitting","--format=esm",
  "--minify","--target=es2020,chrome89","--charset=utf8","--legal-comments=none",
  `--outdir=${join(WWW,"b")}`,"--entry-names=[name]","--chunk-names=c/[hash]","--log-level=warning"],
  {stdio:"inherit"});
 ENTRIES.forEach(e=>{const n=e.split("/").pop();
  if(!existsSync(join(WWW,"b",n)))throw new Error(`لم يُنتَج b/${n}`)});

 /* ٢ · CSS بترتيب الروابط */
 const links=[...s.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
 if(!links.length)throw new Error("لا روابطَ CSS في index.html");
 const css=links.map(h=>`/* ${h} */\n`+readFileSync(join(WWW,h.replace(/^\.\//,"")),"utf8")).join("\n");
 writeFileSync(join(WWW,"css/app.css"),css,"utf8");

 /* ٣ · index.html */
 let first=true;
 s=s.replace(/<link rel="stylesheet" href="[^"]+">\n?/g,()=>{if(first){first=false;return '<link rel="stylesheet" href="css/app.css">\n'}return ""});
 s=s.replace(/\s*<link rel="modulepreload"[^>]*>/g,"");
 ENTRIES.forEach(e=>{const n=e.split("/").pop();
  s=s.replace(new RegExp(`src="(\\./)?${e.replace(/[.]/g,"\\.")}"`),`src="b/${n}"`)});
 writeFileSync(html,s,"utf8");

 /* ٤ · ما لم يعد يُحمَّل */
 rmSync(join(WWW,"src"),{recursive:true,force:true});
 links.forEach(h=>{const p=join(WWW,h.replace(/^\.\//,"")); if(existsSync(p))rmSync(p)});

 const after={files:count(WWW),bytes:size(WWW)};
 const chunks=readdirSync(join(WWW,"b/c")).length;
 console.log(`✓ مجمَّع: ${before.files} ⇐ ${after.files} ملفاً · ${Math.round(before.bytes/1024)} ⇐ ${Math.round(after.bytes/1024)} ك.ب · ${chunks} قطعةً كسولة · CSS ${links.length} ⇐ 1`);
 return {ok:true,before,after,chunks,css:links.length};
}
const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1];
if(isMain)bundle();
