# Plattenspieler - install, update or uninstall for Spicetify (Windows PowerShell 5.1+ / PowerShell 7).
#
# Install or update:
#   iwr -useb https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.ps1 | iex
#
# Uninstall:
#   $env:PLATTENSPIELER_UNINSTALL = "1"; iwr -useb https://raw.githubusercontent.com/hjorven/spicetify-plattenspieler/master/install.ps1 | iex
#
# Options (environment variables):
#   PLATTENSPIELER_REF        install a specific version (tag or branch; default: latest release, else master)
#   PLATTENSPIELER_NO_APPLY   "1" = copy files and register the app, but do not run "spicetify apply"
#   PLATTENSPIELER_UNINSTALL  "1" = remove the app
#   SPICETIFY_CONFIG          Spicetify config folder, if it is not the default
#
# Requires: Spicetify CLI (https://spicetify.app).

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$Repo = "hjorven/spicetify-plattenspieler"
$App = "plattenspieler"
$Files = @("index.js", "style.css", "manifest.json")

function Write-Step([string]$Text) { Write-Host "==> $Text" -ForegroundColor Cyan }
function Write-Info([string]$Text) { Write-Host "    $Text" -ForegroundColor DarkGray }
function Write-Warn([string]$Text) { Write-Host "Warning: $Text" -ForegroundColor Yellow }

function Invoke-Spicetify([string[]]$Arguments) {
    # Runs spicetify and returns @{ ExitCode; Output } without throwing on native stderr output.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & spicetify @Arguments 2>&1 | Out-String
        return @{ ExitCode = $LASTEXITCODE; Output = $output }
    } finally {
        $ErrorActionPreference = $previous
    }
}

function Get-CustomAppsDir {
    # Where "spicetify apply" looks for custom apps: <config folder>\CustomApps.
    if ($env:SPICETIFY_CONFIG) { return Join-Path $env:SPICETIFY_CONFIG "CustomApps" }
    $result = Invoke-Spicetify @("path", "-c")
    $cfg = $result.Output -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -Last 1
    if ($cfg) { $cfg = $cfg.Trim() }
    if ($cfg -and (Test-Path -LiteralPath $cfg)) { return Join-Path (Split-Path -Parent $cfg) "CustomApps" }
    return Join-Path $env:APPDATA "spicetify\CustomApps"
}

function Invoke-ApplyWithRecovery {
    # "spicetify apply"; on a stale backup (typical after a Spotify update) recover with "backup apply".
    $apply = Invoke-Spicetify @("apply")
    if ($apply.ExitCode -eq 0 -and $apply.Output -notmatch '(?i)outdated|mismatch|backup apply') { return }
    Write-Host $apply.Output
    Write-Warn "spicetify apply did not succeed, trying: spicetify backup apply"
    $backup = Invoke-Spicetify @("backup", "apply")
    if ($backup.ExitCode -eq 0) { return }
    Write-Warn "backup apply failed, trying: spicetify restore backup apply"
    $restore = Invoke-Spicetify @("restore", "backup", "apply")
    if ($restore.ExitCode -eq 0) { return }
    Write-Host $restore.Output
    throw "Spicetify could not be applied. Close Spotify completely (including the tray icon) and run: spicetify restore backup apply"
}

if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
    throw "Spicetify CLI not found. Install it first: https://spicetify.app/docs/getting-started"
}

$Dest = Join-Path (Get-CustomAppsDir) $App

if ($env:PLATTENSPIELER_UNINSTALL -eq "1") {
    Write-Step "Uninstalling Plattenspieler"
    Invoke-Spicetify @("config", "custom_apps", "$App-") | Out-Null
    if (Test-Path -LiteralPath $Dest) {
        Remove-Item -LiteralPath $Dest -Recurse -Force
        Write-Info "removed $Dest"
    }
    if ($env:PLATTENSPIELER_NO_APPLY -ne "1") {
        Write-Step "Applying Spicetify"
        Invoke-ApplyWithRecovery
    }
    # Reset the switch so a later install in the same window does not uninstall again.
    Remove-Item Env:\PLATTENSPIELER_UNINSTALL -ErrorAction SilentlyContinue
    Write-Host "Plattenspieler was removed." -ForegroundColor Green
    return
}

Write-Step "Finding the version to install"
$Ref = $env:PLATTENSPIELER_REF
if (-not $Ref) {
    try {
        $Ref = (Invoke-RestMethod -UseBasicParsing -Uri "https://api.github.com/repos/$Repo/releases/latest").tag_name
    } catch {
        $Ref = $null
    }
    if (-not $Ref) { $Ref = "master" }
}
Write-Info "version: $Ref"

$Tmp = Join-Path ([IO.Path]::GetTempPath()) ("plattenspieler-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null
try {
    Write-Step "Downloading"
    foreach ($f in $Files) {
        $target = Join-Path $Tmp $f
        Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/$Repo/$Ref/dist/$f" -OutFile $target
        if ((Get-Item -LiteralPath $target).Length -eq 0) { throw "Downloaded file is empty: $f" }
        Write-Info $f
    }
    if (-not (Select-String -LiteralPath (Join-Path $Tmp "index.js") -Pattern "PlattenspielerApp" -SimpleMatch -Quiet)) {
        throw "Downloaded index.js does not look like Plattenspieler."
    }

    Write-Step "Installing to $Dest"
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    foreach ($f in $Files) { Copy-Item -LiteralPath (Join-Path $Tmp $f) -Destination (Join-Path $Dest $f) -Force }
} finally {
    Remove-Item -LiteralPath $Tmp -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Step "Registering the app"
$cfgResult = Invoke-Spicetify @("config", "custom_apps", $App)
if ($cfgResult.ExitCode -ne 0) { throw "spicetify config failed: $($cfgResult.Output)" }

if ($env:PLATTENSPIELER_NO_APPLY -eq "1") {
    Write-Info "PLATTENSPIELER_NO_APPLY=1: skipping spicetify apply"
} else {
    Write-Step "Applying Spicetify (Spotify restarts)"
    Invoke-ApplyWithRecovery
}

Write-Host ""
Write-Host "Done. Open Plattenspieler in the Spotify sidebar." -ForegroundColor Green
