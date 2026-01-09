# Script de Teste - Distribuição Round-Robin Hotmart
# Execute este script para enviar 9 webhooks e verificar a distribuição

Write-Host "🧪 TESTE DE DISTRIBUIÇÃO ROUND-ROBIN - 9 LEADS" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

$webhookUrl = "https://8004d8d2b083.ngrok-free.app/api/hotmart/webhook"
$leads = @()

# Lista de 9 leads de teste
$testLeads = @(
    @{name="Lead Teste 1"; email="lead1@teste.com"; phone="11911111111"},
    @{name="Lead Teste 2"; email="lead2@teste.com"; phone="11922222222"},
    @{name="Lead Teste 3"; email="lead3@teste.com"; phone="11933333333"},
    @{name="Lead Teste 4"; email="lead4@teste.com"; phone="11944444444"},
    @{name="Lead Teste 5"; email="lead5@teste.com"; phone="11955555555"},
    @{name="Lead Teste 6"; email="lead6@teste.com"; phone="11966666666"},
    @{name="Lead Teste 7"; email="lead7@teste.com"; phone="11977777777"},
    @{name="Lead Teste 8"; email="lead8@teste.com"; phone="11988888888"},
    @{name="Lead Teste 9"; email="lead9@teste.com"; phone="11999999999"}
)

Write-Host "📤 Enviando 9 webhooks..." -ForegroundColor Yellow
Write-Host ""

$counter = 1
foreach ($lead in $testLeads) {
    $body = @{
        event = "PURCHASE_COMPLETE"
        data = @{
            buyer = @{
                name = $lead.name
                email = $lead.email
                phone = $lead.phone
            }
            product = @{
                name = "Produto Teste Round-Robin"
            }
        }
    } | ConvertTo-Json -Depth 10

    try {
        Write-Host "[$counter/9] Enviando: $($lead.name)..." -NoNewline
        $result = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
        
        if ($result.status -eq "success") {
            Write-Host " ✅ Sucesso!" -ForegroundColor Green
            $leads += @{
                name = $lead.name
                email = $lead.email
                uuid = $result.lead_uuid
            }
        } else {
            Write-Host " ⚠️ $($result.message)" -ForegroundColor Yellow
        }
        
        # Aguardar 500ms entre requisições
        Start-Sleep -Milliseconds 500
    }
    catch {
        Write-Host " ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $counter++
}

Write-Host ""
Write-Host "=" * 60
Write-Host "✅ Teste concluído! $($leads.Count) leads criados." -ForegroundColor Green
Write-Host ""
Write-Host "📊 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Acesse o CRM: http://localhost:5173"
Write-Host "2. Vá em 'Leads'"
Write-Host "3. Pesquise por 'Lead Teste'"
Write-Host "4. Verifique a coluna 'Vendedora' - deve estar distribuído entre as vendedoras"
Write-Host "5. A distribuição deve seguir a ordem configurada em 'Configurações > Ordem'"
Write-Host ""
Write-Host "💡 DICA: Se você tem 3 vendedoras ativas, a distribuição deve ser:" -ForegroundColor Yellow
Write-Host "   Lead 1 → Vendedora A"
Write-Host "   Lead 2 → Vendedora B"
Write-Host "   Lead 3 → Vendedora C"
Write-Host "   Lead 4 → Vendedora A (volta ao início)"
Write-Host "   Lead 5 → Vendedora B"
Write-Host "   ... e assim por diante"
Write-Host ""
Write-Host "=" * 60
