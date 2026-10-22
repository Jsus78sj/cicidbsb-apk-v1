# CivilDraft على أندرويد (APK)

التطبيقُ نفسُه بلا إعادة كتابة: نفس ملفّات الويب داخل حزمة Capacitor.
كلُّ ما يختلف بين المتصفّح والهاتف في ملفٍّ واحد: `src/platform/index.js`.

## ما تغيّر في الشيفرة
| الموضع | التغيير |
|---|---|
| `src/platform/index.js` (جديد) | حفظٌ موحَّد: متصفّح ← `<a download>` · أندرويد ← `Documents/CivilDraft` + نافذةُ مشاركة. زرُّ الرجوع ← Escape ثم ضغطتان للخروج. الحفظُ عند إيقاف التطبيق. |
| `src/io/project.js` · `boqcsv.js` · `report.js` · `ui/studio.js` | التنزيلاتُ الأربعة تمرّ عبر `saveBlob` (DXF/PDF/PNG/SVG/CSV/المشروع/الفيديو). |
| `src/app.js` | لا عاملَ خدمةٍ داخل التطبيق، و`initNative` بعد `beforeunload`. |
| `src/ui/store.js` | أوّلُ تشغيلٍ على هاتف: كثافةٌ لمسية + وضعُ المبتدئ (يُغيَّران من القائمة). |
| `index.html` | `viewport-fit=cover` و`interactive-widget=resizes-content` (الكيبورد لا يغطّي الحقول). |
| `css/touch.css` | حوافُّ الشاشة الآمنة، ولا سحبَ-للتحديث ولا تحديدَ نصٍّ عرضيّ داخل التطبيق. |
| `scripts/build-android.js` (جديد) | `dist/` ← `www/` بلا `sw.js`/`_headers`/`404.html`، وCSP بلا localhost، ثم التجميع. |
| `scripts/bundle-android.js` (المرحلة D) | esbuild: ثلاثةُ مداخل في `b/` + قطعٌ كسولة في `b/c/`، وCSS واحد. الإقلاع: 249 طلباً ⇐ 62. |
| `capacitor.config.json` (جديد) | `com.civildraft.app` · `webDir: www` · مخطّط https · شاشةُ البداية وشريطُ الحالة. |

## أين يُحفظ المشروع داخل التطبيق
1. **IndexedDB داخل WebView** (كالمتصفّح تماماً): الحفظُ التلقائيّ كلَّ ٧٠٠ms، ويُكتب متزامناً عند الإيقاف.
2. **نسخةٌ احتياطيةٌ داخل التطبيق** (المرحلة B): `files/CivilDraft/autosave.json` في مجلّد بيانات التطبيق، تُكتب كلَّ ١٥ ثانيةً بعد آخر تعديل وفوراً عند الإيقاف، مع `autosave.bak.json` للسابقة. مُفعَّلةٌ تلقائياً (تُطفأ من «نسخة احتياطية خارجية»). Android Auto Backup يشملها.
3. إن وُجد تخزينُ WebView فارغاً عند الإقلاع تُستعاد النسخةُ تلقائياً ويُقال ذلك للمستخدم.
- «مسحُ التخزين» من إعدادات أندرويد أو إلغاءُ التثبيت يمسحان الاثنين معاً، فالحمايةُ الحقيقيةُ هنا هي **حفظ المشروع** (Documents/CivilDraft + مشاركة).

## الأسهل: GitHub يبني الـ APK عنك
**بأمرٍ واحد** (بعد `gh auth login` مرّةً): `bash scripts/publish-github.sh civildraft --sign` — مستودعٌ خاصٌّ جديد، والرفع، وإذنُ Actions، ومفتاحُ التوقيع وأسرارُه، وأوّلُ بناء. أو يدوياً:
1. ارفع المشروع إلى مستودع على GitHub (الفرع main).
2. Settings ← Actions ← General ← Workflow permissions ← **Read and write**.
3. كلُّ دفعٍ يبني التطبيق تلقائياً (أو Actions ← Android APK ← Run workflow). الملفّ: `.github/workflows/android.yml`.
   البوّابةُ `npm run test:ci`: كلُّ الاختبارات، ويسقط البناءُ عند أيّ فشلٍ خارج `src/tests/known-red.json` (الأحمرُ السابقُ لإعادة الهيكلة).
4. بعد ~٨ دقائق: صفحة **Releases** ← حمّل `CivilDraft-N.apk` على الهاتف وثبّته.

بلا أسرار يُبنى APK تجريبيّ (debug) يعمل ويُثبَّت عادياً. ولإصدارٍ موقَّعٍ ثابت
(يلزم للتحديث فوق النسخة السابقة دون حذفها، ولـ Google Play) أضف في
Settings ← Secrets and variables ← Actions أربعة أسرار:
`ANDROID_KEYSTORE_BASE64` (ناتج `base64 -w0 civildraft.jks`) ·
`ANDROID_KEYSTORE_PASSWORD` · `ANDROID_KEY_ALIAS` · `ANDROID_KEY_PASSWORD`.

