/* ═══ المرحلة A — اختيار القشرة وعقدها ═══ */
import assert from "node:assert/strict";
import {pickShell,readOverride,setOverride,detectShell,applyShellAttr,SHELLS,PHONE_MAX_SHORT} from "../shell/select.js";
import {mountShell,currentShell} from "../shell/contract.js";
import {id as dId,ready as dReady,mount as dMount} from "../shell/desktop/index.js";
import {id as mId,ready as mReady,mount as mMount} from "../shell/mobile/index.js";
import {SURFACES,visibleIdle} from "../shell/surfaces.js";
import {readFileSync,existsSync} from "node:fs";
let n=0,f=0;
const t=(name,fn)=>{n++;try{fn();console.log("  ✓",name)}catch(e){f++;console.log("  ✗",name,"—",e.message)}};

t("هاتف رأسيّ لمسٌ خشن ⇒ mobile",()=>assert.equal(pickShell({coarse:true,w:390,h:844}),"mobile"));
t("هاتف أفقيّ ⇒ mobile (الضلع الأقصر)",()=>assert.equal(pickShell({coarse:true,w:844,h:390}),"mobile"));
t("لوح ٨٢٠×١١٨٠ ⇒ desktop",()=>assert.equal(pickShell({coarse:true,w:820,h:1180}),"desktop"));
t("نافذة ضيّقة بفأرة ⇒ desktop",()=>assert.equal(pickShell({coarse:false,w:390,h:800}),"desktop"));
t("الحدّ ٦٠٠ نفسه مكتبيّ",()=>assert.equal(pickShell({coarse:true,w:PHONE_MAX_SHORT,h:900}),"desktop"));
t("أبعاد مجهولة ⇒ desktop",()=>assert.equal(pickShell({coarse:true}),"desktop"));
t("التجاوز يغلب",()=>{
 assert.equal(pickShell({coarse:false,w:1920,h:1080,override:"mobile"}),"mobile");
 assert.equal(pickShell({coarse:true,w:390,h:800,override:"desktop"}),"desktop");
 assert.equal(pickShell({coarse:true,w:390,h:800,override:"bogus"}),"mobile");
});
const fakeWin=(search,stored)=>{const m=new Map(stored?[["cd.shell",stored]]:[]);
 return {location:{search},localStorage:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)},_m:m}};
t("?shell=mobile يُقرأ ويُحفظ",()=>{const w=fakeWin("?shell=mobile");assert.equal(readOverride(w),"mobile");assert.equal(w._m.get("cd.shell"),"mobile")});
t("المحفوظ يُقرأ بلا رابط",()=>assert.equal(readOverride(fakeWin("","desktop")),"desktop"));
t("?safe يتجاهل المحفوظ",()=>assert.equal(readOverride(fakeWin("?safe","mobile")),null));
t("قيمة غريبة تُهمل",()=>assert.equal(readOverride(fakeWin("?shell=tv","x")),null));

