#!/usr/bin/env bash
# ═══ رفعُ CivilDraft إلى مستودعٍ جديد في حسابك على GitHub ═══
# يحتاج: git و gh (https://cli.github.com) — مرّةً: gh auth login
# التشغيل من مجلّد المشروع:
#   bash scripts/publish-github.sh                 (مستودعٌ خاصّ باسم civildraft)
#   bash scripts/publish-github.sh اسم --public    (اسمٌ آخر و/أو عامّ)
#   bash scripts/publish-github.sh civildraft --sign   (ومفتاحُ التوقيع والأسرار أيضاً)
set -euo pipefail
NAME="civildraft"; VIS="--private"; SIGN=0
for a in "$@"; do case "$a" in
  --public) VIS="--public";; --private) VIS="--private";; --sign) SIGN=1;;
  -*) echo "خيارٌ غير معروف: $a"; exit 1;; *) NAME="$a";; esac; done
command -v git >/dev/null || { echo "git غير مثبّت"; exit 1; }
command -v gh  >/dev/null || { echo "gh غير مثبّت — https://cli.github.com"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "سجّل الدخول أوّلاً: gh auth login"; exit 1; }
[ -f package.json ] && grep -q '"name": "civildraft"' package.json || { echo "شغّله من مجلّد المشروع"; exit 1; }

if [ ! -d .git ]; then git init -q -b main; fi
git add -A
git -c user.name="${GIT_NAME:-$(gh api user -q .login)}" -c user.email="${GIT_EMAIL:-$(gh api user -q .login)@users.noreply.github.com}" \
  commit -qm "CivilDraft $(node -p "require('./package.json').version" 2>/dev/null || echo 1.2.0)" || true
git branch -M main

OWNER="$(gh api user -q .login)"
if gh repo view "$OWNER/$NAME" >/dev/null 2>&1; then
  echo "⚠ $OWNER/$NAME موجودٌ أصلاً — لن يُكتب فوقه. اختر اسماً آخر: bash scripts/publish-github.sh اسم_جديد"; exit 1
fi
gh repo create "$NAME" $VIS --source . --remote origin --push \
  --description "CivilDraft — مرسمة مخطّطات معمارية عربية (ويب + أندرويد)"
echo "✓ رُفع: https://github.com/$OWNER/$NAME"

# الـ workflow يكتب في Releases: إذنُ القراءة والكتابة
gh api -X PUT "repos/$OWNER/$NAME/actions/permissions/workflow" \
  -f default_workflow_permissions=write -F can_approve_pull_request_reviews=false >/dev/null \
  && echo "✓ Actions: Read and write" || echo "⚠ اضبطه يدوياً: Settings ← Actions ← General ← Read and write"

if [ "$SIGN" = 1 ]; then
  bash scripts/make-keystore.sh --gh
  gh workflow run "Android APK" -R "$OWNER/$NAME" && echo "✓ بناءٌ موقَّعٌ بدأ"
else
  echo "الدفعُ بدأ بناءَ APK تجريبيّ. للتوقيع: bash scripts/make-keystore.sh --gh ثم Actions ← Run workflow"
fi
echo "تابع البناء: https://github.com/$OWNER/$NAME/actions  ·  الملفّ: https://github.com/$OWNER/$NAME/releases"
