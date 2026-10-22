/* ═══ زرٌّ عائمٌ يُسحَب ═══ المرحلة ٣ من خطّة الهاتف
   زرُّ المساعدة العائم ثابتٌ في ركنٍ واحد، وعلى الهاتف يقع فوق أداةٍ أو
   فوق ما يُرسَم. الآن يُمسَك ويُنقَل بالإصبع (أو بالفأرة) إلى أيّ موضع،
   ويُحفَظ موضعُه بين الجلسات. والنقرةُ تبقى نقرةً: لا يُعَدّ سحباً إلّا
   ما تجاوز ٨ بكسلات، وما كان سحباً لا يفتح المساعد.
   والموضعُ يُكتَب متغيّرين (--fabX من جهة البدء · --fabY من الأعلى) لا
   left/right: الجهةُ تتبع اتجاه الصفحة، فالسحبُ يصحّ في RTL وLTR.
   placeFab خالصةٌ ومختبَرة. */
const KEY="civildraft.fabpos";
const SLOP=8, M=6;

/* x,y: مركزُ الإصبع · w,h: حجمُ الزرّ · W,H: النافذة · rtl: اتجاه الصفحة
   ⇒ {s: المسافةُ من جهة البدء · t: من الأعلى} محصورةً داخل الشاشة */
export function placeFab(x,y,w,h,W,H,rtl){
 const left=Math.max(M,Math.min(x-w/2,W-w-M));
 const top =Math.max(M,Math.min(y-h/2,H-h-M));
 return {s:Math.round(rtl?(W-left-w):left), t:Math.round(top)};
}
const rtlNow=()=>{
 try{return (document.documentElement.dir||document.dir||"rtl")!=="ltr"}catch(_){return true}
};
function apply(el,p){
 if(!el||!p)return;
 el.style.setProperty("--fabX",p.s+"px");
 el.style.setProperty("--fabY",p.t+"px");
 el.classList.add("moved");
}
function load(){
 try{const v=JSON.parse(localStorage.getItem(KEY)||"null");
  return v&&isFinite(v.s)&&isFinite(v.t)?v:null}catch(_){return null}
}
const save=p=>{try{localStorage.setItem(KEY,JSON.stringify(p))}catch(_){}};

export function makeDraggable(el){
 if(!el||el.dataset.drag)return false;
 el.dataset.drag="1";
 const p0=load();
 /* موضعٌ محفوظٌ من شاشةٍ أكبر قد يقع خارج هذه: يُحصَر عند التطبيق */
 if(p0&&typeof innerWidth==="number"){
  const w=el.offsetWidth||52, h=el.offsetHeight||52;
  const s=Math.min(p0.s,Math.max(M,innerWidth-w-M)), t=Math.min(p0.t,Math.max(M,innerHeight-h-M));
  apply(el,{s,t});
 }
 let st=null, justDragged=0;
 el.addEventListener("pointerdown",e=>{
  if(e.button!==undefined&&e.button!==0)return;
  st={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
 });
 el.addEventListener("pointermove",e=>{
  if(!st||st.id!==e.pointerId)return;
  if(!st.moved&&Math.hypot(e.clientX-st.x,e.clientY-st.y)<SLOP)return;
  if(!st.moved){
   st.moved=true; el.classList.add("dragging");
   try{el.setPointerCapture&&el.setPointerCapture(e.pointerId)}catch(_){}
  }
  e.preventDefault();
  const w=el.offsetWidth||52, h=el.offsetHeight||52;
  st.p=placeFab(e.clientX,e.clientY,w,h,innerWidth,innerHeight,rtlNow());
  apply(el,st.p);
 });
 const end=e=>{
  if(!st||st.id!==e.pointerId)return;
  if(st.moved){
   el.classList.remove("dragging");
   if(st.p)save(st.p);
   justDragged=Date.now();
  }
  st=null;
 };
 el.addEventListener("pointerup",end);
 el.addEventListener("pointercancel",end);
 /* السحبُ ليس نقرة: تُبلَع قبل مستمعِ الفتح (الالتقاطُ على الهدف يسبق) */
 el.addEventListener("click",e=>{
  if(Date.now()-justDragged<400){e.preventDefault(); e.stopImmediatePropagation()}
 },true);
 return true;
}
export function resetFab(el){
 try{localStorage.removeItem(KEY)}catch(_){}
 if(el){el.classList.remove("moved"); el.style.removeProperty("--fabX"); el.style.removeProperty("--fabY")}
}
