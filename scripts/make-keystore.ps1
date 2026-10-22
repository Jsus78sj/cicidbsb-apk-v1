# ═══ مفتاحُ توقيع CivilDraft (ويندوز) ═══ المرحلة G — مثل make-keystore.sh
# التشغيل:  powershell -ExecutionPolicy Bypass -File scripts\make-keystore.ps1 [-Gh]
param([switch]$Gh)
$ErrorActionPreference = "Stop"
$Out = if ($env:KEYSTORE_OUT) { $env:KEYSTORE_OUT } else { Join-Path $HOME "civildraft-signing" }
$Ks = Join-Path $Out "civildraft.jks"; $Alias = "civildraft"; $PwFile = Join-Path $Out "password.txt"
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { throw "keytool not found - install JDK 17" }
New-Item -ItemType Directory -Force -Path $Out | Out-Null
if (Test-Path $Ks) { Write-Host "! $Ks exists - not overwritten (a new key = an app that cannot be updated)" }
else {
  $chars = [char[]]"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $b = New-Object byte[] 28; $rng.GetBytes($b)
  $Pass = -join ($b | ForEach-Object { $chars[$_ % $chars.Length] })
  & keytool -genkeypair -keystore $Ks -alias $Alias -keyalg RSA -keysize 4096 -validity 10000 `
    -storepass $Pass -keypass $Pass -dname "CN=CivilDraft, OU=Engineering, O=CivilDraft, C=YE" | Out-Null
  Set-Content -Path $PwFile -Value $Pass -NoNewline
  Write-Host "OK created $Ks"
}
$Pass = (Get-Content $PwFile -Raw).Trim()
$B64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($Ks))
if ($Gh) {
  $B64 | gh secret set ANDROID_KEYSTORE_BASE64; $Pass | gh secret set ANDROID_KEYSTORE_PASSWORD
  $Alias | gh secret set ANDROID_KEY_ALIAS; $Pass | gh secret set ANDROID_KEY_PASSWORD
  Write-Host "OK four secrets set in GitHub"
} else {
  Set-Content -Path (Join-Path $Out "keystore.b64.txt") -Value $B64 -NoNewline
  Write-Host "Add in GitHub > Settings > Secrets and variables > Actions:"
  Write-Host "  ANDROID_KEY_ALIAS = $Alias"
  Write-Host "  ANDROID_KEYSTORE_PASSWORD and ANDROID_KEY_PASSWORD = content of $PwFile"
  Write-Host "  ANDROID_KEYSTORE_BASE64 = content of keystore.b64.txt (delete it after pasting)"
}
Write-Host "Keep $Out outside the repository. Never commit or send it."
