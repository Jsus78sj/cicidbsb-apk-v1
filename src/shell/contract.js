/* ═══ عقدُ القشرة ═══ المرحلة A
   القشرةُ = كلُّ ما يراه المستخدم حول القماش (أشرطة · أوراق · أزرار).
   النواة (core · tools · io) والقماش والإدخال الحركيّ مشتركةٌ لا تعرف
   أيّ قشرةٍ تعمل.

   كلّ قشرةٍ وحدةٌ تصدّر:
     id      : "desktop" | "mobile"
     ready   : هل هي مكتملةٌ للاستعمال؟ (غير المكتملة يُرجَع منها للمكتبية)
     mount(ctx) → {unmount()}
   والسياقُ ctx يحمل ما تحتاجه القشرة من التطبيق (HOOK · R · runSpec …)
   فلا تستورد app.js ولا يستوردها app.js إلّا عبر mountShell.

   التحميلُ ديناميكيّ: القشرة غيرُ المختارة لا تُحمَّل. */

const LOADERS={
 desktop:()=>import("./desktop/index.js"),
 mobile: ()=>import("./mobile/index.js")
};

let CUR=null;
export const currentShell=()=>CUR&&CUR.id;

/* تصحيحاتُ المراجعة (المرحلة B):
   · السقوطُ الآليّ إلى المكتبية صامت: كان كلُّ هاتفٍ يرى «قيد البناء» في
     السجلّ عند كلّ إقلاع وهو لم يطلب شيئاً. الرسالةُ لمن طلب صراحةً.
   · data-shell-active تُكتَب **قبل** mount فتسري mobile.css مع أوّل بناء.
   · mount يرمي ⇒ تُركَّب المكتبية ولا يبقى المستخدم بلا واجهة. */
export async function mountShell(id,ctx={}){
 const want=LOADERS[id]?id:"desktop";
 let mod=await LOADERS[want]();
 if(!mod.ready&&want!=="desktop"){
  if(ctx.preview){
   if(ctx.say)ctx.say(`معاينة قشرة «${want}» (قيد البناء) · ?shell=desktop للرجوع`);
  }else mod=await LOADERS.desktop();
 }
 if(CUR&&CUR.handle&&CUR.handle.unmount)CUR.handle.unmount();
 const d=globalThis.document&&document.documentElement;
 const mark=v=>{if(d&&d.dataset)d.dataset.shellActive=v};
 mark(mod.id);
 let handle;
 try{handle=(await mod.mount(ctx))||{}}
 catch(e){
  if(mod.id==="desktop")throw e;
  if(ctx.say)ctx.say(`تعذّر تركيب قشرة «${mod.id}»: ${(e&&e.message)||e} · تعمل المكتبية`);
  mod=await LOADERS.desktop();
  mark(mod.id);
  handle=(await mod.mount(ctx))||{};
 }
 CUR={id:mod.id,handle};
 return mod.id;
}
