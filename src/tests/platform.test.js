/* طبقةُ المنصّة: في المتصفّح تبقى <a download>، وفي أندرويد تكتب عبر
   Filesystem وتشارك، وزرُّ الرجوع يحوّل إلى Escape. بلا متصفّح: محاكاةٌ دنيا. */
let pass=0, fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log("✗ "+m))};
const clicks=[], writes=[], shares=[], L={};
globalThis.window=globalThis;
globalThis.document={
 body:{appendChild(){}}, documentElement:{classList:{add(){}}}, activeElement:null,
 createElement:()=>({click(){clicks.push(this.download)},remove(){}}),
 dispatchEvent:()=>true
};
globalThis.URL.createObjectURL=()=>"blob:x"; globalThis.URL.revokeObjectURL=()=>{};
globalThis.FileReader=class{readAsDataURL(b){b.arrayBuffer().then(a=>{this.result="data:x;base64,"+Buffer.from(a).toString("base64");this.onload()})}};
const P=await import("../platform/index.js");
ok(!P.isNative(),"بلا Capacitor: متصفّح");
ok(P.saveBlob("a.dxf","abc","text/plain")===3,"الحجمُ يعود كما في dl()");
ok(clicks[0]==="a.dxf","المتصفّح: تنزيلٌ بالاسم");
window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{
 Filesystem:{writeFile:async o=>{writes.push(o);return{uri:"file:///D/"+o.path}}},
 Share:{share:async o=>{shares.push(o)}},
 App:{addListener:(n,f)=>{L[n]=f},exitApp(){L.exited=1}}}};
ok(P.isNative(),"Capacitor أصليّ");
const said=[]; P.setSay((lv,m)=>said.push(lv));
P.saveBlob("خطة/1.pdf","%PDF");
await new Promise(r=>setTimeout(r,30));
ok(writes.length===1&&writes[0].directory==="DOCUMENTS"&&writes[0].path==="CivilDraft/خطة_1.pdf","أندرويد: كتابةٌ في Documents باسمٍ آمن");
ok(Buffer.from(writes[0].data,"base64").toString()==="%PDF","المحتوى base64 سليم");
ok(shares.length===1&&shares[0].files[0].includes("CivilDraft"),"ثم مشاركة");
ok(said.includes("ok"),"إبلاغُ المستخدم");
let paused=0; globalThis.KeyboardEvent=class{constructor(t,o){Object.assign(this,o)}};
ok(P.initNative({onPause:()=>paused++}),"initNative في التطبيق");
L.appStateChange({isActive:false}); ok(paused===1,"الحفظُ عند الإيقاف");
L.backButton(); ok(!L.exited,"رجوعٌ أوّل لا يخرج");
L.backButton(); ok(L.exited===1,"رجوعٌ ثانٍ خلال ثانيتين يخرج");
console.log(fail?`\x1b[31m${pass}/${pass+fail} نجحت\x1b[0m`:`\x1b[32m${pass}/${pass} نجحت\x1b[0m`);
if(fail)process.exit(1);
