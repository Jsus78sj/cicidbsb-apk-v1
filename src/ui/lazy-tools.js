/* ═══ أدواتٌ تُحمَّل عند الطلب · المرحلة E (الأداء) ═══
   العرضُ الثلاثيّ والتسعيرُ كانا يُستوردان عند الإقلاع لمجرّد تسجيل أدواتهما
   (defTool) في السجلّ، فيُحمَّل معهما كلُّ كودهما (~30 ك.ب مضغوطة) قبل أن
   يطلبهما أحد.
   هنا يُسجَّل الاسمُ والمداخلُ فقط، ويُحمَّل الوحدةُ الحقيقيّةُ أوّل استعمال.
   تسجيلُ الوحدة الحقيقيّة يستبدل هذا التعريف (defTool يكتب فوق المعرّف نفسه)،
   فلا تُكرَّر الأداة ولا تبقى نسخةٌ مؤقّتة.
   التسعيرُ: refreshPricingIfLoaded يُنادى بعد التراجع، ولا يحمّل شيئاً إن لم
   يُفتح اللوحُ من قبل (لا لوحةَ تتغيّر حين لا لوح). */
import {defTool} from "../tools/registry.js";

let pricingUp=false;
export function refreshPricingIfLoaded(){
 if(pricingUp)import("./pricingPanel.js").then(M=>M.refreshPricingPanel());
}

defTool({
 id:"view3d", alias:"3d axo iso مجسم ثلاثي عرض_ثلاثي اكسونومتري",
 label:"العرض الثلاثي",
 hint:"مجسّمٌ أكسونومتريّ للمبنى: اسحب للتدوير وحرّك العجلة للتقريب",
 ico:"grid", own:1, nojr:1, noplan:1,
 start(){ import("./view3d.js").then(M=>M.open3d()); return false; }
});

defTool({
 id:"pricing", alias:"rates prices pricingpanel أسعار تسعير اسعار_الكميات",
 label:"التسعير",
 hint:"أسعار الوحدة والعملة ونسبة الضريبة لجدول الكميات",
 ico:"boq", own:1, nojr:1, noplan:1,
 start(){ pricingUp=true; import("./pricingPanel.js").then(M=>M.openPricingPanel()); return false; }
});
