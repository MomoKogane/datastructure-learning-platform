param(
  [string]$SourceMongoUri = $env:MONGODB_URI,
  [string]$TargetMongoUri = $env:TARGET_MONGODB_URI,
  [string]$DbName = $(if ($env:CONTENT_DB_NAME) { $env:CONTENT_DB_NAME } else { 'dslp' }),
  [ValidateSet('local', 'scp')]
  [string]$TransferMode = 'local',
  [string]$TransferTargetPath = '',
  [string]$SshTarget = '',
  [int]$BatchSize = 500,
  [bool]$DropTarget = $true,
  [switch]$SkipExport,
  [switch]$SkipTransfer,
  [switch]$SkipRestore,
  [switch]$SkipVerify
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Import-DotEnv([string]$DotEnvPath) {
  if (-not (Test-Path $DotEnvPath)) {
    return
  }

  $lines = Get-Content -Path $DotEnvPath
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
      continue
    }

    $parts = $trimmed -split '=', 2
    if ($parts.Count -ne 2) {
      continue
    }

    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $existingValue = [Environment]::GetEnvironmentVariable($key)
    if (-not [string]::IsNullOrWhiteSpace($key) -and [string]::IsNullOrWhiteSpace($existingValue)) {
      Set-Item -Path "Env:$key" -Value $value
    }
  }
}

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Invoke-Checked([string]$File, [string[]]$Args) {
  & $File @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($File), exit code=$LASTEXITCODE"
  }
}

function Get-CountsEvalScript([string]$DatabaseName) {
  return @"
const dbName = '$DatabaseName';
const d = db.getSiblingDB(dbName);
const names = d.getCollectionNames().filter((n) => !n.startsWith('system.'));
const out = {};
for (const n of names) {
  out[n] = d.getCollection(n).countDocuments({});
}
print(JSON.stringify(out));
"@
}

function Get-CollectionCountsLocal([string]$MongoUri, [string]$DatabaseName) {
  $json = (& mongosh $MongoUri --quiet --eval (Get-CountsEvalScript -DatabaseName $DatabaseName)) | Out-String
  $json = $json.Trim()
  if (-not $json) { return @{} }
  return ($json | ConvertFrom-Json -AsHashtable)
}

