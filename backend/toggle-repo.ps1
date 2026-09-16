<#
.SYNOPSIS
    Toggles sample_repo between an "insecure" and a "secure" state by physically
    moving files between the repo and a staging folder outside of it.

.DESCRIPTION
    Files are classified by filename prefix (weak_, legacy_, custom_ => insecure;
    secure_, ecc_, safe_, fixed_ => secure). Anything that matches neither is
    treated as NEUTRAL and always stays in the repo.

    Each run flips the state:
        run 1 -> INSECURE   (secure files moved out to staging)
        run 2 -> SECURE     (secure files restored, insecure files moved out)
        run 3 -> INSECURE   ... and so on.

    Empty directories left behind are pruned so the scanner sees a clean tree,
    and are recreated on restore.

.PARAMETER RepoRoot
    Path to the repo that gets scanned.

.PARAMETER StagingRoot
    Where parked files live. MUST be outside RepoRoot.

.PARAMETER Status
    Print current state and file classification, change nothing.

.PARAMETER Reset
    Restore every parked file, delete staging, forget the manifest.

.EXAMPLE
    .\toggle-repo.ps1
    .\toggle-repo.ps1 -Status
    .\toggle-repo.ps1 -Reset
#>

[CmdletBinding()]
param(
    [string]$RepoRoot    = ".\data\demo\source\sample_repo",
    [string]$StagingRoot = ".\data\demo\_toggle_staging",
    [switch]$Status,
    [switch]$Reset
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Classification rules - edit these to match your naming conventions
# ---------------------------------------------------------------------------
$InsecurePatterns = @('weak_*', 'legacy_*', 'custom_*', 'insecure_*', 'vuln_*')
$SecurePatterns   = @('secure_*', 'secured_*', 'ecc_*', 'safe_*', 'fixed_*', 'hardened_*')

function Get-FileClass {
    param([string]$Name)
    foreach ($p in $InsecurePatterns) { if ($Name -like $p) { return 'insecure' } }
    foreach ($p in $SecurePatterns)   { if ($Name -like $p) { return 'secure' } }
    return 'neutral'
}

# ---------------------------------------------------------------------------
# Path setup
# ---------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath $RepoRoot)) {
    throw "RepoRoot not found: $RepoRoot"
}
$repo = (Resolve-Path -LiteralPath $RepoRoot).Path.TrimEnd('\')

if (-not (Test-Path -LiteralPath $StagingRoot)) {
    New-Item -ItemType Directory -Path $StagingRoot -Force | Out-Null
}
$staging = (Resolve-Path -LiteralPath $StagingRoot).Path.TrimEnd('\')

if ($staging.StartsWith($repo, [StringComparison]::OrdinalIgnoreCase)) {
    throw "StagingRoot must live OUTSIDE RepoRoot, otherwise the scanner will still see the parked files."
}

$manifestPath = Join-Path $staging 'manifest.json'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Get-RelPath {
    param([string]$FullPath, [string]$Base)
    return $FullPath.Substring($Base.Length).TrimStart('\')
}

function Move-FileSafe {
    param([string]$From, [string]$To)
    $dir = Split-Path -Parent $To
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if (Test-Path -LiteralPath $To) { Remove-Item -LiteralPath $To -Force }
    Move-Item -LiteralPath $From -Destination $To -Force
}

function Remove-EmptyDirs {
    param([string]$Root)
    # deepest first, repeat until stable
    do {
        $removed = $false
        Get-ChildItem -LiteralPath $Root -Recurse -Directory |
            Sort-Object { $_.FullName.Length } -Descending |
            ForEach-Object {
                if (-not (Get-ChildItem -LiteralPath $_.FullName -Force)) {
                    Remove-Item -LiteralPath $_.FullName -Force
                    $removed = $true
                }
            }
    } while ($removed)
}

function New-Manifest {
    Write-Host "Building manifest from current repo contents..." -ForegroundColor DarkGray
    $files = @()
    Get-ChildItem -LiteralPath $repo -Recurse -File | ForEach-Object {
        $files += [pscustomobject]@{
            RelPath = Get-RelPath -FullPath $_.FullName -Base $repo
            Class   = Get-FileClass -Name $_.Name
        }
    }
    return [pscustomobject]@{
        State = 'both'
        Files = $files
    }
}

function Save-Manifest {
    param($Manifest)
    $Manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
}

function Get-ClassFiles {
    param($Manifest, [string]$Class)
    return @($Manifest.Files | Where-Object { $_.Class -eq $Class })
}

function Hide-Class {
    param($Manifest, [string]$Class)
    $count = 0
    foreach ($f in (Get-ClassFiles $Manifest $Class)) {
        $src = Join-Path $repo $f.RelPath
        if (Test-Path -LiteralPath $src) {
            Move-FileSafe -From $src -To (Join-Path (Join-Path $staging $Class) $f.RelPath)
            Write-Host ("  - removed  {0}" -f $f.RelPath) -ForegroundColor DarkYellow
            $count++
        }
    }
    Remove-EmptyDirs -Root $repo
    return $count
}

function Restore-Class {
    param($Manifest, [string]$Class)
    $count = 0
    foreach ($f in (Get-ClassFiles $Manifest $Class)) {
        $src = Join-Path (Join-Path $staging $Class) $f.RelPath
        if (Test-Path -LiteralPath $src) {
            Move-FileSafe -From $src -To (Join-Path $repo $f.RelPath)
            Write-Host ("  + restored {0}" -f $f.RelPath) -ForegroundColor DarkGreen
            $count++
        }
    }
    $classDir = Join-Path $staging $Class
    if (Test-Path -LiteralPath $classDir) { Remove-EmptyDirs -Root $classDir }
    return $count
}

# ---------------------------------------------------------------------------
# Load or create manifest
# ---------------------------------------------------------------------------
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
} else {
    $manifest = New-Manifest
    Save-Manifest $manifest
}

# ---------------------------------------------------------------------------
# -Status
# ---------------------------------------------------------------------------
if ($Status) {
    Write-Host ""
    Write-Host "Repo    : $repo"
    Write-Host "Staging : $staging"
    Write-Host "State   : $($manifest.State.ToUpper())" -ForegroundColor Cyan
    Write-Host ""
    foreach ($class in @('insecure','secure','neutral')) {
        $items = @(Get-ClassFiles $manifest $class)
        if (@($items).Count -eq 0) { continue }
        Write-Host "[$class]" -ForegroundColor Cyan
        foreach ($f in $items) {
            $present = Test-Path -LiteralPath (Join-Path $repo $f.RelPath)
            $mark = if ($present) { "IN REPO " } else { "parked  " }
            $color = if ($present) { "Green" } else { "DarkGray" }
            Write-Host ("  {0} {1}" -f $mark, $f.RelPath) -ForegroundColor $color
        }
        Write-Host ""
    }
    return
}

# ---------------------------------------------------------------------------
# -Reset
# ---------------------------------------------------------------------------
if ($Reset) {
    Write-Host "Restoring everything..." -ForegroundColor Cyan
    [void](Restore-Class $manifest 'secure')
    [void](Restore-Class $manifest 'insecure')
    Remove-Item -LiteralPath $staging -Recurse -Force
    Write-Host "Reset complete. Staging removed, manifest cleared." -ForegroundColor Green
    return
}

# ---------------------------------------------------------------------------
# Toggle
# ---------------------------------------------------------------------------
switch ($manifest.State) {
    'both' {
        Write-Host "Switching to INSECURE state..." -ForegroundColor Cyan
        [void](Hide-Class $manifest 'secure')
        $newState = 'insecure'
    }
    'insecure' {
        Write-Host "Switching to SECURE state..." -ForegroundColor Cyan
        [void](Restore-Class $manifest 'secure')
        [void](Hide-Class    $manifest 'insecure')
        $newState = 'secure'
    }
    'secure' {
        Write-Host "Switching to INSECURE state..." -ForegroundColor Cyan
        [void](Restore-Class $manifest 'insecure')
        [void](Hide-Class    $manifest 'secure')
        $newState = 'insecure'
    }
    default { throw "Unknown state in manifest: $($manifest.State)" }
}

$manifest.State = $newState
Save-Manifest $manifest

Write-Host ""
Write-Host ("Repo is now in {0} state. Run your scan, then run this script again to flip." -f $newState.ToUpper()) -ForegroundColor Green