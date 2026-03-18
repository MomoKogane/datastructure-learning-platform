# Mongo One-Click Migration Script

File: `scripts/mongo-migrate-oneclick.ps1`

## Goal
One command pipeline for migration:
1. Export source MongoDB to a generated `mongosh` restore script
2. Transfer script to destination (local copy or `scp`)
3. Restore to target MongoDB
4. Verify document counts collection-by-collection

## Quick Start
### Local/Direct target restore (recommended when target URI is directly reachable)
```powershell
cd back
powershell -ExecutionPolicy Bypass -File .\scripts\mongo-migrate-oneclick.ps1 `
  -SourceMongoUri "mongodb://localhost:27017/dslp" `
  -TargetMongoUri "mongodb://TARGET_HOST:27017/dslp" `
  -DbName "dslp" `
  -TransferMode local
```

### Remote host via SCP + SSH restore
```powershell
cd back
powershell -ExecutionPolicy Bypass -File .\scripts\mongo-migrate-oneclick.ps1 `
  -SourceMongoUri "mongodb://localhost:27017/dslp" `
  -TargetMongoUri "mongodb://localhost:27017/dslp" `
  -DbName "dslp" `
  -TransferMode scp `
  -SshTarget "user@target-host" `
  -TransferTargetPath "/tmp"
```

## npm Shortcut
```powershell
cd back
npm run migrate:mongo:oneclick -- -SourceMongoUri "mongodb://localhost:27017/dslp" -TargetMongoUri "mongodb://TARGET_HOST:27017/dslp"
```

## Full Chain One-Click Example
```powershell
cd back
npm run migrate:mongo:oneclick -- `
  -SourceMongoUri "mongodb://localhost:27017/dslp" `
  -TargetMongoUri "mongodb://10.0.0.8:27017/dslp" `
  -DbName "dslp" `
  -TransferMode local `
  -DropTarget $true
```

## Useful Flags
- `-SkipExport` use latest existing snapshot under `back/exports`
- `-SkipTransfer` skip copy/scp and use local snapshot path directly
- `-SkipRestore` only export/transfer/verify source counts
- `-SkipVerify` skip source-target count comparison
- `-DropTarget $true|$false` whether generated restore script clears target collections first
- `-BatchSize 500` chunk size for insert batches in generated restore script

## Environment Variables
- `MONGODB_URI` can be used as default source URI
- `TARGET_MONGODB_URI` can be used as default target URI
- `CONTENT_DB_NAME` can be used as default db name

## Prerequisites
- `mongosh`
- `npm`
- `scp` and `ssh` (only for `-TransferMode scp`)
