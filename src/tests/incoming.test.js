/* ═══ فتحُ الملفّات من التطبيقات الأخرى · الاهتزاز · لوحةُ المفاتيح ═══ المرحلة F
   Capacitor مزيَّفٌ في الذاكرة: البيانُ يُقرأ ويُحذف قبل الملفّ (لا فتحَ مرّتين)،
   المساراتُ خارج incoming/ تُرفض، الحجمُ محدود، والنوعُ بالامتداد. ثم
   android-patch.js: البيانُ والـ MainActivity آمنان للتكرار وبلا محارفَ غير ASCII.
   (MainActivity تُرجم بـ javac على بدائل لواجهات Android — مسجَّلٌ في CHANGES.md.)
   التشغيل:  node src/tests/incoming.test.js                                */
import {shim,group,groupAsync,ok,eq,summary} from "./harness.js";
shim();
globalThis.window=globalThis;
const P=await import("../platform/index.js");
const AP=await import("../../scripts/android-patch.js");

await groupAsync("في المتصفّح لا شيء",async()=>{
 eq(await P.takeIncoming(),null,"takeIncoming ⇐ null");
 eq(P.onIncoming(()=>{}),false,"onIncoming لا يُركَّب");
 eq(P.haptic("tap"),false,"ولا اهتزاز");
 eq(P.initKeyboard(),false,"ولا لوحة مفاتيح");
});

const FILES=new Map(), L={}, EV={}, IMP=[];
const k=o=>(o.directory||"")+":"+o.path;
window.addEventListener=(n,f)=>{EV[n]=f};
window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{
 Filesystem:{
  readFile:async o=>{if(!FILES.has(k(o)))throw new Error("nf"); return {data:FILES.get(k(o))}},
  deleteFile:async o=>{if(!FILES.delete(k(o)))throw new Error("nf")}},
 App:{addListener:(n,f)=>{L[n]=f}},
 Haptics:{impact:o=>IMP.push(o.style)},
 Keyboard:{addListener:(n,f)=>{L[n]=f}}}};
const D=P.INCOMING.dir;
const put=(name,txt,extra)=>{
 FILES.set(D+":incoming/f_"+name,Buffer.from(txt,"latin1").toString("base64"));
 FILES.set(D+":"+P.INCOMING.manifest,JSON.stringify(Object.assign({name,path:"incoming/f_"+name,size:txt.length,t:1},extra||{})));
};

