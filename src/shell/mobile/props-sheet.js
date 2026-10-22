/* ═══ أوراقُ اللوحات · قشرة الهاتف ═══ المرحلة D
   الخصائصُ والطبقاتُ والطوابقُ والتصديرُ والحصرُ أوراقٌ سفليّةٌ تُفتح عند
   الطلب، لا أربعَ عشرةَ لوحةَ إرساء.

   لا نسخةَ ثانيةً من المنطق: الورقةُ «تتبنّى» قسمَ اللوحة الحيَّ نفسَه
   (details.sec[data-sec=…] الذي يبنيه props.js · buildSide) فتنقله إلى
   جسم الورقة ثمّ تُعيده إلى موضعه حين تُغلَق. فكلُّ ما فيه يعمل كما هو:
     · حقولُ الخصائص (data-p · data-bk/bf) يلتقطها مستمعُ change على
       document في props.js بمُثبِّته نفسِه (الرفضُ وسببُه كما على الحاسوب)
     · الأزرارُ (#xSave · #lAll …) بمستمعيها
     · panels.js يرسم اللوحةَ لأنّها صارت مرئيّة (shown يصعد الأسلاف)،
       ويَسِمُها «متّسخة» حين تُغلَق الورقة — بلا سطرٍ جديد فيه.
   والعرضُ العموديُّ الكبير (حقلٌ في سطر · ٤٨ بكسلاً) في mobile.css
   تحت #mSheet .mPane وحده، فالحاسوبُ لا يتغيّر.

   الطوابقُ وحدها تُبنى هنا: على الحاسوب هي شارةٌ صغيرةٌ في شريط الحالة
   (levelbar.js) ونافذةُ جدول (levelManager.js) لا قسمَ لوحة. فالورقةُ
   صفوفٌ كبيرةٌ تنادي المسارَ نفسَه: edit(…,{bump:"view"}) على S.meta.level
   وS.opt.levelAll وS.opt.ghost، و«إدارة الطوابق» هي levelMgrDlg نفسُه. */
import {escapeHtml as esc} from "../../core/escape.js";
import {S,edit} from "../../core/state.js";
import {levelsOf,levelDefs,levelTag,activeLevel,levelCounts} from "../../core/level.js";

/* id ⇒ عنوانُ الورقة · الأقسامُ المتبنّاة · رأسُ أفعالٍ إضافيّ · الموضع */
export const PANES=Object.freeze({
 props: {n:"الخصائص",     secs:["props"],          snap:"half"},
 lays:  {n:"الطبقات",     secs:["lays"],           snap:"half"},
 levels:{n:"الطوابق",     secs:[],                 snap:"half", build:"levels"},
 export:{n:"حفظ وتصدير",  secs:["export"],         snap:"full"},
 qty:   {n:"حصر وتسعير",  secs:["sched","osched"], snap:"full",
         head:[{a:"pricingDlg",n:"التسعير"},{t:"boq",n:"جدول الكميات"}]},
 proj:  {n:"المشروع",     secs:["proj","sheet"],   snap:"full"},
 defs:  {n:"الإعدادات",   secs:["defs"],           snap:"full"}
});

/* قسمُ لوحةٍ ⇒ ورقته. ما ليس هنا (الفاحص · المرجع · المحاور …) ورقةٌ
   باسم قسمه وحده: كلُّ revealSec على الهاتف يفتح ورقةً لا لوحةً مخفيّة */
const SEC2PANE=Object.freeze({props:"props",lays:"lays",export:"export",
 sched:"qty",osched:"qty",proj:"proj",sheet:"proj",defs:"defs"});
export function paneOf(sec){
 if(!sec)return null;
 if(PANES[sec])return sec;
 return SEC2PANE[sec]||("sec:"+sec);
}
/* وصفُ ورقةٍ لمعرّفها، ومنه أقسامٌ مفردةٌ بعنوان ملخّصها */
export function paneDef(id,doc=globalThis.document){
 if(PANES[id])return PANES[id];
 if(typeof id==="string"&&id.startsWith("sec:")){
  const sec=id.slice(4);
  const el=doc&&doc.querySelector(`details.sec[data-sec="${sec}"]`);
  if(!el)return null;
  const sm=el.querySelector("summary");
  return {n:(sm&&sm.textContent.trim())||sec, secs:[sec], snap:"full"};
 }
 return null;
}