function Get-CollectionCountsRemote([string]$Host, [string]$MongoUri, [string]$DatabaseName) {
  $eval = (Get-CountsEvalScript -DatabaseName $DatabaseName).Replace("`r", '').Replace("`n", ' ')
  $remoteCmd = "mongosh '$MongoUri' --quiet --eval `"$eval`""
  $json = (& ssh $Host $remoteCmd) | Out-String
  $json = $json.Trim()
  if (-not $json) { return @{} }
  return ($json | ConvertFrom-Json -AsHashtable)
}

function Compare-Counts([hashtable]$SourceCounts, [hashtable]$TargetCounts) {
  $allKeys = @($SourceCounts.Keys + $TargetCounts.Keys | Sort-Object -Unique)
  $mismatches = @()

  foreach ($key in $allKeys) {
    $sourceValue = if ($SourceCounts.ContainsKey($key)) { [int64]$SourceCounts[$key] } else { 0 }
    $targetValue = if ($TargetCounts.ContainsKey($key)) { [int64]$TargetCounts[$key] } else { 0 }

    if ($sourceValue -ne $targetValue) {
      $mismatches += [PSCustomObject]@{
        Collection = $key
        Source = $sourceValue
        Target = $targetValue
      }
    }
  }

  return $mismatches
}

$backRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$exportsDir = Join-Path $backRoot 'exports'
$localTransferDir = Join-Path $backRoot 'migration-transfer'

Import-DotEnv -DotEnvPath (Join-Path $backRoot '.env')

if (-not $SourceMongoUri) {
  $SourceMongoUri = $env:MONGODB_URI
}
if (-not $TargetMongoUri) {
  $TargetMongoUri = $env:TARGET_MONGODB_URI
}
if (-not $DbName) {
  $DbName = if ($env:CONTENT_DB_NAME) { $env:CONTENT_DB_NAME } else { 'dslp' }
}

if (-not $TargetMongoUri) {
  throw 'TargetMongoUri is required. Pass -TargetMongoUri or set TARGET_MONGODB_URI.'
}

if (-not $SourceMongoUri) {
  throw 'SourceMongoUri is required. Pass -SourceMongoUri or set MONGODB_URI.'
}

if (-not $SkipExport) {
  Assert-Command -Name 'npm'
}
if ((-not $SkipRestore) -or (-not $SkipVerify)) {
  Assert-Command -Name 'mongosh'
}
if ($TransferMode -eq 'scp' -and ((-not $SkipTransfer) -or (-not $SkipRestore) -or (-not $SkipVerify))) {
  Assert-Command -Name 'scp'
  Assert-Command -Name 'ssh'
}

if (-not (Test-Path $exportsDir)) {
  New-Item -ItemType Directory -Path $exportsDir | Out-Null
}

$sourceCounts = @{}
$targetCounts = @{}
$snapshotPath = ''
$restorablePath = ''

Write-Host 'MongoDB one-click migration started.' -ForegroundColor Green
Write-Host "Source: $SourceMongoUri"
Write-Host "Target: $TargetMongoUri"
Write-Host "DB: $DbName"
Write-Host "TransferMode: $TransferMode"

if (-not $SkipVerify) {
  Write-Step 'Collect source document counts'
  $sourceCounts = Get-CollectionCountsLocal -MongoUri $SourceMongoUri -DatabaseName $DbName
  Write-Host "Source collections: $($sourceCounts.Count)"
}

if (-not $SkipExport) {
  Write-Step 'Export source DB to mongosh script'
  $env:MONGODB_URI = $SourceMongoUri
  $dropText = $DropTarget.ToString().ToLowerInvariant()
  Push-Location $backRoot
  try {
    Invoke-Checked -File 'npm' -Args @('run', 'export:mongo:snapshot', '--', "--db=$DbName", "--batchSize=$BatchSize", "--dropTarget=$dropText")
  }
  finally {
    Pop-Location
  }

  $latest = Get-ChildItem -Path $exportsDir -Filter "mongo-snapshot-$DbName-*.mongosh.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) {
    throw 'Export completed but no snapshot file was found.'
  }
  $snapshotPath = $latest.FullName
} else {
  $latest = Get-ChildItem -Path $exportsDir -Filter "mongo-snapshot-$DbName-*.mongosh.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) {
    throw 'SkipExport set but no existing snapshot was found.'
  }
  $snapshotPath = $latest.FullName
}

Write-Host "Snapshot: $snapshotPath"

if (-not $SkipTransfer) {
  Write-Step 'Transfer snapshot'

  if ($TransferMode -eq 'local') {
    if (-not $TransferTargetPath) {
      $TransferTargetPath = $localTransferDir
    }
    if (-not (Test-Path $TransferTargetPath)) {
      New-Item -ItemType Directory -Path $TransferTargetPath | Out-Null
    }
    Copy-Item -Path $snapshotPath -Destination $TransferTargetPath -Force
    $restorablePath = Join-Path $TransferTargetPath (Split-Path $snapshotPath -Leaf)
  } else {
    if (-not $SshTarget) {
      throw 'SshTarget is required when TransferMode=scp (format: user@host).'
    }
    if (-not $TransferTargetPath) {
      throw 'TransferTargetPath is required when TransferMode=scp (remote directory path).'
    }

    Invoke-Checked -File 'scp' -Args @($snapshotPath, "$SshTarget`:$TransferTargetPath/")
    $restorablePath = "$TransferTargetPath/$(Split-Path $snapshotPath -Leaf)"
  }
} else {
  $restorablePath = $snapshotPath
}

Write-Host "Restore script path: $restorablePath"

if (-not $SkipRestore) {
  Write-Step 'Restore to target DB'

  if ($TransferMode -eq 'scp') {
    if (-not $SshTarget) {
      throw 'SshTarget is required for remote restore when TransferMode=scp.'
    }
    $restoreCmd = "mongosh '$TargetMongoUri' --file '$restorablePath'"
    Invoke-Checked -File 'ssh' -Args @($SshTarget, $restoreCmd)
  } else {
    Invoke-Checked -File 'mongosh' -Args @($TargetMongoUri, '--file', $restorablePath)
  }
}

if (-not $SkipVerify) {
  Write-Step 'Verify target document counts'

  if ($TransferMode -eq 'scp') {
    if (-not $SshTarget) {
      throw 'SshTarget is required for remote verify when TransferMode=scp.'
    }
    $targetCounts = Get-CollectionCountsRemote -Host $SshTarget -MongoUri $TargetMongoUri -DatabaseName $DbName
  } else {
    $targetCounts = Get-CollectionCountsLocal -MongoUri $TargetMongoUri -DatabaseName $DbName
  }

  Write-Host "Target collections: $($targetCounts.Count)"

  $mismatches = Compare-Counts -SourceCounts $sourceCounts -TargetCounts $targetCounts
  if ($mismatches.Count -gt 0) {
    Write-Host 'Count verification FAILED. Mismatched collections:' -ForegroundColor Red
    $mismatches | Format-Table -AutoSize | Out-String | Write-Host
    throw "Migration verify failed with $($mismatches.Count) mismatches."
  }

  Write-Host 'Count verification PASSED.' -ForegroundColor Green
}

Write-Host "`nMigration workflow completed successfully." -ForegroundColor Green
