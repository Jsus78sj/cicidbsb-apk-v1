/* ═══ النسخةُ الاحتياطيةُ داخل تطبيق أندرويد ═══ المرحلة B
   Filesystem مزيَّفٌ في الذاكرة يقيس العقد: الكتابةُ بثلاثة ملفّات
   (tmp ← bak ← الأساسي)، القراءةُ تتدرّج عند التلف، io/backup.js يفعّلها
   تلقائياً في التطبيق، وإطفاءُ المستخدم يُحترَم بعد إعادة التشغيل.
   التشغيل:  node src/tests/native-backup.test.js                     */
import {shim,groupAsync,ok,eq,summary} from "./harness.js";
shim();
globalThis.window=globalThis;
const P=await import("../platform/index.js");
const B=await import("../io/backup.js");

await groupAsync("في المتصفّح: لا شيءَ يتغيّر",async()=>{
 eq(P.nativeBackupHandle(),null,"لا مقبضَ أصليّ");
 eq(await P.readNativeBackup(),null,"ولا قراءة");
 const r=await B.restore();
 ok(!r.ok,"restore كما كانت: لا مقبضَ محفوظ");
});

const FILES=new Map(), log=[];
const k=(o,p)=>(o.directory||"")+":"+(p||o.path);
const FS={
 writeFile:async o=>{log.push("w:"+o.path); FILES.set(k(o),o.data); return {uri:"file:///"+o.path}},
 readFile:async o=>{if(!FILES.has(k(o)))throw new Error("لا ملفّ"); return {data:FILES.get(k(o))}},
 deleteFile:async o=>{if(!FILES.delete(k(o)))throw new Error("لا ملفّ")},
 rename:async o=>{const a=o.directory+":"+o.from, b=(o.toDirectory||o.directory)+":"+o.to;
  if(!FILES.has(a))throw new Error("لا ملفّ"); FILES.set(b,FILES.get(a)); FILES.delete(a); log.push("mv:"+o.from+">"+o.to)}
};
window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{Filesystem:FS}};
const doc=n=>JSON.stringify({__app:"civildraft",walls:Array.from({length:n},(_,i)=>({id:i}))});
const write=async t=>{const w=await P.nativeBackupHandle().createWritable(); await w.write(t); await w.close()};
const D=P.NB.dir, main=D+":"+P.NB.main, bak=D+":"+P.NB.bak, tmp=D+":"+P.NB.tmp;

await groupAsync("الكتابةُ في مجلّد بيانات التطبيق",async()=>{
 const h=P.nativeBackupHandle();
 ok(h&&h.native===1,"مقبضٌ أصليٌّ في التطبيق");
 eq(D,"DATA","Directory.Data — يراه Auto Backup ولا يراه المستخدم");
 await write(doc(1));
 eq(FILES.get(main),doc(1),"الأساسيُّ كُتب");
 ok(!FILES.has(tmp),"ولا tmp باقٍ");
 await write(doc(2));
 eq(FILES.get(main),doc(2),"الأحدثُ في الأساسي");
 eq(FILES.get(bak),doc(1),"والسابقُ في bak");
 ok(log.indexOf("w:"+P.NB.tmp)<log.lastIndexOf("mv:"+P.NB.tmp+">"+P.NB.main),"tmp يُكتب قبل أن يصير أساسياً");
});

await groupAsync("القراءةُ تتدرّج عند التلف",async()=>{
 let r=await P.readNativeBackup();
 eq(r&&r.path,P.NB.main,"السليمُ: الأساسي");
 eq(JSON.parse(r.txt).walls.length,2,"بمحتواه");
 FILES.set(main,"{مقطوع");
 r=await P.readNativeBackup();
 eq(r&&r.path,P.NB.bak,"الأساسيُّ تالف ⇒ bak");
 FILES.delete(main); FILES.set(tmp,doc(3));
 r=await P.readNativeBackup();
 eq(r&&r.path,P.NB.tmp,"انقطاعٌ بعد نقل القديم ⇒ tmp الكامل");
 FILES.clear();
 eq(await P.readNativeBackup(),null,"لا شيء ⇒ null لا رمي");
});

await groupAsync("io/backup.js في التطبيق: تلقائيةٌ ويُحترَم الإطفاء",async()=>{
 ok(B.supported(),"مدعومةٌ بلا showSaveFilePicker");
 let r=await B.restore();
 ok(r.ok&&r.native===1,"تُفعَّل تلقائياً عند الإقلاع");
 ok(B.backupState().on===1,"والحالةُ مُفعَّلة");
 const w=await B.writeNow(doc(4));
 ok(w.ok,"الكتابةُ عبر المسار المعتاد تمرّ");
 eq(FILES.get(main),doc(4),"وتصل الملفّ");
 await B.disable();
 r=await B.restore();
 ok(!r.ok&&r.off===1,"أطفأها المستخدم ⇒ تبقى مطفأةً بعد إعادة التشغيل");
 r=await B.enable();
 ok(r.ok&&r.native===1,"وتفعيلُها يدوياً بلا منتقي ملفّات");
 r=await B.restore();
 ok(r.ok,"ثم تعود تلقائيةً");
});
await groupAsync("نصُّ النسخة مشروعٌ لا سلسلةٌ مُرمَّزةٌ مرّتين",async()=>{
 /* كشفه تشغيلٌ حقيقيٌّ في Chromium (المرحلة D): toJSON تُعيد نصّاً أصلاً،
    وJSON.stringify فوقه كتب في الملفّ سلسلةً بين علامتَي تنصيص — فلا
    readNativeBackup تقبلها ولا «فتح» يفتحها. والعيبُ أقدمُ من أندرويد. */
 const {readFileSync}=await import("node:fs");
 const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 ok(/bkSchedule\(projToJSON\(\)\)/.test(app),"bkSchedule(projToJSON()) مباشرةً");
 ok(!/JSON\.stringify\(projToJSON\(\)\)/.test(app),"ولا JSON.stringify فوقها");
});
summary();
