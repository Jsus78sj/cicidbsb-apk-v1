/* ═══ عقدُ البناء الآليّ ═══ المرحلة C
   GitHub Actions لا يُشغَّل هنا، فنقيس ما يمكن قياسه بلا شبكة: كلُّ أمرٍ
   npm يذكره الملفُّ موجودٌ في package.json، وكلُّ ملفٍّ يمسّه موجود،
   والتوقيعُ لا يُسرَّب، وقائمةُ الأحمر المعروف صادقة.
   التشغيل:  node src/tests/ci-workflow.test.js                         */
import {readFileSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {group,ok,eq,summary} from "./harness.js";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"../..");
const rd=p=>readFileSync(join(ROOT,p),"utf8");
const W=existsSync(join(ROOT,".github/workflows/android.yml"))?rd(".github/workflows/android.yml"):"";
const PKG=JSON.parse(rd("package.json"));

group("الملفُّ موجودٌ ويُشغَّل حيث يجب",()=>{
 ok(W.length>0,".github/workflows/android.yml موجود");
 ok(/^name:\s*Android APK/m.test(W),"اسمُه كما في docs/ANDROID.md");
 ok(/branches:\s*\[main\]/.test(W),"دفعٌ إلى main");
 ok(/workflow_dispatch:/.test(W),"وتشغيلٌ يدويّ");
 ok(/contents:\s*write/.test(W),"وإذنُ الكتابة للـ Releases");
 ok(!/\t/.test(W),"YAML بلا علامات جدولة");
});
group("كلُّ أمر npm موجود",()=>{
 const used=[...W.matchAll(/npm run ([\w:.-]+)/g)].map(m=>m[1]);
 ok(used.length>=2,`${used.length} أمراً`);
 used.forEach(s=>ok(!!PKG.scripts[s],`npm run ${s}`));
 ok(used.indexOf("test:ci")>-1&&W.indexOf("test:ci")<W.indexOf("build:android"),"الاختباراتُ قبل البناء");
});
group("كلُّ ملفٍّ يذكره موجود",()=>{
 ["scripts/android-patch.js","icons/icon-maskable-512.png"].forEach(f=>{
  ok(W.includes(f),`${f} مذكور`); ok(existsSync(join(ROOT,f)),`${f} موجود`)});
 ["scripts/build-android.js","scripts/ci-tests.js","capacitor.config.json"]
  .forEach(f=>ok(existsSync(join(ROOT,f)),`${f} موجود`));
 ok(/android-patch\.js "\$VERSION_CODE"/.test(W),"versionCode من رقم التشغيل");
});
group("التوقيعُ لا يتسرّب",()=>{
 ok(/HAS_KEY:\s*\$\{\{\s*secrets\.ANDROID_KEYSTORE_BASE64 != ''\s*\}\}/.test(W),"debug بلا أسرار");
 ["ANDROID_KEYSTORE_BASE64","ANDROID_KEYSTORE_PASSWORD","ANDROID_KEY_ALIAS","ANDROID_KEY_PASSWORD"]
  .forEach(k=>ok(W.includes("secrets."+k)&&rd("docs/ANDROID.md").includes(k),`${k} في الملفّ والوثيقة`));
 ok(/RUNNER_TEMP\/civildraft\.jks/.test(W)&&/rm -f "\$RUNNER_TEMP\/civildraft\.jks"/.test(W),"المفتاحُ خارج المستودع ويُحذف");
 const gi=existsSync(join(ROOT,".gitignore"))?rd(".gitignore"):"";
 ["*.jks","*.keystore","android/","www/","node_modules/"].forEach(p=>ok(gi.split("\n").includes(p),`.gitignore: ${p}`));
});
group("قائمةُ الأحمر المعروف صادقة",()=>{
 const R=JSON.parse(rd("src/tests/known-red.json")).files;
 ok(Array.isArray(R),"مصفوفة");
 R.forEach(f=>ok(existsSync(join(ROOT,"src/tests",f)),`${f} موجود`));
 ok(!R.includes("ci-workflow.test.js")&&!R.includes("native-backup.test.js")&&!R.includes("layers-boundary.test.js"),"وحرّاسُ إعادة الهيكلة ليست فيها");
 eq(PKG.scripts["test:ci"],"node scripts/ci-tests.js","npm run test:ci");
});
group("المرحلة G: التوقيعُ والإصدار",()=>{
 ok(/apksigner" verify --print-certs/.test(W),"التوقيعُ يُتحقَّق وبصمتُه تُطبع");
 const sh=rd("scripts/make-keystore.sh"), ps=rd("scripts/make-keystore.ps1");
 ok(/set -euo pipefail/.test(sh),"السكربت يقف عند أوّل خطأ");
 ok(/موجودٌ أصلاً — لن يُكتب فوقه/.test(sh)&&/not overwritten/.test(ps),"لا يكتب فوق مفتاحٍ موجود (مفتاحٌ جديد = تطبيقٌ لا يُحدَّث)");
 ok(/\$HOME\/civildraft-signing/.test(sh)&&/civildraft-signing/.test(ps),"المفتاحُ خارج المستودع");
 ["ANDROID_KEYSTORE_BASE64","ANDROID_KEYSTORE_PASSWORD","ANDROID_KEY_ALIAS","ANDROID_KEY_PASSWORD"]
  .forEach(k=>ok(sh.includes(k)&&ps.includes(k),`${k} في السكربتين`));
 ok(/-keysize 4096/.test(sh)&&/-keysize 4096/.test(ps),"RSA 4096");
 const v=PKG.version, ver=rd("src/core/version.js"), sw=rd("sw.js");
 ok(ver.includes(`VERSION="${v}"`)&&sw.includes(`VERSION="${v}"`),`الإصدار ${v} في الثلاثة`);
 ok(existsSync(join(ROOT,"docs/PHASE16-ANDROID-DEVICE-GATE.md")),"بوّابةُ الجهاز موثّقة");
});
summary();
