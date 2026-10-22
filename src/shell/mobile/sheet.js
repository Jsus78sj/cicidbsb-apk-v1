/* ═══ الورقةُ السفليّة ═══ المرحلة B
   طبقةٌ تنزلق من الأسفل بثلاث مواضع: مغلقة · نصفُ شاشة · كاملة.
   تُسحَب بالمقبض، وتستقرّ على أقربِ موضعٍ، أو تقفز موضعاً بلمسةٍ سريعة
   (flick) بصرف النظر عن المسافة. زرّ الرجوع يغلقها (machine.onBack).

   الجزءُ الخالص (settle) هو ما يُختبَر ويُحسَم فيه منطقُ السحب؛
   والجزءُ الذي يلمس DOM صغيرٌ عمداً: بناءٌ + سمةُ الموضع + ربطُ المؤشّر. */

export const SNAPS=Object.freeze(["closed","half","full"]);
export const SNAP_AT=Object.freeze({closed:0, half:0.5, full:0.92});
/* سرعةُ الـflick بالبكسل في المللي ثانية */
export const FLICK_V=0.5;

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/* الموضعُ التالي بعد سحبٍ: dy موجبٌ = إلى الأسفل (الورقةُ تنكمش) */
export function settle(cur,dyPx,H,vel=0){
 const i=SNAPS.indexOf(cur);
 if(i<0)throw new Error("موضعٌ غير معروف: "+cur);
 if(!(H>0))return cur;
 if(Math.abs(vel)>=FLICK_V){
  const step=vel>0?-1:1;
  return SNAPS[clamp(i+step,0,SNAPS.length-1)];
 }
 const f=clamp(SNAP_AT[cur]-dyPx/H,0,1);
 let best=SNAPS[0], gap=Infinity;
 for(const k of SNAPS){
  const d=Math.abs(SNAP_AT[k]-f);
  if(d<gap){gap=d; best=k}
 }
 return best;
}

/* يبني الورقةَ: مقبضٌ للسحب + جسمٌ للمحتوى. لا يُضيف إلى الصفحة؛ المستدعي يفعل */
export function buildSheet(doc,title=""){
 const el=doc.createElement("section");
 el.setAttribute("id","mSheet");
 el.setAttribute("role","dialog");
 el.setAttribute("aria-label",title);
 el.setAttribute("data-snap","closed");
 el.setAttribute("hidden","");
 const grip=doc.createElement("button");
 grip.setAttribute("type","button");
 grip.setAttribute("class","mGrip");
 grip.setAttribute("aria-label","اسحب لتغيير الحجم أو أغلِق");
 const head=doc.createElement("h2");
 head.setAttribute("class","mHead");
 head.textContent=title;
 const body=doc.createElement("div");
 body.setAttribute("class","mBody");
 el.appendChild(grip);
 el.appendChild(head);
 el.appendChild(body);
 return {el, grip, head, body};
}

export function setSnap(el,snap){
 if(!SNAPS.includes(snap))throw new Error("موضعٌ غير معروف: "+snap);
 el.setAttribute("data-snap",snap);
 if(snap==="closed")el.setAttribute("hidden","");
 else el.removeAttribute("hidden");
 return snap;
}

/* لمسةٌ على المقبض بلا سحبٍ تُغلق الورقة (كما يقول وصفُه لقارئ الشاشة) */
const TAP_PX=6, TAP_MS=300;

/* ربطُ السحب بالمؤشّر: يُرجِع دالّةَ فكّ الربط. onSnap يُنادى بالموضع النهائي.
   تصحيحاتُ المراجعة:
   · كانت الحركةُ تُسمَع على الورقة وحدها بلا التقاطٍ للمؤشّر، فإصبعٌ
     يسحب إلى الأعلى يخرج من حدودها فورًا (الورقةُ لا تتبعه) فلا تصل
     pointerup ويبقى السحبُ معلّقاً. الآن setPointerCapture على المقبض،
     والأحداثُ الملتقَطة تصعد إلى الورقة حيث المستمعون.
   · الورقةُ تتبع الإصبعَ نحو الأسفل أثناء السحب (translateY عبر CSSOM،
     لا سمة style: CSP) ثم تستقرّ.
   · لمسةٌ قصيرةٌ بلا سحبٍ ⇒ مغلقة. */
export function wireDrag(refs,H,getSnap,onSnap){
 const {grip,el}=refs;
 let y0=null, last=null, t0=0, t1=0;
 const follow=dy=>{try{if(el.style)el.style.transform=dy>0?`translateY(${dy}px)`:""}catch(_){}};
 const down=e=>{
  y0=e.clientY; last=e.clientY; t0=t1=e.timeStamp||0;
  try{if(grip.setPointerCapture&&e.pointerId!=null)grip.setPointerCapture(e.pointerId)}catch(_){}
 };
 const move=e=>{if(y0!=null){last=e.clientY; t1=e.timeStamp||t1; follow(last-y0)}};
 const up=e=>{
  if(y0==null)return;
  if(e&&e.clientY!=null)last=e.clientY;
  if(e&&e.timeStamp)t1=e.timeStamp;
  const dy=(last??y0)-y0;
  const dt=Math.max(1,t1-t0);
  y0=null;
  follow(0);
  const next=(Math.abs(dy)<TAP_PX&&dt<=TAP_MS)
   ? "closed"
   : settle(getSnap(),dy,H(),dy/dt);
  setSnap(el,next);
  onSnap&&onSnap(next);
 };
 grip.addEventListener("pointerdown",down);
 el.addEventListener("pointermove",move);
 el.addEventListener("pointerup",up);
 el.addEventListener("pointercancel",up);
 return ()=>{
  grip.removeEventListener("pointerdown",down);
  el.removeEventListener("pointermove",move);
  el.removeEventListener("pointerup",up);
  el.removeEventListener("pointercancel",up);
 };
}
