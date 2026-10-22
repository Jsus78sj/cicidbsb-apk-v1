/* ═══ حدودُ الطبقات — إعادةُ الهيكلة لتطبيق أندرويد (المرحلة A) ═══
   القاعدة: النواةُ تعمل على أيّ منصّة بلا واجهة.
   · src/core     لا يستورد من ui/ tools/ ai/ platform/ (ولا io/ إلا الاستثناءات أدناه)
   · src/io       يستورد من core/ و platform/ فقط
   · src/platform لا يستورد شيئاً من المشروع (يقرأ window.Capacitor وحده)
   الاستثناءاتُ مكتوبةٌ صريحاً لتُزال في المرحلة B (نقلُ التخزين إلى platform/). */
import {readdirSync,readFileSync,statSync} from "node:fs";
import {join,dirname,relative,posix} from "node:path";
import {fileURLToPath} from "node:url";
import {group,ok,summary} from "./harness.js";

const SRC=join(dirname(fileURLToPath(import.meta.url)),"..");
const walk=d=>readdirSync(d).flatMap(n=>{const p=join(d,n);
 return statSync(p).isDirectory()?walk(p):p.endsWith(".js")?[p]:[]});
const IMP=/(?:^|\n)\s*import\s[^;]*?from\s*["']([^"']+)["']|import\(\s*["'`]([^"'`$]+)["'`]/g;
const deps=layer=>walk(join(SRC,layer)).flatMap(f=>{
 const t=readFileSync(f,"utf8"), rel=relative(SRC,f).split("\\").join("/"), out=[];
 let m; while((m=IMP.exec(t))){const s=m[1]||m[2]; if(!s||s[0]!==".")continue;
  const to=posix.normalize(posix.join(posix.dirname(rel),s));
  out.push({from:rel,to,top:to.split("/")[0]});}
 return out;
});
/* المرحلة B تنقل io/store.js إلى platform/ فتسقط هذه */
const CORE_IO_OK=new Set([
 "core/inspect.js->io/dxfin.js",
 /* ملفُّ الهدف ناقصٌ من الحزمة أصلاً (عيبٌ سابق) */
 "core/guided-persistence.js->io/canonical-project.js","core/state.js->io/store.js","core/underlay.js->io/store.js"]);

const rule=(layer,allowed,extra=new Set())=>{
 const bad=deps(layer).filter(d=>!allowed.includes(d.top)&&!extra.has(d.from+"->"+d.to));
 bad.forEach(d=>ok(false,`${d.from} يستورد ${d.to} — خارج حدود «${layer}»`));
 if(!bad.length)ok(true,`«${layer}» لا يتجاوز: ${allowed.join(" · ")||"لا شيء"}`);
};
group("src/core نواةٌ بلا واجهة ولا منصّة",()=>rule("core",["core"],CORE_IO_OK));
group("src/io يعتمد على core وplatform فقط",()=>rule("io",["core","io","platform"]));
group("src/platform مستقلٌّ تماماً",()=>rule("platform",["platform"]));
group("الاستثناءاتُ ما زالت حقيقية (وإلا تُحذف من القائمة)",()=>{
 const now=new Set(deps("core").map(d=>d.from+"->"+d.to));
 CORE_IO_OK.forEach(k=>ok(now.has(k),`${k} ما زال قائماً`));
});
summary();
