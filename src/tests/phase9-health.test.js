/* ═══ المرحلة ٩ من خطّة الهاتف: صحّةُ المشروع ═══
   ما كان مكشوفاً في دفتر التغطية صار مُختبَراً سلوكيّاً هنا بدل أن يُعذَر:
   الصيغةُ الموحّدة (البديلُ الأدنى) · strictEdit · مدخلُ المقاسات ·
   خطواتُ معالج الغرفة · حقنُ الملفّ التالي · اسمُ المنصّة.
   التشغيل:  node src/tests/phase9-health.test.js                    */
import {shim,group,ok,eq,throws,summary} from "./harness.js";
shim();
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
const CC=await import("../core/canonical-contract.js");
const CA=await import("../core/canonical-adapter.js");
const CI=await import("../core/canonical-import.js");
const CP=await import("../io/canonical-project.js");
const SE=await import("../core/strict-edit.js");
const DI=await import("../core/dimension-input.js");
const GW=await import("../core/guided-room-wizard.js");
const PJ=await import("../io/project.js");
const PL=await import("../platform/index.js");
const ST=await import("../core/state.js");
const QO=await import("../core/quick-opening.js");
const WL=await import("../core/walls.js");

const SRC={meta:{name:"بيت",level:0,wallH:3000},levelDefs:[{n:0,name:"أرضي",elev:0,h:3000,slab:200}],
 walls:[{id:"w1",level:0,a:[0,0],b:[5000,0],t:200,type:"ext",align:"c"}],
 opens:[{id:"d1",wall:"w1",kind:"door",s:2500,w:900,h:2100,sill:0}],areas:[],extra:{keep:1}};

group("الصيغةُ الموحّدة: العقد",()=>{
 eq(CC.FORMAT,"civildraft-canonical","اسمُ الصيغة");
 eq(CC.VERSION,1,"والإصدار");
 const L=CC.canonicalLevel({number:2});
 eq(L.id,"level-2","مستوى بلا معرّف ⇒ level-n");
 eq(L.height,3000,"وارتفاعٌ افتراضيّ");
 const p=CC.canonicalProject({name:"x",levels:[{}]});
 eq(p.storageUnit,"mm","المليمترُ وحدةُ التخزين");
 ok(CC.validateCanonical(p).ok,"المشروعُ السليم يمرّ");
 const bad=CC.validateCanonical({format:"x",storageUnit:"cm",levels:[{walls:[{a:[0],b:null}]}]});
 ok(!bad.ok&&bad.errors.length>=3,"والفاسدُ يُرفَض بأسبابه");
});

group("الصيغةُ الموحّدة: ذهابٌ وإياب",()=>{
 const c=CA.civilDraftToCanonical(SRC);
 eq(c.levels.length,1,"مستوى واحد");
 eq(c.levels[0].walls[0].thickness,200,"السماكةُ باسمها الطويل");
 eq(c.levels[0].openings[0].offset,2500,"والموضعُ offset");
 const back=CI.canonicalToCivilDraft(c).state;
 eq(back.walls[0].t,200,"الإيابُ يعيد t");
 eq(back.opens[0].s,2500,"وs");
 throws(()=>CI.canonicalToCivilDraft({format:"x"}),/مرفوض/,"والفاسدُ يُرمى قبل البناء");
});

group("ملفُّ الصيغة الموحّدة",()=>{
 const t=CP.exportCanonicalFile(SRC,{includeSource:true});
 const r=CP.importCanonicalFile(t);
 eq(r.report.from,"source","المصدرُ المحفوظ هو المستعاد");
 eq(r.state.extra&&r.state.extra.keep,1,"فلا يفقد الحفظُ حقلاً لا تعرفه الصيغة");
 const r2=CP.importCanonicalFile(CP.exportCanonicalFile(SRC));
 eq(r2.report.from,"canonical","بلا مصدر ⇒ من الصيغة نفسِها");
 eq(r2.state.walls.length,1,"وجدارٌ واحد");
 throws(()=>CP.importCanonicalFile("{bad"),/JSON/,"JSON فاسد يُرمى");
});

group("strictEdit: الفشلُ يُرمى لا يُبلَع",()=>{
 ST.newState();
 const n=ST.S.walls.length;
 throws(()=>SE.strictEdit(()=>{throw new Error("قصداً")},"اختبار"),/قصداً/,"الخطأُ الأصليُّ يصل المنادي");
 eq(ST.S.walls.length,n,"والحالةُ رجعت");
 eq(SE.strictEdit(()=>7,"اختبار"),7,"والنجاحُ يعيد الناتج");
 const w=WL.addWall([0,0],[5000,0],200,"ext","c");
 throws(()=>QO.commitQuickOpening(w,2500,{kind:"door",width:6000}),/لا موضع|لا يتّسع/,
  "باب ٦ م في جدار ٥ م يُرفض صراحةً (كان يعيد {opening:undefined})");
});

group("مدخلُ المقاسات",()=>{
 eq(DI.normalizeNumber("٣٫٥"),3.5,"أرقامٌ عربية وفاصلةٌ عشرية");
 throws(()=>DI.normalizeNumber(""),/فارغ/,"والفارغُ يُرفض");
 eq(DI.normalizeAngle("۴۵"),45,"والزاويةُ بأرقامٍ فارسية");
 throws(()=>DI.normalizeAngle("abc"),/غير صالح/,"والنصُّ يُرفض");
});

group("معالجُ الغرفة",()=>{
 eq(GW.WIZARD_STEPS.join(","),"size,name,door,preview","أربعُ خطوات");
 ok(Object.isFrozen(GW.WIZARD_STEPS),"مُجمَّدة");
 let w=GW.setCorners(GW.createGuidedRoomWizard(),[0,0],[4000,3000]);
 w=GW.setDoor(w,{offset:"1.2m",width:"900"});
 eq(w.doorOffset,1200,"الموضعُ بالمتر يصير مليمتراً");
 eq(w.step,"preview","والخطوةُ التالية المعاينة");
 const c=GW.cancelGuidedRoom();
 eq(c.step,"size","الإلغاءُ يعيد البداية");
 eq(c.first,null,"بلا ركنين");
});

group("حقنُ الملفّ التالي · اسمُ المنصّة",()=>{
 eq(PJ.injectNextPick({name:"a.json"}),true,"ملفٌّ يُحقَن");
 eq(PJ.injectNextPick(null),false,"ولا شيءَ يمسحه");
 eq(PL.platform(),"web","خارج التطبيق: web");
});
summary();
