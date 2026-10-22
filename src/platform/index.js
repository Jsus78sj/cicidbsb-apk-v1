/* ═══ طبقة المنصّة — متصفّحٌ أو تطبيقُ أندرويد (Capacitor) ═══
   نقطةٌ واحدةٌ لكلّ ما يختلف بين المتصفّح والتطبيق:
   · الحفظ: في المتصفّح <a download>، وفي التطبيق لا يعمل التنزيل داخل
     WebView، فيُكتب الملفُّ في Documents/CivilDraft ثم تُفتح نافذةُ المشاركة.
   · دورةُ الحياة: beforeunload لا يصل على أندرويد، فالحفظُ عند الإيقاف.
   · زرُّ الرجوع: يُغلق المفتوح كما يفعل Escape، وضغطتان للخروج.
   بلا اعتماديات: الإضافاتُ تُقرأ من window.Capacitor الذي يحقنه الجسرُ
   الأصليّ، فلا استيرادَ لحزم npm ولا بناءَ إلزاميّ. */

const CAP=()=>(typeof window!=="undefined"&&window.Capacitor)||null;
export const isNative=()=>{
 const c=CAP();
 try{return !!(c&&(c.isNativePlatform?c.isNativePlatform():c.platform!=="web"))}
 catch(e){return false}
};
export const platform=()=>{const c=CAP(); try{return c?(c.getPlatform?c.getPlatform():c.platform):"web"}catch(e){return "web"}};

function plugin(name){
 const c=CAP(); if(!c)return null;
 try{ if(c.Plugins&&c.Plugins[name])return c.Plugins[name] }catch(e){}
 try{ if(typeof c.registerPlugin==="function")return c.registerPlugin(name) }catch(e){}
 return null;
}

let SAY=null;
export function setSay(fn){SAY=fn}
const say=(lv,m)=>{try{SAY&&SAY(lv,m)}catch(e){}};

