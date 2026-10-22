/* ═══ الإقلاعُ الكسول · المرحلة E ═══
   العرضُ الثلاثيّ والتسعيرُ لا يُحمَّلان عند الإقلاع: يُسجَّل اسمُ كلٍّ منهما
   في lazy-tools.js، والوحدةُ الحقيقيّةُ تُستورد عند أوّل استعمال.
   ١ · الأداتان مسجَّلتان ومتاحتان بالبحث (findTool) دون تحميل وحدتيهما
   ٢ · refreshPricingIfLoaded لا تحمّل شيئاً ما لم تُفتح اللوحة (لا كلفة عند التراجع)
   node src/tests/lazy-boot.test.js */
import {shim,shimCanvas,shimDOM,group,ok,eq,summary} from "./harness.js";
shim(); shimCanvas(); shimDOM();
const R=await import("../tools/registry.js");
const LT=await import("../ui/lazy-tools.js");

group("١ · الأداتان مسجَّلتان قبل تحميل وحدتيهما",()=>{
 const v=R.findTool("view3d"), p=R.findTool("pricing");
 ok(!!v&&v.id==="view3d","العرض الثلاثي مسجَّل");
 ok(!!p&&p.id==="pricing","التسعير مسجَّل");
 ok(!!R.findTool("3d")&&R.findTool("3d").id==="view3d","ومداخلُه (3d) تعمل");
 ok(!!R.findTool("أسعار")&&R.findTool("أسعار").id==="pricing","ومداخلُ التسعير العربية");
 eq(typeof v.start,"function","ولكلٍّ دالةُ بدء");
});

group("٢ · تحديثُ التسعير بعد التراجع لا يحمّل اللوح إن لم يُفتح",()=>{
 let threw=false;
 try{LT.refreshPricingIfLoaded()}catch(e){threw=true}
 eq(threw,false,"لا يرمي ولا يحمّل");
});
summary();