t("setOverride يحفظ ويمحو",()=>{const w=fakeWin("");setOverride("mobile",w);assert.equal(w._m.get("cd.shell"),"mobile");setOverride(null,w);assert.equal(w._m.has("cd.shell"),false)});
const phoneWin=(search="")=>Object.assign(fakeWin(search),{matchMedia:q=>({matches:q==="(pointer:coarse)"}),screen:{width:390,height:844},document:{documentElement:{dataset:{}}}});
t("detectShell على هاتف ⇒ mobile",()=>assert.equal(detectShell(phoneWin()),"mobile"));
t("detectShell يحترم ?shell=desktop",()=>assert.equal(detectShell(phoneWin("?shell=desktop")),"desktop"));
t("applyShellAttr يكتب html[data-chrome] (لا data-shell التي يكتبها الشريط)",()=>{const w=phoneWin();assert.equal(applyShellAttr(w),"mobile");assert.equal(w.document.documentElement.dataset.chrome,"mobile")});
t("عقد المكتبية مباشرةً",()=>{assert.equal(dId,"desktop");assert.equal(dReady,true);assert.equal(typeof dMount().unmount,"function")});
t("عقد الهاتف مباشرةً (جاهزة منذ المرحلة D)",()=>{assert.equal(mId,"mobile");assert.equal(mReady,true);assert.equal(typeof mMount,"function")});
const mH=await mMount();
t("mount الهاتف بلا DOM لا يرمي ويُرجع unmount",()=>assert.equal(typeof mH.unmount,"function"));
const said=[];
const got=await mountShell("mobile",{say:m=>said.push(m)});
t("mountShell: الهاتف الجاهز يُركَّب بلا رسالة (بلا DOM لا يرمي)",()=>{assert.equal(got,"mobile");assert.equal(currentShell(),"mobile");assert.equal(said.length,0)});
const got2=await mountShell("tv",{say:m=>said.push(m)});
t("mountShell: اسم مجهول ⇒ المكتبية بلا رسالة",()=>{assert.equal(got2,"desktop");assert.equal(said.length,0)});
/* المعاينة الصريحة: قشرةٌ وهميّةٌ عبر mountShell نفسه تحتاج DOM، فيُفحَص المنطق نصّاً هنا
   والتركيبُ الحيّ في mobile-shell.test.js */
t("mountShell: preview يركّب غير الجاهزة ويقول ذلك",()=>{
 const c=readFileSync(new URL("../shell/contract.js",import.meta.url),"utf8");
 assert.ok(/ctx\.preview/.test(c));
 assert.ok(c.indexOf("shellActive")<c.indexOf("await mod.mount(ctx)"),"السمة قبل mount");
});
t("app.js يمرّر preview من التجاوز الصريح وrun لـ↶ ↷",()=>{
 const a=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 assert.ok(/preview:readOverride\(\)===SHELL/.test(a));
 assert.ok(/run:spec=>runSpec\(spec\)/.test(a));
});

const ROOT=new URL("../../",import.meta.url);
const shells=await Promise.all(SHELLS.map(id=>import(`../shell/${id}/index.js`)));
shells.forEach((m,i)=>t(`عقد ${SHELLS[i]}`,()=>{
 assert.equal(m.id,SHELLS[i]); assert.equal(typeof m.ready,"boolean"); assert.equal(typeof m.mount,"function");
}));
t("المكتبية جاهزة دائماً (المرجع الآمن)",()=>assert.equal(shells[0].ready,true));

t("جرد الأسطح: كلّ محدِّد #id موجودٌ في index.html",()=>{
 const html=readFileSync(new URL("index.html",ROOT),"utf8");
 for(const s of SURFACES){const id=s.sel.slice(1);assert.ok(html.includes(`id="${id}"`),`${s.sel} غير موجود`)}
});
t("جرد الأسطح: مصيرٌ معروف لكلّ سطح وبلا تكرار",()=>{
 const ok=new Set(["keep","state","sheet","menu","drop"]);
 const seen=new Set();
 for(const s of SURFACES){assert.ok(ok.has(s.mobile),s.sel);assert.ok(!seen.has(s.sel),"مكرّر "+s.sel);seen.add(s.sel)}
});
t("هدف الخطّة: سطحان ظاهران فقط في الوضع الخامل (#top + 🔍 داخله)",()=>{
 assert.deepEqual(visibleIdle().map(s=>s.sel),["#top","#srchBtn"]);
});
t("app.js يكتب السمة قبل البناء ويركّب القشرة قبل bootOk",()=>{
 const a=readFileSync(new URL("src/app.js",ROOT),"utf8");
 const i=a.indexOf("applyShellAttr()"),j=a.indexOf("await mountShell("),k=a.lastIndexOf("bootOk();");
 assert.ok(i>0&&j>i&&k>j);
});
t("searchIndex.js اليتيم محذوف",()=>assert.ok(!existsSync(new URL("src/ui/searchIndex.js",ROOT))));

console.log(`\n${n-f}/${n} نجحت`);
process.exit(f?1:0);