function blobToB64(b){
 return new Promise((res,rej)=>{
  const r=new FileReader();
  r.onload=()=>{const s=String(r.result||""); res(s.slice(s.indexOf(",")+1))};
  r.onerror=()=>rej(r.error||new Error("قراءةُ الملفّ فشلت"));
  r.readAsDataURL(b);
 });
}
const safeName=n=>String(n||"civildraft").replace(/[\\/:*?"<>|]+/g,"_").slice(0,120);

function browserSave(blob,name,keepMs=1500){
 const u=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=u; a.download=name;
 document.body.appendChild(a); a.click();
 setTimeout(()=>{URL.revokeObjectURL(u); a.remove()},keepMs);
}

async function nativeSave(blob,name){
 const FS=plugin("Filesystem");
 if(!FS)throw new Error("إضافةُ Filesystem غير مثبّتة");
 const data=await blobToB64(blob);
 const path="CivilDraft/"+safeName(name);
 let res=null, where="Documents/CivilDraft";
 try{ res=await FS.writeFile({path,data,directory:"DOCUMENTS",recursive:true}) }
 catch(e){ res=await FS.writeFile({path,data,directory:"CACHE",recursive:true}); where=null }
 const uri=res&&res.uri;
 const SH=plugin("Share");
 if(SH&&uri){
  try{ await SH.share({title:name,files:[uri]}) }
  catch(e){ try{await SH.share({title:name,url:uri})}catch(e2){} }
 }
 say("ok",where?`حُفظ «${name}» في ${where}`:`«${name}» جاهزٌ للمشاركة`);
 return uri;
}

/* الواجهةُ الوحيدةُ للحفظ: تُعيد الحجمَ متزامناً كما كانت dl() القديمة،
   والكتابةُ الأصليةُ تجري في الخلفية وتُبلَّغ نتيجتُها. */
export function saveBlob(name,data,mime,keepMs){
 const b=(data instanceof Blob)?data
  :new Blob([data],{type:mime||"application/octet-stream"});
 if(isNative()){
  nativeSave(b,name).catch(e=>{
   say("er","تعذّر حفظ الملفّ: "+((e&&e.message)||e));
  });
 }else browserSave(b,name,keepMs);
 return b.size;
}

/* ═══ دورةُ الحياة وزرُّ الرجوع ═══ */
let lastBack=0;
export function initNative({onPause,onBack}={}){
 if(!isNative())return false;
 try{document.documentElement.classList.add("native","plat-"+platform())}catch(e){}
 const App=plugin("App");
 if(App&&App.addListener){
  try{App.addListener("appStateChange",s=>{ if(s&&!s.isActive&&onPause)onPause() })}catch(e){}
  try{App.addListener("pause",()=>{ onPause&&onPause() })}catch(e){}
  try{App.addListener("backButton",()=>{
   /* المرحلة ٣ من خطّة الهاتف: الواجهةُ تملك الترتيب (ui/backnav.js) —
      أداةٌ ثمّ مفتوحٌ ثمّ تحديد. ما عالجته لا يقترب من الخروج. */
   if(typeof onBack==="function"){
    let r=null; try{r=onBack()}catch(e){r=null}
    if(r){lastBack=0; return}
    const now=Date.now();
    if(now-lastBack<2000){ try{onPause&&onPause()}catch(e){} App.exitApp&&App.exitApp(); return }
    lastBack=now; say("in","اضغط رجوع مرّةً أخرى للخروج"); return;
   }
   /* Escape اصطناعيّ: يُغلق المساعد/القوائم/الأداة الجارية بالترتيب نفسه
      الذي يتبعه الكيبورد (ui/keymap.js). وإن لم يكن شيءٌ مفتوحاً فضغطتان
      خلال ثانيتين تُخرجان (مع حفظٍ قبل الخروج). */
   const ev=new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true});
   const t=document.activeElement&&document.activeElement!==document.body?document.activeElement:document;
   if(document.activeElement&&document.activeElement.blur&&/input|textarea|select/i.test(document.activeElement.tagName||""))
    document.activeElement.blur();
   const handled=!t.dispatchEvent(ev);
   if(handled){lastBack=0; return}
   const now=Date.now();
   if(now-lastBack<2000){ try{onPause&&onPause()}catch(e){} App.exitApp&&App.exitApp(); return }
   lastBack=now; say("in","اضغط رجوع مرّةً أخرى للخروج");
  })}catch(e){}
 }
 const SB=plugin("StatusBar");
 if(SB){ try{SB.setOverlaysWebView&&SB.setOverlaysWebView({overlay:false})}catch(e){}
  try{SB.setBackgroundColor&&SB.setBackgroundColor({color:"#0f172a"})}catch(e){} }
 const SP=plugin("SplashScreen");
 if(SP){ try{setTimeout(()=>SP.hide&&SP.hide(),300)}catch(e){} }
 return true;
}

/* ═══ النسخةُ الاحتياطيةُ داخل التطبيق ═══ المرحلة B
   WebView يحفظ المشروعَ في IndexedDB (io/store.js) — يكفي عادةً، لكنّه
   صندوقٌ أسود: تلفُ قاعدة WebView أو ترقيتُه أو «مسحُ بيانات الموقع»
   يُضيّعه، وAndroid Auto Backup لا يرى داخله. فنكتب نسخةً JSON عاديةً
   في مجلّد بيانات التطبيق (Directory.Data) يراها النسخُ الاحتياطيّ للنظام.

   المقبضُ بعقد File System Access نفسه (createWritable ← write ← close)
   فيركَب في io/backup.js بلا فرعٍ ثانٍ للكتابة. والكتابةُ ذرّيةٌ تقريباً:
   tmp أوّلاً، ثم القديمُ ← bak، ثم tmp ← الأساسي. انقطاعٌ في أيّ لحظةٍ
   يترك ملفاً واحداً كاملاً على الأقلّ، وreadNativeBackup تجرّبها بالترتيب. */
