/* ═══ الصيغة الموحّدة ⇐ CivilDraft ═══ (انظر تنبيه canonical-contract.js)
   يبني حالةً جديدةً مستقلّة (لا يلمس الحالة العامّة S) ويعيد تقريراً. */
import {validateCanonical} from "./canonical-contract.js";
const arr=v=>Array.isArray(v)?v:[];
export function canonicalToCivilDraft(c){
 const v=validateCanonical(c);
 if(!v.ok)throw new Error("ملفّ الصيغة الموحّدة مرفوض: "+v.errors.join(" · "));
 const L=arr(c.levels);
 const state={meta:{name:c.name||"",level:0,wallH:(L[0]&&L[0].height)||3000},
  levelDefs:L.map(x=>({n:x.number,name:x.name,elev:x.elevation,h:x.height,slab:x.slab})),
  walls:[],opens:[],areas:[]};
 L.forEach(x=>{
  arr(x.walls).forEach(w=>state.walls.push({id:w.id,level:x.number,a:w.a,b:w.b,
   t:w.thickness??200,type:w.type||"ext",align:w.align||"c",
   ...(w.height!=null?{h:w.height}:{}),...(w.arc!=null?{arc:w.arc}:{})}));
  arr(x.openings).forEach(o=>state.opens.push({id:o.id,wall:o.wall,kind:o.kind||"door",
   s:o.offset,w:o.width,h:o.height,sill:o.sill??0}));
  arr(x.rooms).forEach(r=>state.areas.push({...r,level:r.level??x.number}));
 });
 return {state,report:{ok:true,warnings:[]}};
}
