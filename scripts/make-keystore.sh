#!/usr/bin/env bash
# ═══ مفتاحُ توقيع CivilDraft ═══ المرحلة G
# يُشغَّل على حاسوبك أنت، مرّةً واحدةً في عمر التطبيق. المفتاحُ لا يُرفع ولا يُرسَل:
# من يملكه ينشر تحديثاتٍ باسمك، ومن يفقده لا يحدّث التطبيقَ أبداً (Google Play
# وأندرويد يرفضان تحديثاً بمفتاحٍ آخر). احفظ civildraft.jks وكلمتَي المرور في
# مكانين (مدير كلمات مرور + نسخةٌ خارجية).
#
# التشغيل:  bash scripts/make-keystore.sh            (يطبع الأسرار الأربعة)
#           bash scripts/make-keystore.sh --gh       (ويضعها في GitHub بـ gh)
set -euo pipefail
OUT="${KEYSTORE_OUT:-$HOME/civildraft-signing}"
KS="$OUT/civildraft.jks"
ALIAS="civildraft"
command -v keytool >/dev/null || { echo "keytool غير موجود — ثبّت JDK 17"; exit 1; }
mkdir -p "$OUT"; chmod 700 "$OUT"
if [ -e "$KS" ]; then
  echo "⚠ $KS موجودٌ أصلاً — لن يُكتب فوقه (مفتاحٌ جديد = تطبيقٌ لا يُحدَّث)."
else
  PASS="$( (LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null || true) | head -c 28 )"
  [ ${#PASS} -eq 28 ] || { echo "تعذّر توليدُ كلمة مرور"; exit 1; }
  keytool -genkeypair -v -keystore "$KS" -alias "$ALIAS" -keyalg RSA -keysize 4096 \
    -validity 10000 -storepass "$PASS" -keypass "$PASS" \
    -dname "CN=CivilDraft, OU=Engineering, O=CivilDraft, C=YE" >/dev/null
  chmod 600 "$KS"
  printf '%s\n' "$PASS" > "$OUT/password.txt"; chmod 600 "$OUT/password.txt"
  echo "✓ أُنشئ $KS"
fi
PASS="$(cat "$OUT/password.txt")"
B64="$(base64 < "$KS" | tr -d '\n')"
keytool -list -keystore "$KS" -storepass "$PASS" -alias "$ALIAS" >/dev/null && echo "✓ المفتاحُ يُفتح بكلمة المرور"
if [ "${1:-}" = "--gh" ]; then
  command -v gh >/dev/null || { echo "gh غير موجود — https://cli.github.com أو أضف الأسرار يدوياً"; exit 1; }
  printf '%s' "$B64"   | gh secret set ANDROID_KEYSTORE_BASE64
  printf '%s' "$PASS"  | gh secret set ANDROID_KEYSTORE_PASSWORD
  printf '%s' "$ALIAS" | gh secret set ANDROID_KEY_ALIAS
  printf '%s' "$PASS"  | gh secret set ANDROID_KEY_PASSWORD
  echo "✓ الأسرارُ الأربعة في GitHub — الدفعُ التالي يبني APK وAAB موقَّعين"
else
  echo
  echo "GitHub ← Settings ← Secrets and variables ← Actions ← New repository secret:"
  echo "  ANDROID_KEY_ALIAS          = $ALIAS"
  echo "  ANDROID_KEYSTORE_PASSWORD  = (محتوى $OUT/password.txt)"
  echo "  ANDROID_KEY_PASSWORD       = (المحتوى نفسه)"
  echo "  ANDROID_KEYSTORE_BASE64    = (محتوى $OUT/keystore.b64.txt — احذفه بعد اللصق)"
  printf '%s' "$B64" > "$OUT/keystore.b64.txt"; chmod 600 "$OUT/keystore.b64.txt"
fi
echo
echo "احفظ مجلّد $OUT خارج المستودع. لا تلتزمه، ولا ترسله في محادثة."
