# Apply dual tag configuration migration
$migrationFile = ".\database\migrations\012_dual_tag_config.sql"

Write-Host "Applying migration: 012_dual_tag_config.sql" -ForegroundColor Cyan

# Read migration content
$sql = Get-Content $migrationFile -Raw

# Execute via backend (requires backend running)
$body = @{
    sql = $sql
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/admin/execute-sql" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Migration failed. Applying manually via Supabase..." -ForegroundColor Yellow
    Write-Host "SQL to execute:"
    Write-Host $sql
}
