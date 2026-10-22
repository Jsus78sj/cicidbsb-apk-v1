/* ═══ CivilDraft ⇐ الصيغة الموحّدة ═══ (انظر تنبيه canonical-contract.js)
   الحقولُ تُسمّى بأسمائها الطويلة (thickness · offset · width) والقيَمُ
   بالمليمتر كما هي في الحالة. */
import {canonicalProject} from "./canonical-contract.js";
const arr=v=>Array.isArray(v)?v:[];
export function civilDraftToCanonical(state={}){
 const meta=state.meta||{};
 let defs=arr(state.levelDefs);
 if(!defs.length)defs=[{n:0,name:"",elev:0,h:+meta.wallH||3000,slab:200}];
 const levels=defs.map(d=>{
  const n=+d.n||0;
  const on=x=>(+x.level||0)===n;
  return {id:`level-${n}`, number:n, name:d.name||"", elevation:+d.elev||0,
   height:+d.h||+meta.wallH||3000, slab:+d.slab||200,
   walls:arr(state.walls).filter(on).map(w=>({id:w.id,a:w.a,b:w.b,thickness:w.t,
    type:w.type,align:w.align,height:w.h,arc:w.arc})),
   openings:arr(state.opens).filter(o=>{
    const w=arr(state.walls).find(x=>x.id===o.wall); return w?on(w):n===0;
   }).map(o=>({id:o.id,wall:o.wall,kind:o.kind,offset:o.s,width:o.w,height:o.h,sill:o.sill})),
   rooms:arr(state.areas).filter(on).map(r=>({...r}))};
 });
 return canonicalProject({name:meta.name||"",levels});
}