export const NB={dir:"DATA", main:"CivilDraft/autosave.json",
 tmp:"CivilDraft/autosave.tmp.json", bak:"CivilDraft/autosave.bak.json"};

export function nativeBackupHandle(){
 if(!isNative())return null;
 const FS=plugin("Filesystem");
 if(!FS||typeof FS.writeFile!=="function")return null;
 const D=NB.dir;
 return {
  name:"autosave.json (داخل التطبيق)", native:1,
  createWritable:async()=>{
   let buf="";
   return {
    write:async t=>{buf+=String(t==null?"":t)},
    close:async()=>{
     await FS.writeFile({path:NB.tmp,data:buf,directory:D,encoding:"utf8",recursive:true});
     try{await FS.deleteFile({path:NB.bak,directory:D})}catch(e){}
     try{await FS.rename({from:NB.main,to:NB.bak,directory:D,toDirectory:D})}catch(e){}
     await FS.rename({from:NB.tmp,to:NB.main,directory:D,toDirectory:D});
    }
   };
  }
 };
}

/* أحدثُ نسخةٍ صالحة: الأساسي ← المؤقّت (انقطاعٌ بعد نقل القديم) ← السابق.
   «صالحة» = JSON فيه مصفوفةُ جدران؛ والتحقّقُ الكامل لـ fromJSON بعدها. */
export async function readNativeBackup(){
 if(!isNative())return null;
 const FS=plugin("Filesystem");
 if(!FS||typeof FS.readFile!=="function")return null;
 for(const path of [NB.main,NB.tmp,NB.bak]){
  try{
   const r=await FS.readFile({path,directory:NB.dir,encoding:"utf8"});
   const txt=(r&&typeof r.data==="string")?r.data:"";
   if(!txt)continue;
   const d=JSON.parse(txt);
   if(d&&Array.isArray(d.walls))return {txt,path};
  }catch(e){}
 }
 return null;
}

/* ═══ المرحلة F · ملفٌّ وصل من تطبيقٍ آخر ═══
   MainActivity (scripts/android-patch.js) ينسخه إلى cache/incoming/ ويكتب
   pending.json {name,path,size,t} ثم يطلق cdIncoming على window. هنا يُقرأ
   البيانُ ويُحذف **قبل** قراءة الملفّ، فحدثٌ مكرّرٌ أو إقلاعٌ متزامن لا يفتح
   الملفَّ مرّتين، والقراءةُ base64 لأن DXF قد يكون CP1256 لا UTF-8. */
export const MAX_IN=40*1024*1024;          /* يطابق MAX_IN في MainActivity */
export const INCOMING={dir:"CACHE", manifest:"incoming/pending.json"};
let INFLIGHT=null;
export function takeIncoming(){
 if(!isNative())return Promise.resolve(null);
 if(INFLIGHT)return INFLIGHT;
 INFLIGHT=(async()=>{
  const FS=plugin("Filesystem");
  if(!FS||typeof FS.readFile!=="function")return null;
  let man=null;
  try{
   const r=await FS.readFile({path:INCOMING.manifest,directory:INCOMING.dir,encoding:"utf8"});
   man=JSON.parse(r&&r.data||"null");
  }catch(e){return null}                      /* لا ملفَّ ينتظر */
  try{await FS.deleteFile({path:INCOMING.manifest,directory:INCOMING.dir})}catch(e){}
  if(!man||typeof man.path!=="string"||!/^incoming\/[^/]+$/.test(man.path))return null;
  if(+man.size>MAX_IN)return {name:String(man.name||""),err:"الملفّ أكبر من 40 م.ب"};
  try{
   const r=await FS.readFile({path:man.path,directory:INCOMING.dir});
   const b64=String(r&&r.data||"");
   const bin=atob(b64), bytes=new Uint8Array(bin.length);
   for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
   try{await FS.deleteFile({path:man.path,directory:INCOMING.dir})}catch(e){}
   return {name:String(man.name||"file"),bytes};
  }catch(e){return {name:String(man.name||""),err:"تعذّرت قراءةُ الملفّ"}}
 })().finally(()=>{INFLIGHT=null});
 return INFLIGHT;
}
/* يُنادى cb لكلّ ملفٍّ يصل: عند الإقلاع (التطبيقُ فُتح به) وعند الحدث
   (التطبيقُ مفتوحٌ أصلاً) وعند العودة إلى الواجهة (احتياطٌ إن فات الحدث). */
