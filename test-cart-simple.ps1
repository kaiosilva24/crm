# Teste Simples de Abandono de Carrinho
$baseUrl = "http://localhost:3001"

# Payload do evento de abandono
$payload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer    = @{
            name           = "Teste Abandono CRM"
            email          = "teste.abandono@crm.com"
            phone          = "5567981720357"
            checkout_phone = "5567981720357"
        }
        product  = @{
            name = "Produto Teste Abandono"
        }
        purchase = @{
            transaction = "TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "`n=== TESTE DE ABANDONO DE CARRINHO ===" -ForegroundColor Cyan
Write-Host "`nEnviando evento de abandono..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/cart-abandonment/webhook" -Method POST -ContentType "application/json" -Body $payload
    
    Write-Host "`nSUCESSO!" -ForegroundColor Green
    Write-Host "Event ID: $($response.event_id)" -ForegroundColor Cyan
    Write-Host "Mensagem: $($response.message)" -ForegroundColor Gray
    
    # Aguardar processamento
    Write-Host "`nAguardando processamento (5 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Buscar logs
    Write-Host "`nBuscando logs..." -ForegroundColor Yellow
    $loginPayload = @{
        email    = "admin@crm.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.token
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $logs = Invoke-RestMethod -Uri "$baseUrl/api/cart-abandonment/logs?limit=10" -Method GET -Headers $headers
    
    Write-Host "`n=== ULTIMOS LOGS ===" -ForegroundColor Cyan
    foreach ($log in $logs.logs) {
        $statusColor = if ($log.status -eq "success") { "Green" } elseif ($log.status -eq "error") { "Red" } else { "Yellow" }
        Write-Host "$($log.action_type) - " -NoNewline -ForegroundColor Cyan
        Write-Host "$($log.status) - " -NoNewline -ForegroundColor $statusColor
        Write-Host "$($log.message)" -ForegroundColor Gray
    }
    
    Write-Host "`n=== TESTE CONCLUIDO ===" -ForegroundColor Green
    Write-Host "Verifique no ManyChat se o contato recebeu a mensagem!" -ForegroundColor Yellow
    Write-Host "Telefone: 5567981720357`n" -ForegroundColor Cyan
    
}
catch {
    Write-Host "`nERRO!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