await groupAsync("الملفُّ الواصل",async()=>{
 put("مخطط.dxf","0\nSECTION\n\xe3");
 const f=await P.takeIncoming();
 eq(f&&f.name,"مخطط.dxf","الاسمُ كما أرسله التطبيق");
 ok(f&&f.bytes instanceof Uint8Array&&f.bytes.length===11,"البايتاتُ كما هي");
 eq(f.bytes[10],0xe3,"بايتٌ CP1256 لم يُفسده ترميزٌ نصّيّ");
 ok(!FILES.has(D+":"+P.INCOMING.manifest),"البيانُ حُذف");
 ok(!FILES.has(D+":incoming/f_مخطط.dxf"),"والملفُّ المؤقّت حُذف");
 eq(await P.takeIncoming(),null,"قراءةٌ ثانية ⇐ لا شيء (لا فتحَ مرّتين)");
});
await groupAsync("قراءتان متزامنتان ⇐ فتحٌ واحد",async()=>{
 put("a.json","{}");
 const [x,y]=await Promise.all([P.takeIncoming(),P.takeIncoming()]);
 ok(x===y&&x&&x.name==="a.json","الوعدُ نفسُه");
});
await groupAsync("الحدود",async()=>{
 FILES.set(D+":"+P.INCOMING.manifest,JSON.stringify({name:"x",path:"../../files/CivilDraft/autosave.json",size:1}));
 eq(await P.takeIncoming(),null,"مسارٌ خارج incoming/ ⇐ مرفوض");
 put("big.dxf","x",{size:P.MAX_IN+1});
 const b=await P.takeIncoming();
 ok(b&&b.err&&/40/.test(b.err),"أكبر من 40 م.ب ⇐ رسالةٌ لا قراءة");
 FILES.set(D+":"+P.INCOMING.manifest,"{مقطوع");
 eq(await P.takeIncoming(),null,"بيانٌ تالف ⇐ null لا رمي");
});
await groupAsync("onIncoming: الإقلاعُ والحدثُ والعودة",async()=>{
 const got=[];
 put("boot.dxf","1");
 ok(P.onIncoming(f=>got.push(f.name)),"مُركَّب");
 await new Promise(r=>setTimeout(r,10));
 eq(got.join(),"boot.dxf","ملفُّ الإقلاع البارد");
 ok(typeof EV.cdIncoming==="function","يسمع cdIncoming");
 ok(typeof L.resume==="function","ويسمع resume");
 put("live.json","{}"); EV.cdIncoming();
 await new Promise(r=>setTimeout(r,10));
 eq(got.join(),"boot.dxf,live.json","والتطبيقُ مفتوح");
 L.resume(); await new Promise(r=>setTimeout(r,10));
 eq(got.length,2,"عودةٌ بلا ملفّ ⇐ لا شيء");
});
group("النوعُ بالامتداد",()=>{
 eq(P.incomingKind("A.DXF"),"dxf","DXF");
 eq(P.incomingKind("بيت.json"),"project","مشروع JSON");
 eq(P.incomingKind("old.mistar"),"project","الاسمُ القديم");
 eq(P.incomingKind("x.dwg"),null,"DWG ⇐ لا");
 eq(P.incomingKind(""),null,"بلا اسم");
});
await groupAsync("الاهتزازُ ولوحةُ المفاتيح",async()=>{
 ok(P.haptic("tap"),"نقطة");
 eq(P.haptic("snap"),false,"خلال 40 مللي ⇐ لا طنين");
 await new Promise(r=>setTimeout(r,50));
 ok(P.haptic("snap"),"التقاط");
 eq(IMP.join(),"LIGHT,MEDIUM","خفيفٌ للنقطة وأوضحُ للالتقاط");
 const cls=new Set();
 globalThis.document={documentElement:{classList:{add:c=>cls.add(c),remove:c=>cls.delete(c)}},activeElement:null};
 ok(P.initKeyboard(),"مُركَّب");
 L.keyboardDidShow(); ok(cls.has("kb-open"),"ظهرت ⇐ kb-open");
 L.keyboardDidHide(); ok(!cls.has("kb-open"),"اختفت ⇐ تُزال");
});
group("android-patch.js",()=>{
 const x=`<manifest><application><activity android:name=".MainActivity">\n</activity></application></manifest>`;
 const y=AP.withIntentFilters(x);
 ok(y.includes("android.intent.action.VIEW")&&y.includes("android.intent.action.SEND"),"VIEW وSEND");
 AP.MIMES.forEach(t=>ok(y.split(`mimeType="${t}"`).length===3,`${t} في المرشّحين`));
 ok(y.indexOf(AP.MARK)<y.indexOf("</activity>"),"داخل <activity>");
 eq(AP.withIntentFilters(y),y,"آمنٌ للتكرار");
 const j=AP.mainActivity("com.civildraft.app");
 ok(!/[^\x00-\x7f]/.test(j),"MainActivity بلا محارف غير ASCII (ترميزُ javac)");
 ok(/package com\.civildraft\.app;/.test(j),"الحزمة");
 ok(/setTextZoom\(100\)/.test(j),"textZoom باقٍ");
 ok(/onNewIntent/.test(j)&&/triggerWindowJSEvent\("cdIncoming"\)/.test(j),"التطبيقُ المفتوحُ يُبلَّغ");
 ok(/"incoming\/" \+ out\.getName\(\)/.test(j)&&/pending\.json/.test(j),"المسارُ والبيانُ كما يقرؤهما الويب");
 ok(new RegExp(`MAX_IN = ${P.MAX_IN/1048576}L \\* 1024 \\* 1024`).test(j),"الحدُّ نفسُه في الطرفين");
});
summary();