export function onIncoming(cb){
 if(!isNative()||typeof cb!=="function")return false;
 const pull=()=>takeIncoming().then(f=>{if(f)cb(f)}).catch(()=>{});
 try{window.addEventListener("cdIncoming",pull)}catch(e){}
 const App=plugin("App");
 if(App&&App.addListener){try{App.addListener("resume",pull)}catch(e){}}
 pull();
 return true;
}
/* أيُّ نوعٍ يفتحه التطبيق — بالامتداد لا بـ MIME (واتساب يرسل octet-stream) */
export function incomingKind(name){
 const n=String(name||"").toLowerCase();
 if(/\.dxf$/.test(n))return "dxf";
 if(/\.(json|mistar|civildraft)$/.test(n))return "project";
 return null;
}

/* ═══ المرحلة F · اهتزازٌ خفيف ═══ تأكيدُ النقطة تحت الإصبع: الإصبعُ يغطّي
   ما يرسمه، فالاهتزازُ هو ما يقول «وُضعت» و«التقطت». في المتصفّح لا شيء. */
let HAPT_AT=0;
export function haptic(kind){
 /* المرحلة ٧ من خطّة الهاتف: في متصفّح الهاتف (PWA) لا Capacitor —
    navigator.vibrate بديلٌ أقصر (أندرويد/كروم؛ سفاري يتجاهله بصمت) */
 if(!isNative()){
  try{
   if(typeof navigator==="undefined"||typeof navigator.vibrate!=="function")return false;
   if(typeof matchMedia==="function"&&!matchMedia("(pointer:coarse)").matches)return false;
   const now=Date.now();
   if(now-HAPT_AT<40)return false;
   HAPT_AT=now;
   return !!navigator.vibrate(kind==="snap"?14:8);
  }catch(e){return false}
 }
 const H=plugin("Haptics");
 if(!H||typeof H.impact!=="function")return false;
 const now=Date.now();
 if(now-HAPT_AT<40)return false;            /* لا طنينَ متواصل */
 HAPT_AT=now;
 try{H.impact({style:kind==="snap"?"MEDIUM":"LIGHT"})}catch(e){return false}
 return true;
}

/* ═══ المرحلة F · لوحةُ المفاتيح ═══ adjustResize يُقصّر الصفحة، فالشريطُ
   السفليُّ الثابتُ يصعد فوق اللوحة ويأكل نصفَ ما بقي. html.kb-open تُخفيه
   (touch.css) ما دامت اللوحةُ ظاهرة، والحقلُ المركَّز يُمرَّر إلى العرض. */
export function initKeyboard(){
 if(!isNative())return false;
 const K=plugin("Keyboard");
 if(!K||typeof K.addListener!=="function")return false;
 const root=document.documentElement;
 const on=()=>{root.classList.add("kb-open");
  const a=document.activeElement;
  if(a&&a.scrollIntoView&&/input|textarea/i.test(a.tagName||""))
   setTimeout(()=>{try{a.scrollIntoView({block:"nearest"})}catch(e){}},60)};
 const off=()=>root.classList.remove("kb-open");
 try{K.addListener("keyboardWillShow",on); K.addListener("keyboardDidShow",on)}catch(e){}
 try{K.addListener("keyboardWillHide",off); K.addListener("keyboardDidHide",off)}catch(e){}
 return true;
}
