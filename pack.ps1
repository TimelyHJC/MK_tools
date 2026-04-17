# MK-tool pack script (ASCII only)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
Set-Location -LiteralPath $root

function Fail([string]$Message) {
  Write-Host $Message -ForegroundColor Red
  exit 1
}

function Read-ManifestVersion {
  $manifestPath = Join-Path $root "manifest.json"

  try {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $version = [string]$manifest.version
    if ([string]::IsNullOrWhiteSpace($version)) {
      throw "manifest.json does not contain a valid version."
    }
    return $version.Trim()
  } catch {
    Fail "Error: Unable to read version from manifest.json. $($_.Exception.Message)"
  }
}

$required = @(
  "manifest.json",
  "content.js",
  "content-data-field-id.js",
  "background.js",
  "popup.js",
  "options.js",
  "options-form-url.js",
  "options.html",
  "index.html",
  "fix-nullish.js",
  "assets"
)

$optional = @(
  "icon96.png",
  "content-v-aaa-thumb.js"
)

$missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $root $_)) })
if ($missing.Count -gt 0) {
  Write-Host "Error: Missing required files:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  exit 1
}

$version = Read-ManifestVersion
$parent = Split-Path -Path $root -Parent
$destZip = Join-Path $parent "MK-tool-$version.zip"
$files = New-Object System.Collections.Generic.List[string]

foreach ($entry in $required + $optional) {
  if (Test-Path -LiteralPath (Join-Path $root $entry)) {
    [void]$files.Add($entry)
  }
}

Get-ChildItem -LiteralPath $root -Filter "*.txt" -File -ErrorAction SilentlyContinue |
  Sort-Object Name |
  ForEach-Object {
    if (-not $files.Contains($_.Name)) {
      [void]$files.Add($_.Name)
    }
  }

if (Test-Path -LiteralPath $destZip) {
  Remove-Item -LiteralPath $destZip -Force
}

Compress-Archive -LiteralPath $files -DestinationPath $destZip -Force

$archive = Get-Item -LiteralPath $destZip
$size = [math]::Round($archive.Length / 1KB, 1)
Write-Host "Done: $($archive.Name) ($size KB, $($files.Count) items)" -ForegroundColor Green
Write-Host "Output: $($archive.FullName)"
exit 0
