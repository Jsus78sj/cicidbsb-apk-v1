/* ═══ اختيارُ القشرة ═══ المرحلة A من خطّة إعادة الهيكلة
   مصدرُ الحقيقة الوحيد لسؤال «هل هذا هاتف؟». كانت الإجابة موزّعةً على
   ستّ نقاط توقّف في CSS (480/640/768/900/1080/1100) تتراكم مع
   pointer:coarse؛ من المرحلة B فصاعداً تقرأ قشرةُ الهاتف وأنماطُها
   `html[data-chrome="mobile"]` وحده.
   ولم تُستعمل `data-shell` لأن الشريطَ (ribbon/wire.js · app.js) يكتب
   عليها «ribbon/classic» فيمسح القيمة كلّما بُني. (كشفه اختبار المرحلة B.)

   القاعدة: لمسٌ خشن **و** أقصرُ ضلعٍ للشاشة < 600 ⇒ هاتف. اللوحُ
   (أقصر ضلعٍ ≥ 600) يبقى على القشرة المكتبية بطبقة اللمس الحالية.
   والضلعُ الأقصر لا العرض: الهاتف الأفقيّ هاتفٌ أيضاً.

   التجاوز اليدويّ (للاختبار وللمستخدم): ?shell=mobile|desktop في
   الرابط أو localStorage["cd.shell"]. الرابط أقوى ويُحفَظ.
   ?safe يتجاهل المحفوظ كما يتجاهل بقيّةَ التفضيلات. */

export const SHELLS=Object.freeze(["desktop","mobile"]);
export const PHONE_MAX_SHORT=600;
const KEY="cd.shell";

/* دالّةٌ خالصة — مختبَرة */
export function pickShell({coarse=false,w=0,h=0,override=null}={}){
 if(override&&SHELLS.includes(override))return override;
 const short=Math.min(+w||0,+h||0);
 return (coarse&&short>0&&short<PHONE_MAX_SHORT)?"mobile":"desktop";
}

export function readOverride(win=globalThis){
 try{
  const q=new URLSearchParams((win.location&&win.location.search)||"");
  const u=q.get("shell");
  if(u&&SHELLS.includes(u)){
   try{win.localStorage&&win.localStorage.setItem(KEY,u)}catch(e){}
   return u;
  }
  if(q.has("safe"))return null;
  const s=win.localStorage&&win.localStorage.getItem(KEY);
  return SHELLS.includes(s)?s:null;
 }catch(e){return null}
}

export function setOverride(v,win=globalThis){
 try{
  if(v&&SHELLS.includes(v))win.localStorage.setItem(KEY,v);
  else win.localStorage.removeItem(KEY);
 }catch(e){}
}

export function detectShell(win=globalThis){
 const mm=q=>{try{return !!(win.matchMedia&&win.matchMedia(q).matches)}catch(e){return false}};
 const sc=win.screen||{};
 return pickShell({
  coarse:mm("(pointer:coarse)"),
  w:sc.width||win.innerWidth||0,
  h:sc.height||win.innerHeight||0,
  override:readOverride(win)
 });
}

/* يكتب السمة على <html> فيقرأها CSS قبل أوّل رسمٍ للواجهة */
export function applyShellAttr(win=globalThis){
 const id=detectShell(win);
 const d=win.document&&win.document.documentElement;
 if(d&&d.dataset)d.dataset.chrome=id;
 return id;
}
