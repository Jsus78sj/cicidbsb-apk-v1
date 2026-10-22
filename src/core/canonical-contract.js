/* ═══ الصيغةُ الموحّدة civildraft-canonical — العقد ═══
   ⚠ بديلٌ أدنى كُتب في المرحلة ٩ من خطّة الهاتف: الملفّاتُ الأصلية
   (canonical-contract · canonical-adapter · canonical-import ·
   io/canonical-project) كانت ناقصةً من الحزمة (CHANGES.md)، فكانت
   guided-room-3d وguided-persistence لا تُحمَّل وثلاثةُ اختباراتٍ تسقط.
   هذا البديلُ يحقّق ما يطلبه مستعملاه واختباراهما فقط، ويحفظ نسخةَ
   المصدر كاملةً فلا يفقد الحفظُ شيئاً. **إن كانت الأصليةُ عندك فاستبدل
   الملفّات الأربعة بها** — الأسماءُ المصدَّرةُ هي نفسُها.
   الوحدة: مليمتر دائماً (storageUnit). لا DOM ولا حالةٌ عامّة. */
export const FORMAT="civildraft-canonical";
export const VERSION=1;
const arr=v=>Array.isArray(v)?v:[];
const num=(v,d)=>Number.isFinite(+v)?+v:d;
export function canonicalLevel(L={}){
 return {id:String(L.id||`level-${num(L.number,0)}`), number:num(L.number,0),
  name:L.name||"", elevation:num(L.elevation,0), height:num(L.height,3000), slab:num(L.slab,200),
  walls:arr(L.walls).map(w=>({...w})), openings:arr(L.openings).map(o=>({...o})),
  rooms:arr(L.rooms).map(r=>({...r}))};
}
export function canonicalProject(p={}){
 return {format:FORMAT, version:VERSION, storageUnit:"mm",
  name:String(p.name||""), levels:arr(p.levels).map(canonicalLevel)};
}
/* تحقّقٌ قبل أيّ لمسٍ للحالة: الملفُّ الفاسد يُرفَض كلُّه */
export function validateCanonical(c){
 const errors=[];
 if(!c||typeof c!=="object")errors.push("ليس كائناً");
 else{
  if(c.format!==FORMAT)errors.push(`الصيغة «${c.format}» ليست ${FORMAT}`);
  if(c.storageUnit!=="mm")errors.push("وحدة التخزين ليست مليمتراً");
  if(!Array.isArray(c.levels))errors.push("لا مستويات");
  else c.levels.forEach((L,i)=>{
   arr(L.walls).forEach((w,j)=>{
    const ok=p=>Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite);
    if(!ok(w.a)||!ok(w.b))errors.push(`المستوى ${i}: جدار ${j} بلا طرفين صالحين`);
   });
  });
 }
 return {ok:!errors.length, errors};
}