## البناء محلّياً (اختياريّ)
### المتطلّبات (مرّةً واحدة)
- Node 18+ · JDK 17 · Android Studio (SDK 34)

## البناء
```sh
npm install
npm run build:android          # يبني www/
npx cap add android            # مرّةً واحدة: يولّد مجلّد android/
node scripts/android-patch.js  # تعديلاتُ الخطّ والكيبورد والإصدار (آليّاً)
npx @capacitor/assets generate --android --iconBackgroundColor "#0f172a" \
  --splashBackgroundColor "#0f172a"   # الأيقونات (انظر أدناه)
npm run android:apk            # ← android/app/build/outputs/apk/debug/app-debug.apk
```
للتجربة على هاتفٍ موصول: `npm run android:run`. وبعد أيّ تعديل: `npm run android:sync`.

**الأيقونات:** انسخ `icons/icon-maskable-512.png` إلى `assets/icon-only.png`
(و`assets/splash.png` إن أردت) قبل أمر `@capacitor/assets`.

## (مرجع) ما يطبّقه android-patch.js
حجمُ خطّ النظام الكبير يكسر الشريط. في
`android/app/src/main/java/com/civildraft/app/MainActivity.java`:
```java
package com.civildraft.app;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle b){
    super.onCreate(b);
    getBridge().getWebView().getSettings().setTextZoom(100);
  }
}
```
وفي `AndroidManifest.xml` داخل `<activity>`: `android:windowSoftInputMode="adjustResize"`.

## الإصدار الموقَّع (المرحلة G)
**مرّةً واحدةً في عمر التطبيق، على حاسوبك أنت:**
```sh
bash scripts/make-keystore.sh --gh      # لينكس/ماك، ويضع الأسرار في GitHub عبر gh
bash scripts/make-keystore.sh           # أو: يطبعها لتلصقها يدوياً
powershell -ExecutionPolicy Bypass -File scripts\make-keystore.ps1 [-Gh]   # ويندوز
```
يُنشئ `~/civildraft-signing/civildraft.jks` (RSA 4096، صالحٌ ~27 سنة) وكلمةَ مرورٍ عشوائية، ولا يكتب فوق مفتاحٍ موجود.
بعدها كلُّ دفعٍ يبني **APK وAAB موقَّعين**، ويتحقّق `apksigner` من التوقيع ويطبع بصمتَه (SHA-256) في سجلّ البناء.

- **المفتاحُ لا يُرسَل ولا يُلتزَم:** من يملكه ينشر تحديثاتٍ باسمك، ومن يفقده لا يحدّث التطبيقَ أبداً. احفظه مع كلمة المرور في مكانين.
- الإصدارُ التجريبيُّ (debug) والموقَّع **مفتاحان مختلفان**: احذف التجريبيَّ من الهاتف قبل تثبيت أوّل موقَّع.
- Google Play: ارفع ملفّ `.aab`، وفعّل «Play App Signing» (Google يحفظ نسخةً من مفتاح التطبيق، ومفتاحُك يصير مفتاحَ الرفع).
- `versionName` من `package.json` (يطابق `src/core/version.js` و`sw.js` — يحرسه `deploy.test.js`)، و`versionCode` رقمُ تشغيل GitHub فيزيد تلقائياً.

## قائمةُ الفحص على الجهاز
- [ ] رسمُ جدارٍ وفتحةٍ بالإصبع، والتكبير بإصبعين
- [ ] الضغطُ المطوّل يفتح قائمة السياق
- [ ] حفظُ المشروع ← يظهر في Documents/CivilDraft ونافذةُ المشاركة تُفتح
- [ ] تصديرُ DXF وPDF وPNG وCSV
- [ ] فتحُ مشروعٍ واستيرادُ DXF وصورةِ خلفية
- [ ] زرُّ الرجوع يغلق القوائم ثم ضغطتان تُخرجان
- [ ] الخروجُ إلى الشاشة الرئيسية ثم قتلُ التطبيق ← الرسمُ محفوظ عند العودة
- [ ] ارسم ثم اخرج، ثم امسح بيانات WebView فقط (`adb shell run-as com.civildraft.app rm -rf app_webview`) ← عند الفتح: «استُعيد مشروعك من النسخة الاحتياطية داخل التطبيق»
- [ ] الوضعُ الأفقيّ والرأسيّ، والكيبورد لا يغطّي حقلَ الإدخال
- [ ] المساعدُ الذكي بمفتاح مزوّدٍ سحابيّ
- [ ] من واتساب: ملفّ DXF ← مشاركة ← CivilDraft ← يُستورد مرجعاً (والتطبيقُ مغلقٌ ثم وهو مفتوح)
- [ ] من مدير الملفّات: مشروع .json ← فتح بـ CivilDraft ← يُفتح، ثم أغلق التطبيق وافتحه ← ما زال مفتوحاً
- [ ] اهتزازٌ خفيفٌ مع كلّ نقطةٍ بالإصبع، وأوضحُ عند الالتقاط
- [ ] الكتابةُ في سطر الأوامر: الشريطُ السفليُّ يختفي والحقلُ ظاهرٌ فوق الكيبورد
