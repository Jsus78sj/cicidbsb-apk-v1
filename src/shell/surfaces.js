/* ═══ جردُ أسطح الواجهة ═══ المرحلة A
   كلُّ سطحٍ يظهر حول القماش، بمالكه ومصيره في قشرة الهاتف. هذا الجدول
   هو ما يحرسه اختبار المرحلة B: في الوضع الخامل لا يظهر على الهاتف إلّا
   ما مصيره "keep".
     keep  : يبقى ظاهراً (شريط علويّ · شريط سفليّ واحد)
     state : يظهر في حالةٍ بعينها وحدها (أداة · تحديد)
     sheet : يصير ورقةً سفليّةً تُفتح عند الطلب
     menu  : يدخل قائمة ☰ أو ⚙
     drop  : لا مكان له على الهاتف (يبقى في البحث إن كان أمراً) */
export const SURFACES=Object.freeze([
 {sel:"#top",      owner:"index.html",           mobile:"keep",  as:"الشريط العلويّ ٤٨px"},
 {sel:"#qat",      owner:"ribbon/schema.js QAT", mobile:"drop",  as:"↶ ↷ في الشريط العلويّ"},
 {sel:"#srchBtn",  owner:"palette.js",           mobile:"keep",  as:"🔍 في الشريط العلويّ"},
 {sel:"#recent",   owner:"recentbar.js",         mobile:"sheet", as:"أعلى ورقة البحث"},
 {sel:"#ribbon",   owner:"ribbon/render.js",     mobile:"drop",  as:"٥ فئات في الشريط السفليّ"},
 {sel:"#tools",    owner:"optbar.js",            mobile:"drop",  as:"شبكة أدوات الفئة"},
 {sel:"#optbar",   owner:"optbar.js",            mobile:"state", as:"صفّ القياس أثناء الأداة"},
 {sel:"#side",     owner:"dock.js",              mobile:"sheet", as:"ورقة الخصائص/الطبقات"},
 {sel:"#sideE",    owner:"dock.js",              mobile:"sheet", as:"ورقة الخصائص/الطبقات"},
 {sel:"#navbar",   owner:"navbar.js",            mobile:"drop",  as:"إيماءات + «ملاءمة» في ⚙"},
 {sel:"#fabDock",  owner:"dock.js",              mobile:"drop",  as:"«خصائص» في شريط التحديد"},
 {sel:"#thumb",    owner:"recentbar.js",         mobile:"drop",  as:"الشريط السفليّ نفسه"},
 {sel:"#touchBar", owner:"touchbar.js",          mobile:"state", as:"الشريط السفليّ في حالة أداة/تحديد"},
 {sel:"#compass",  owner:"canvas.js",            mobile:"state", as:"يظهر حين يُدوَّر المنظر وحده"},
 {sel:"#qpCard",   owner:"quickprops.js",        mobile:"sheet", as:"ورقة الخصائص"},
 {sel:"#cmdWrap",  owner:"cmdline.js",           mobile:"menu",  as:"مفتاحٌ في الإعدادات للمحترف"},
 {sel:"#log",      owner:"props.js rep",         mobile:"drop",  as:"تنبيهات toast.js"},
 {sel:"#status",   owner:"statusbar.js",         mobile:"menu",  as:"⚙ مساعدات"},
 {sel:"#helpBox",  owner:"helpbutton.js",        mobile:"menu",  as:"☰ ← مساعدة"},
 {sel:"#appMenu",  owner:"appmenu.js",           mobile:"menu",  as:"☰"}
]);
export const visibleIdle=()=>SURFACES.filter(s=>s.mobile==="keep");
