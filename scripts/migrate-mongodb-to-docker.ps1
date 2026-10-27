#Requires -Version 5.1
<#
.SYNOPSIS
  Dump mcqAnalysis from Atlas and restore into local Docker Mongo (no data shape changes).

  Prerequisites: Docker running, server stopped (no writes during cutover).
  Reads MONGODB_ATLAS_URL, MONGO_* and MONGO_DB_NAME from server/.env
#>
$ErrorActionPreference = "Stop"
$ServerRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ServerRoot ".env"

function Read-DotEnv([string]$Path) {
  $map = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    $map[$key] = $val
  }
  return $map
}

function Get-AtlasCollectionCountsJson([string]$Uri, [string]$DbName) {
  $js = @"
const dbh = db.getSiblingDB('$DbName');
const names = dbh.getCollectionNames().filter(n => !n.startsWith('system.')).sort();
const out = {};
for (const n of names) { out[n] = dbh.getCollection(n).countDocuments(); }
print(EJSON.stringify(out));
"@
  docker run --rm mongo:7 mongosh "$Uri" --quiet --eval $js
}

function Get-LocalCollectionCountsJson([string]$MongoUser, [string]$MongoPass, [string]$DbName) {
  $js = @"
const dbh = db.getSiblingDB('$DbName');
const names = dbh.getCollectionNames().filter(n => !n.startsWith('system.')).sort();
const out = {};
for (const n of names) { out[n] = dbh.getCollection(n).countDocuments(); }
print(EJSON.stringify(out));
"@
  docker exec mcq_mongo mongosh `
    --username $MongoUser `
    --password $MongoPass `
    --authenticationDatabase admin `
    $DbName `
    --quiet `
    --eval $js
}

$envMap = Read-DotEnv $EnvFile
$AtlasUri = $envMap["MONGODB_ATLAS_URL"]
$DbName = if ($envMap["MONGO_DB_NAME"]) { $envMap["MONGO_DB_NAME"] } else { "mcqAnalysis" }
$MongoUser = if ($envMap["MONGO_INITDB_ROOT_USERNAME"]) { $envMap["MONGO_INITDB_ROOT_USERNAME"] } else { "root" }
$MongoPass = if ($envMap["MONGO_INITDB_ROOT_PASSWORD"]) { $envMap["MONGO_INITDB_ROOT_PASSWORD"] } else { "rootpass" }
$MongoPort = if ($envMap["MONGO_PORT"]) { $envMap["MONGO_PORT"] } else { "27018" }

if (-not $AtlasUri) {
  throw "MONGODB_ATLAS_URL is missing in .env (Atlas connection for mongodump)."
}

Write-Host "==> Ensure the API server is stopped (write freeze for safe cutover)."
docker info | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $ServerRoot "backups\mongodb-$stamp"
$DumpDir = Join-Path $BackupRoot "dump"
New-Item -ItemType Directory -Force -Path $DumpDir | Out-Null

Write-Host "==> Recording Atlas collection counts..."
$atlasCountsRaw = Get-AtlasCollectionCountsJson -Uri $AtlasUri -DbName $DbName
if (-not $atlasCountsRaw) { throw "Failed to read Atlas counts. Check MONGODB_ATLAS_URL and network." }
$atlasCountsPath = Join-Path $BackupRoot "atlas-collection-counts.json"
$atlasCountsRaw | Set-Content -Encoding utf8 $atlasCountsPath
Write-Host "    Saved $atlasCountsPath"

Write-Host "==> mongodump from Atlas (database: $DbName)..."
$dumpMount = "${DumpDir}:/dump"
docker run --rm -v $dumpMount mongo:7 mongodump --uri="$AtlasUri" --db=$DbName --out=/dump
if ($LASTEXITCODE -ne 0) { throw "mongodump failed." }

$dbDumpPath = Join-Path $DumpDir $DbName
if (-not (Test-Path $dbDumpPath)) {
  throw "Expected dump folder not found: $dbDumpPath"
}

Push-Location $ServerRoot
try {
  Write-Host "==> Starting Docker Mongo..."
  docker compose up -d mongo
  if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

  $localUri = "mongodb://${MongoUser}:${MongoPass}@127.0.0.1:${MongoPort}/?authSource=admin"
  $ready = $false
  for ($i = 0; $i -lt 45; $i++) {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $pingOut = docker exec mcq_mongo mongosh `
      --username $MongoUser `
      --password $MongoPass `
      --authenticationDatabase admin `
      --quiet `
      --eval "db.adminCommand('ping').ok" 2>&1
    $pingOk = ($LASTEXITCODE -eq 0) -and ($pingOut -match "1")
    $ErrorActionPreference = $prevEap
    if ($pingOk) { $ready = $true; break }
    Start-Sleep -Seconds 2
  }
  if (-not $ready) { throw "Mongo container did not become ready." }

  Write-Host "==> mongorestore into Docker (--drop replaces existing $DbName collections)..."
  docker cp $dbDumpPath "mcq_mongo:/tmp/mcq-restore-$DbName"
  docker exec mcq_mongo mongorestore `
    --username $MongoUser `
    --password $MongoPass `
    --authenticationDatabase admin `
    --drop `
    --db $DbName `
    "/tmp/mcq-restore-$DbName"
  if ($LASTEXITCODE -ne 0) { throw "mongorestore failed." }

  Write-Host "==> Verifying local collection counts vs Atlas..."
  $localCountsRaw = Get-LocalCollectionCountsJson -MongoUser $MongoUser -MongoPass $MongoPass -DbName $DbName
  $localCountsPath = Join-Path $BackupRoot "docker-collection-counts.json"
  $localCountsRaw | Set-Content -Encoding utf8 $localCountsPath

  $atlas = $atlasCountsRaw | ConvertFrom-Json
  $local = $localCountsRaw | ConvertFrom-Json
  $atlasProps = $atlas.PSObject.Properties | Sort-Object Name
  $mismatch = @()
  foreach ($p in $atlasProps) {
    $name = $p.Name
    $a = [int64]$p.Value
    $lProp = $local.PSObject.Properties | Where-Object { $_.Name -eq $name }
    if (-not $lProp) {
      $mismatch += "missing collection: $name"
      continue
    }
    $l = [int64]$lProp.Value
    if ($a -ne $l) { $mismatch += "$name atlas=$a local=$l" }
  }
  foreach ($p in $local.PSObject.Properties) {
    if (-not ($atlas.PSObject.Properties.Name -contains $p.Name)) {
      $mismatch += "extra local collection: $($p.Name)"
    }
  }

  if ($mismatch.Count -gt 0) {
    $report = Join-Path $BackupRoot "verify-mismatch.txt"
    $mismatch | Set-Content $report
    throw "Verification failed. See $report"
  }

  Write-Host "==> Success. All collection counts match."
  Write-Host "    Backup: $BackupRoot"
  Write-Host "    MONGODB_URL in .env should point at local Docker Mongo."
}
finally {
  Pop-Location
}
