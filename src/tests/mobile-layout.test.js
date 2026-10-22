/* ═══ واجهةُ الهاتف ═══ المرحلة E ثم F
   المرحلة E (القياسُ في Chromium: 412×860 و360×740 و860×412 و915×360،
   مسجَّلٌ في CHANGES.md) أصلحت الواجهةَ المكتبيةَ المضغوطة على الهاتف بكتلٍ
   في touch.css. المرحلة F حذفتها: الهاتفُ قشرةٌ (src/shell/mobile) ومصدرُ
   أنماطه mobile.css وحده. فالحارسُ هنا: لا عودةَ لتلك الكتل، وما كانت
   تصلحه (لا زرَّ خارج الشاشة · الأفقيُّ ليس صفراً) مضمونٌ في القشرة.
   التشغيل:  node src/tests/mobile-layout.test.js                         */
import {readFileSync} from "node:fs";
import {group,ok,eq,summary} from "./harness.js";
import {pickShell} from "../shell/select.js";

const css=readFileSync(new URL("../../css/touch.css",import.meta.url),"utf8");
const mc=readFileSync(new URL("../../css/mobile.css",import.meta.url),"utf8");
const vp=readFileSync(new URL("../ui/viewport.js",import.meta.url),"utf8");
const fn=name=>{
 const m=vp.match(new RegExp(`export function ${name}\\([\\s\\S]*?\\n}\\n`));
 if(!m)return null;
 const src=m[0].replace("export ","").replace(/=innerWidth|=innerHeight|=screen|=matchMedia\("\(pointer:coarse\)"\)\.matches/g,"");
 return new Function(src+`;return ${name}`)();
};

group("الحواف الآمنة: قاعدةٌ واحدة ولا حجزَ لشريطٍ غائب",()=>{
 const safe=css.match(/body\{\s*padding-top:env\(safe-area-inset-top[\s\S]*?\}/);
 ok(!!safe,"قاعدةُ الحواف الآمنة موجودة");
 ok(safe&&/padding-bottom:calc\(var\(--bodyPadB,0px\) \+ env\(safe-area-inset-bottom/.test(safe[0]),
  "padding-bottom = --bodyPadB + الحافة");
 ok(!/body\{padding-bottom:var\(--rbH/.test(css),"ولا padding-bottom صريحٌ آخر يتنازع معها");
 ok(!/--bodyPadB:var\(--rbH/.test(css),"ولا حجزَ للشريط السفليّ المكتبيّ (لم يعد سفليّاً على الهاتف)");
 ok(/padding-block-end:var\(--m-safe-b\)/.test(mc),"والشريطُ السفليُّ في القشرة يحجز الحافّةَ بنفسه");
});
group("المرحلة F: كتلُ الهاتف المكتبيّ لم تعد",()=>{
 ok(!/@media[^{]*max-width:\s*768px/.test(css),"لا ≤768 في touch.css");
 ok(!/@media[^{]*max-height:\s*500px/.test(css),"ولا الأفقيّ القصير");
 ok(!/#thumb\{position:/.test(css),"وشريطُ الإبهام لا يُموضَع (القشرة تُخرجه)");
});
group("لا زرَّ خارج الشاشة بلا تمرير (في القشرة)",()=>{
 ok(/#touchBar \.tbB\{[^}]*overflow-x:auto/.test(mc),"أزرارُ الشريط تُمرَّر أفقيّاً");
 ok(/\.mBar #touchBar \.tbM\{[^}]*overflow-x:auto/.test(mc),"وصفُّ القياس كذلك");
 ok(/#clPrompt\{min-inline-size:0/.test(mc)&&/#clLive\{min-inline-size:0/.test(mc),"سطرُ الأوامر ينكمش (خطوةُ النصّ)");
 ok(/--stageBot/.test(mc)&&/--stageBot/.test(vp),"والعائماتُ تتبع --stageBot");
});
group("الأفقيُّ القصير: هاتفٌ لا لوح",()=>{
 eq(pickShell({coarse:true,w:860,h:412}),"mobile","860×412 لمسٌ ⇒ قشرةُ الهاتف (لا شريطَ مكتبيّاً يأكل اللوح)");
 eq(pickShell({coarse:true,w:915,h:360}),"mobile","915×360 كذلك");
 eq(pickShell({coarse:true,w:1024,h:768}),"desktop","اللوحُ يبقى على المكتبية");
});
group("موقعُ سطح المكتب: الأفقيُّ ليس منه",()=>{
 const f=fn("isDesktopSiteOnPhone");
 ok(typeof f==="function","isDesktopSiteOnPhone مُصدَّرة");
 const P={width:412,height:860};
 eq(f(412,860,P,true),false,"هاتفٌ عموديّ");
 eq(f(860,412,P,true),false,"هاتفٌ أفقيّ — كان true فيظهر #tools ويُصفَّر اللوح");
 eq(f(980,2045,P,true),true,"«موقعُ سطح المكتب» عموديّاً");
 eq(f(1024,768,{width:768,height:1024},true),false,"لوحيّ");
 eq(f(1366,800,{width:1366,height:800},false),false,"حاسوب");
});
group("ألواحُ الأفقيّ: تظهر بالتبويب وتُطوى بالأداة",()=>{
 const f=fn("peekFor");
 ok(typeof f==="function","peekFor مُصدَّرة");
 const el=hits=>({closest:s=>s.split(",").some(x=>hits.some(h=>x.includes(h)))?{}:null});
 eq(f(el([".rbTab"])),true,"تبويب ⇐ تظهر");
 eq(f(el(["#rbPanes [data-cmd]"])),false,"أمرٌ من اللوح ⇐ تُطوى");
 eq(f(el(["#ribbon"])),null,"غيرُ ذلك داخل الشريط ⇐ لا تغيير");
 eq(f(el([])),false,"خارج الشريط ⇐ تُطوى");
 eq(f(null),null,"لا هدف");
});
summary();
