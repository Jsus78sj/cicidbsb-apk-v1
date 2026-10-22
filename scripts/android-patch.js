#!/usr/bin/env node
/* ═══ تعديلاتُ android/ بعد توليده ═══
   android/ يولّده `npx cap add android` ولا يُلتزَم في المستودع، فتعديلاتُه
   تُطبَّق هنا آلياً (محلّياً وفي GitHub Actions):
   · MainActivity: setTextZoom(100) — خطُّ النظام الكبير لا يكسر الشريط
   · AndroidManifest: adjustResize — الكيبورد لا يغطّي الحقول
   · build.gradle: versionName من package.json و versionCode من رقم البناء
   التشغيل: node scripts/android-patch.js [versionCode]   (آمنٌ للتكرار) */
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1];
function main(){
const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..");
const A=join(ROOT,"android");
if(!existsSync(A)){console.error("لا مجلّد android/ — شغّل npx cap add android أوّلاً");process.exit(1)}
const pkg=JSON.parse(readFileSync(join(ROOT,"package.json"),"utf8"));
const cfg=JSON.parse(readFileSync(join(ROOT,"capacitor.config.json"),"utf8"));
const code=Math.max(1,parseInt(process.argv[2]||process.env.VERSION_CODE||"1",10)||1);

const act=join(A,"app/src/main/java",...cfg.appId.split("."),"MainActivity.java");
writeFileSync(act,mainActivity(cfg.appId));
console.log("✓ MainActivity: textZoom 100 · استقبالُ الملفّات");

const man=join(A,"app/src/main/AndroidManifest.xml");
let m=readFileSync(man,"utf8");
if(!m.includes("windowSoftInputMode"))
 m=m.replace(/<activity\b/,'<activity\n            android:windowSoftInputMode="adjustResize"');
m=withIntentFilters(m);
writeFileSync(man,m); console.log("✓ AndroidManifest: adjustResize · فتحُ DXF/المشروع ومشاركتُه إلى التطبيق");

const g=join(A,"app/build.gradle");
let s=readFileSync(g,"utf8");
s=s.replace(/versionCode\s+\d+/,`versionCode ${code}`)
   .replace(/versionName\s+"[^"]*"/,`versionName "${pkg.version}"`);
writeFileSync(g,s); console.log(`✓ build.gradle: ${pkg.version} (${code})`);


}

/* ═══ المرحلة F · فتحُ الملفّات من التطبيقات الأخرى ═══
   «فتح بـ» (VIEW) و«مشاركة إلى» (SEND) من واتساب ومدير الملفّات وDrive.
   MainActivity ينسخ المحتوى (content://) إلى cache/incoming/ ويكتب
   pending.json، ثم يطلق حدث cdIncoming على window. والويب (platform/
   takeIncoming) يقرأ البيان عند الإقلاع وعند الحدث — فالبدءُ البارد (التطبيق
   مغلق) والدافئ (مفتوح) كلاهما يصلان. MIME ملفّات DXF غيرُ موحَّد، وواتساب
   يرسلها غالباً octet-stream، فهو مدرَجٌ والويبُ يحكم بالامتداد. */
export const MIMES=["application/dxf","application/x-dxf","image/vnd.dxf","image/x-dxf",
 "application/json","application/octet-stream"];
export const MARK="<!-- civildraft:incoming -->";
export function withIntentFilters(xml){
 if(xml.includes(MARK))return xml;                 /* آمنٌ للتكرار */
 const data=MIMES.map(t=>`                <data android:mimeType="${t}"/>`).join("\n");
 const block=`
            ${MARK}
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="content"/>
                <data android:scheme="file"/>
${data}
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND"/>
                <category android:name="android.intent.category.DEFAULT"/>
${data}
            </intent-filter>
        `;
 const i=xml.indexOf("</activity>");
 if(i<0)throw new Error("AndroidManifest بلا </activity>");
 return xml.slice(0,i)+block+xml.slice(i);
}
export function mainActivity(pkg){return `package ${pkg};

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
  /* must match MAX_IN in src/platform/index.js */
  private static final long MAX_IN = 40L * 1024 * 1024;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getBridge().getWebView().getSettings().setTextZoom(100);
    handleIncoming(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    handleIncoming(intent);
  }

  private void handleIncoming(Intent it) {
    if (it == null) return;
    String a = it.getAction();
    Uri uri = null;
    if (Intent.ACTION_VIEW.equals(a)) uri = it.getData();
    else if (Intent.ACTION_SEND.equals(a)) uri = (Uri) it.getParcelableExtra(Intent.EXTRA_STREAM);
    if (uri == null) return;
    final Uri u = uri;
    new Thread(() -> {
      try {
        String name = displayName(u);
        File dir = new File(getCacheDir(), "incoming");
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("mkdirs");
        String safe = name.replaceAll("[\\\\\\\\/:*?\\"<>|]", "_");
        if (safe.length() > 120) safe = safe.substring(safe.length() - 120);
        File out = new File(dir, "f_" + safe);
        long n = 0;
        try (InputStream in = getContentResolver().openInputStream(u);
             OutputStream os = new FileOutputStream(out)) {
          if (in == null) throw new IOException("no stream");
          byte[] buf = new byte[65536];
          int r;
          while ((r = in.read(buf)) > 0) {
            n += r;
            if (n > MAX_IN) throw new IOException("too large");
            os.write(buf, 0, r);
          }
        }
        JSONObject j = new JSONObject();
        j.put("name", name);
        j.put("path", "incoming/" + out.getName());
        j.put("size", n);
        j.put("t", System.currentTimeMillis());
        File tmp = new File(dir, "pending.tmp");
        try (FileOutputStream f = new FileOutputStream(tmp)) {
          f.write(j.toString().getBytes(StandardCharsets.UTF_8));
        }
        File pend = new File(dir, "pending.json");
        if (pend.exists() && !pend.delete()) Log.w("CivilDraft", "pending.json not deleted");
        if (!tmp.renameTo(pend)) throw new IOException("rename");
        /* a running web view hears the event; a cold start reads pending.json on boot */
        runOnUiThread(() -> {
          if (getBridge() != null) getBridge().triggerWindowJSEvent("cdIncoming");
        });
      } catch (Exception e) {
        Log.w("CivilDraft", "incoming: " + e);
      }
    }).start();
  }

  private String displayName(Uri u) {
    String n = null;
    if ("content".equals(u.getScheme())) {
      try (Cursor c = getContentResolver().query(u, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
        if (c != null && c.moveToFirst()) {
          int i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
          if (i >= 0) n = c.getString(i);
        }
      } catch (Exception e) {
        Log.w("CivilDraft", "name: " + e);
      }
    }
    if (n == null) n = u.getLastPathSegment();
    return n == null ? "file" : n;
  }
}
`}

/* آخرَ الملفّ عمداً: main() يستعمل MARK/MIMES (const) ولا تُهيَّأ قبل أسطرها —
   استدعاؤه في الأعلى يرمي «Cannot access 'MARK' before initialization» */
if(isMain)main();
