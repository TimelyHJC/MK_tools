# MK-tool pack script (ASCII only)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

$required = @(
  "manifest.json", "content.js", "content-data-field-id.js", "background.js", "popup.js", "options.js",
  "options-form-url.js", "options.html", "index.html", "fix-nullish.js",
  "assets"
)
$missing = $required | Where-Object { -not (Test-Path (Join-Path $root $_)) }
if ($missing.Count -gt 0) {
  Write-Host "Error: Missing:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  exit 1
}

$version = "0.0.0"
try { $version = (Get-Content (Join-Path $root "manifest.json") -Raw -Encoding UTF8 | ConvertFrom-Json).version } catch {}

$parent = Split-Path $root -Parent
$destZip = Join-Path $parent "MK-tool-$version.zip"
$files = @($required)
if (Test-Path (Join-Path $root "icon96.png")) { $files += "icon96.png" }
Get-ChildItem -Path $root -Filter "*.txt" -File -ErrorAction SilentlyContinue | ForEach-Object { $files += $_.Name }

if (Test-Path $destZip) { Remove-Item $destZip -Force }
Compress-Archive -Path $files -DestinationPath $destZip -Force

$size = [math]::Round((Get-Item $destZip).Length / 1KB, 1)
Write-Host "Done: MK-tool-$version.zip ($size KB, $($files.Count) items)" -ForegroundColor Green
exit 0
