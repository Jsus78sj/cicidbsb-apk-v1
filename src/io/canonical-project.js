/* ═══ ملفّ الصيغة الموحّدة ═══ (انظر تنبيه core/canonical-contract.js)
   التصدير: الصيغةُ الموحّدة + نسخةُ المصدر كاملةً (includeSource) فلا
   يفقد الحفظُ حقلاً لا تعرفه الصيغة. والاستيراد: JSON فاسدٌ يُرمى قبل أيّ
   شيء، والصيغةُ تُتحقَّق، والمصدرُ إن وُجد هو الحالةُ المستعادة (بلا فقد). */
import {civilDraftToCanonical} from "../core/canonical-adapter.js";
import {canonicalToCivilDraft} from "../core/canonical-import.js";
import {validateCanonical} from "../core/canonical-contract.js";
const clone=o=>JSON.parse(JSON.stringify(o));
export function exportCanonicalFile(state,opt={}){
 const c=civilDraftToCanonical(state||{});
 if(opt.includeSource)c.source=clone(state||{});
 return JSON.stringify(c,null,1);
}
export function importCanonicalFile(text){
 let c;
 try{c=JSON.parse(String(text))}
 catch(e){throw new Error("ملفّ JSON غير صالح: "+((e&&e.message)||e))}
 const v=validateCanonical(c);
 if(!v.ok)throw new Error("ملفّ الصيغة الموحّدة مرفوض: "+v.errors.join(" · "));
 const src=(c.source&&typeof c.source==="object")?c.source:null;
 if(src)return {state:clone(src),source:src,report:{ok:true,from:"source",warnings:[]}};
 const r=canonicalToCivilDraft(c);
 return {state:r.state,source:null,report:{...r.report,from:"canonical"}};
}
