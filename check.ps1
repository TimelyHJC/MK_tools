# MK-tool local validation script (ASCII only)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
Set-Location -LiteralPath $root

function Fail([string]$Message) {
  Write-Host $Message -ForegroundColor Red
  exit 1
}

$required = @(
  "manifest.json",
  "background.js",
  "content.js",
  "content-data-field-id.js",
  "index.html",
  "options.html",
  "popup.js",
  "options.js",
  "options-form-url.js",
  "fix-nullish.js"
)

$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_)) })
if ($missing.Count -gt 0) {
  Write-Host "Error: Missing required files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  exit 1
}

$backgroundText = Get-Content -LiteralPath (Join-Path $root "background.js") -Raw
if ($backgroundText.Contains("content-v-aaa-thumb.js") -and -not (Test-Path -LiteralPath (Join-Path $root "content-v-aaa-thumb.js"))) {
  Fail "Error: background.js references content-v-aaa-thumb.js, but the file is missing."
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Fail "Error: node is required to run syntax checks."
}

$scriptsToCheck = @(
  "background.js",
  "content.js",
  "content-data-field-id.js",
  "popup.js",
  "options-form-url.js",
  "fix-nullish.js"
)

if (Test-Path -LiteralPath (Join-Path $root "content-v-aaa-thumb.js")) {
  $scriptsToCheck += "content-v-aaa-thumb.js"
}

foreach ($script in $scriptsToCheck) {
  Write-Host "Checking $script ..."
  & node --check (Join-Path $root $script)
  if ($LASTEXITCODE -ne 0) {
    Fail "Error: Syntax check failed for $script"
  }
}

Write-Host "OK: required files exist and syntax checks passed." -ForegroundColor Green
