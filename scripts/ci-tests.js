#!/usr/bin/env node
/* ═══ بوّابةُ CI ═══ المرحلة C
   السويتُ فيه أحدَ عشرَ ملفاً أحمرَ قبل إعادة الهيكلة (ملفّاتٌ ناقصةٌ من
   الحزمة أغلبُها)، فـ`npm test` يفشل دائماً ولا يصلح بوّابةً. هنا:
   · كلُّ ملفٍّ يُشغَّل (الاكتشافُ نفسُه في src/tests/all.js)
   · الفشلُ خارج src/tests/known-red.json يُسقط البناء
   · وما خضرّ من القائمة يُقال (احذفه منها) ولا يُسقط
   التشغيل:  node scripts/ci-tests.js   ( npm run test:ci ) */
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {discoverTestFiles} from "../src/tests/all.js";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const T=join(ROOT,"src/tests");
const RED=new Set(JSON.parse(readFileSync(join(T,"known-red.json"),"utf8")).files);
const files=discoverTestFiles(T);
const bad=[], healed=[];
for(const f of files){
 const r=spawnSync(process.execPath,[join(T,f)],{encoding:"utf8",timeout:180000});
 const pass=r.status===0;
 if(!pass&&!RED.has(f)){bad.push(f); process.stdout.write((r.stdout||"").slice(-3000)+(r.stderr||"").slice(-2000))}
 if(pass&&RED.has(f))healed.push(f);
 console.log(`${pass?"✓":RED.has(f)?"·":"✗"} ${f}`);
}
[...RED].filter(f=>!files.includes(f)).forEach(f=>console.log(`! ${f} في known-red ولا ملفَّ بهذا الاسم — احذفه منها`));
healed.forEach(f=>console.log(`↑ ${f} خضرّ — احذفه من known-red.json`));
const redNow=RED.size-healed.length-[...RED].filter(f=>!files.includes(f)).length;
console.log(`\nنجح ${files.length-bad.length-redNow}/${files.length} · أحمرُ معروف: ${redNow} · جديدٌ أحمر: ${bad.length}`);
if(bad.length){console.log("✗ فشلٌ جديد: "+bad.join(" · ")); process.exit(1)}