/* ورقةُ الطوابق: صفوفٌ من levelsOf ∪ levelDefs، والنشطُ مُعلَم */
export function levelRowsNow(st=S){
 const set=new Set(levelsOf(st));
 for(const d of levelDefs(st))if(Number.isFinite(+d.n))set.add(+d.n);
 const cur=activeLevel(st.meta);
 const C=levelCounts(st)||{};
 const name=n=>{const d=levelDefs(st).find(x=>+x.n===n); return (d&&d.name)||levelTag(n)};
 return [...set].sort((a,b)=>a-b).map(n=>{
  const c=C[n]||{};
  const k=(c.walls||0)+(c.opens||0)+(c.areas||0)+(c.cols||0)+(c.stairs||0)+(c.fixt||0)+(c.roofs||0);
  return {n, name:name(n), on:n===cur, ents:k};
 });
}
function levelsHtml(){
 const rows=levelRowsNow().map(r=>
  `<button type="button" class="mRow${r.on?" mOn":""}" data-lv="${r.n}" aria-pressed="${r.on}">`
  +`<span>${esc(r.name)}${r.on?" ●":""}</span><small>${r.ents?r.ents+" عنصر":"فارغ"}</small></button>`).join("");
 const all=!!+S.opt.levelAll, gh=!!+S.opt.ghost;
 return rows
  +`<button type="button" class="mRow" data-lvo="all" aria-pressed="${all}"><span>اعرض كل الطوابق معاً</span><small>${all?"مُشغَّل":"مُطفأ"}</small></button>`
  +`<button type="button" class="mRow" data-lvo="ghost" aria-pressed="${gh}"><span>شبحُ الطابق السفليّ</span><small>${gh?"مُشغَّل":"مُطفأ"}</small></button>`
  +`<button type="button" class="mWide" data-a="levelMgrDlg">إدارة الطوابق (إضافة · منسوب · ارتفاع)</button>`;
}
/* المسارُ نفسُه الذي تسلكه شارةُ الطابق (levelbar.js) */
export function setLevel(n){
 n=+n;
 if(!Number.isFinite(n)||n===activeLevel(S.meta))return false;
 edit(()=>{S.meta.level=n; return n},`الطابق النشط: ${levelTag(n)}`,{bump:"view"});
 return true;
}
export function toggleLevelOpt(k){
 if(k!=="all"&&k!=="ghost")return null;
 const key=k==="all"?"levelAll":"ghost";
 const on=+S.opt[key]?0:1;
 edit(()=>{S.opt[key]=on; return on},
  k==="all"?(on?"عرض كل الطوابق":"عرض الطابق النشط فقط")
   :(on?"إظهار شبح الطابق السفلي":"إخفاء شبح الطابق السفلي"),{bump:"view"});
 return !!on;
}

/* رأسُ الورقة (أفعالٌ تخصّها) ثمّ الحاضنُ الذي تُنقَل إليه الأقسام */
export function paneShell(def){
 const head=(def.head||[]).map(h=>
  `<button type="button" class="mTile" ${h.a?`data-a="${esc(h.a)}"`:`data-t="${esc(h.t)}"`}><span>${esc(h.n)}</span></button>`).join("");
 return `<div class="mPane">`
  +(head?`<div class="mGrid mPaneHead">${head}</div>`:"")
  +(def.build==="levels"?`<div class="mPaneOwn" data-own="levels">${levelsHtml()}</div>`:"")
  +`<div class="mPaneHost" data-pane-host=""></div></div>`;
}
/* يُعاد البناءُ إن تغيّر المحتوى وحده (بصمة): sync() تناديها مع كلّ مزامنة
   فتتبع الطوابقُ التراجعَ والتعديلَ والفتحَ والورقةُ مفتوحة، بلا سرقة تركيز */
export const refreshLevels=body=>{
 const own=body&&body.querySelector('[data-own="levels"]');
 if(!own)return false;
 const h=levelsHtml();
 if(own.__sig!==h){own.__sig=h; own.innerHTML=h}
 return true;
};

/* التبنّي: يُنقل القسمُ الحيُّ ويُفتَح، ويُحفَظ موضعُه وحالُه للعودة */
export function adopt(doc,host,secs){
 const got=[];
 for(const sec of secs||[]){
  const el=doc.querySelector(`details.sec[data-sec="${sec}"]`);
  if(!el||!el.parentElement)continue;
  /* مراجعةُ D: في وضع التبويب يُخفي dock.js (syncZones) كلَّ قسمٍ ليس
     تبويبَه الحاليّ بـhidden، فكان القسمُ يُنقَل إلى الورقة مخفيّاً:
     ورقةٌ فارغة، وpanels.js لا يرسمه. يُكشَف هنا ويُعاد حالُه عند release */
  got.push({sec, el, parent:el.parentElement, next:el.nextSibling||null, open:!!el.open, hid:!!el.hidden});
  host.appendChild(el);
  if(el.hidden)el.hidden=false;
  if(!el.open)el.open=true;
 }
 return got;
}
/* يعيد كلَّ قسمٍ إلى أبيه وجاره وحاله. ويُنادى قبل أيّ innerHTML على
   جسم الورقة: إعادةُ الكتابة فوق قسمٍ متبنًّى تقتله (مستمعوه ومعرّفاته) */
export function release(got){
 if(!got||!got.length)return 0;
 let n=0;
 for(const p of got.slice().reverse()){
  const nx=p.next&&p.next.parentElement===p.parent?p.next:null;
  p.parent.insertBefore(p.el,nx);
  if(!!p.el.open!==p.open)p.el.open=p.open;
  if(!!p.el.hidden!==!!p.hid)p.el.hidden=!!p.hid;
  n++;
 }
 got.length=0;
 return n;
}
