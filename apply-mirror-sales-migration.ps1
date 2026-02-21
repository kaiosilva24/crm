
# Script para aplicar migration de Espelhamento de Vendas
# Execute este script para aplicar a migration no Supabase

Write-Host "🔄 Aplicando migration: Espelhamento de Vendas" -ForegroundColor Cyan
Write-Host ""

# Ler o arquivo SQL
$sqlFile = "database\migrations\012_add_mirror_sales_source.sql"
if (Test-Path $sqlFile) {
    $sqlContent = Get-Content $sqlFile -Raw
} else {
    $sqlContent = "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mirror_sales_source_id INTEGER REFERENCES campaigns(id);"
}

Write-Host "📄 SQL a ser executado:" -ForegroundColor Yellow
Write-Host $sqlContent
Write-Host ""

Write-Host "⚠️  IMPORTANTE: Execute este SQL no painel do Supabase" -ForegroundColor Yellow
Write-Host "1. Acesse: https://supabase.com/dashboard/project/otgfcogtttydrmpfcukl/editor" -ForegroundColor White
Write-Host "2. Clique em 'SQL Editor'" -ForegroundColor White
Write-Host "3. Cole o SQL acima" -ForegroundColor White
Write-Host "4. Clique em 'Run'" -ForegroundColor White
Write-Host ""

# Copiar SQL para clipboard
$sqlContent | Set-Clipboard
Write-Host "✅ SQL copiado para a área de transferência!" -ForegroundColor Green
Write-Host ""

Write-Host "Pressione qualquer tecla após executar a migration no Supabase..." -ForegroundColor Cyan
try {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Read-Host "Pressione Enter para continuar..."
}

Write-Host ""
Write-Host "✅ Migration aplicada! Reiniciando servidor..." -ForegroundColor Green
