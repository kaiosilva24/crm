# Script de Teste Completo - Abandono de Carrinho com ManyChat
# Testa todo o fluxo: Webhook Hotmart → ManyChat → Delay → Verificação Campanha → Segunda Mensagem

param(
    [string]$BackendUrl = "http://localhost:3001",
    [string]$Phone = "5567981720357",
    [string]$Name = "Teste Abandono",
    [string]$Email = "teste.abandono@email.com",
    [string]$Product = "Produto Teste Abandono"
)

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TESTE COMPLETO - ABANDONO DE CARRINHO + MANYCHAT         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "📋 Configurações do Teste:" -ForegroundColor Yellow
Write-Host "   Backend URL: $BackendUrl" -ForegroundColor Gray
Write-Host "   Telefone: $Phone" -ForegroundColor Gray
Write-Host "   Nome: $Name" -ForegroundColor Gray
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   Produto: $Product`n" -ForegroundColor Gray

# Payload simulando evento Hotmart de abandono de carrinho
$payload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer    = @{
            name           = $Name
            email          = $Email
            phone          = $Phone
            checkout_phone = $Phone
        }
        product  = @{
            name = $Product
        }
        purchase = @{
            transaction = "TEST_TRANSACTION_$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# PASSO 1: Enviar evento de abandono para o webhook
Write-Host "`n1️⃣  ENVIANDO EVENTO DE ABANDONO PARA O WEBHOOK..." -ForegroundColor Cyan
Write-Host "   URL: $BackendUrl/api/cart-abandonment/webhook`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" `
        -Method POST `
        -Body $payload `
        -ContentType "application/json"
    
    Write-Host "✅ Evento enviado com sucesso!" -ForegroundColor Green
    Write-Host "   Event ID: $($response.event_id)" -ForegroundColor Gray
    Write-Host "   Mensagem: $($response.message)`n" -ForegroundColor Gray
    
    $eventId = $response.event_id
}
catch {
    Write-Host "❌ Erro ao enviar evento:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# PASSO 2: Aguardar processamento inicial
Write-Host "`n2️⃣  AGUARDANDO PROCESSAMENTO INICIAL (5 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# PASSO 3: Verificar status do evento
Write-Host "`n3️⃣  VERIFICANDO STATUS DO EVENTO..." -ForegroundColor Cyan

try {
    # Obter token de autenticação
    Write-Host "   Fazendo login para obter token..." -ForegroundColor Gray
    $loginPayload = @{
        email    = "admin@crm.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
        -Method POST `
        -Body $loginPayload `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "   ✅ Token obtido`n" -ForegroundColor Gray
    
    # Buscar evento
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $events = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/events?limit=1" `
        -Method GET `
        -Headers $headers
    
    $event = $events.events[0]
    
    Write-Host "✅ Status do Evento:" -ForegroundColor Green
    Write-Host "   ID: $($event.id)" -ForegroundColor Gray
    Write-Host "   Status: $($event.status)" -ForegroundColor Gray
    Write-Host "   Contato: $($event.contact_name) ($($event.contact_phone))" -ForegroundColor Gray
    Write-Host "   Produto: $($event.product_name)" -ForegroundColor Gray
    Write-Host "   Primeira mensagem enviada: $($event.first_message_sent)" -ForegroundColor Gray
    Write-Host "   Segunda mensagem enviada: $($event.second_message_sent)" -ForegroundColor Gray
    Write-Host "   Encontrado na campanha: $($event.found_in_campaign)`n" -ForegroundColor Gray
    
}
catch {
    Write-Host "⚠️  Erro ao verificar evento (pode ser normal se ainda processando):" -ForegroundColor Yellow
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# PASSO 4: Verificar logs
Write-Host "`n4️⃣  VERIFICANDO LOGS DE PROCESSAMENTO..." -ForegroundColor Cyan

try {
    $logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?limit=10" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Últimos logs:" -ForegroundColor Green
    foreach ($log in $logs.logs) {
        $statusColor = switch ($log.status) {
            "success" { "Green" }
            "error" { "Red" }
            "skipped" { "Yellow" }
            default { "Gray" }
        }
        
        $timestamp = ([DateTime]$log.created_at).ToString("HH:mm:ss")
        Write-Host "   [$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "$($log.action_type) " -NoNewline -ForegroundColor Cyan
        Write-Host "- $($log.status) " -NoNewline -ForegroundColor $statusColor
        Write-Host "- $($log.message)" -ForegroundColor Gray
    }
    Write-Host ""
    
}
catch {
    Write-Host "⚠️  Erro ao buscar logs:" -ForegroundColor Yellow
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Yellow
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# PASSO 5: Instruções para verificação no ManyChat
Write-Host "`n5️⃣  VERIFICAÇÃO NO MANYCHAT:" -ForegroundColor Cyan
Write-Host "   📱 Telefone de teste: $Phone" -ForegroundColor Yellow
Write-Host "`n   ✅ O que verificar:" -ForegroundColor Green
Write-Host "      1. Acesse ManyChat → Live Chat" -ForegroundColor Gray
Write-Host "      2. Busque pelo telefone: $Phone" -ForegroundColor Gray
Write-Host "      3. Verifique se o contato foi criado/atualizado" -ForegroundColor Gray
Write-Host "      4. Verifique se recebeu a primeira mensagem (Flow 1)" -ForegroundColor Gray
Write-Host "      5. Aguarde o delay configurado (ex: 60 minutos)" -ForegroundColor Gray
Write-Host "      6. Verifique se recebeu a segunda mensagem (Flow 2)`n" -ForegroundColor Gray

Write-Host "   ⏰ Delay configurado:" -ForegroundColor Yellow
try {
    $settings = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/settings" `
        -Method GET `
        -Headers $headers
    
    Write-Host "      $($settings.settings.delay_minutes) minutos`n" -ForegroundColor Cyan
}
catch {
    Write-Host "      Não foi possível obter (verifique nas configurações)`n" -ForegroundColor Gray
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# PASSO 6: Monitoramento contínuo
Write-Host "`n6️⃣  MONITORAMENTO CONTÍNUO:" -ForegroundColor Cyan
Write-Host "   Para acompanhar o processamento em tempo real, execute:`n" -ForegroundColor Gray
Write-Host "   # Ver eventos:" -ForegroundColor Yellow
Write-Host "   Invoke-RestMethod -Uri '$BackendUrl/api/cart-abandonment/events?limit=5' -Headers @{'Authorization'='Bearer $token'}`n" -ForegroundColor Gray
Write-Host "   # Ver logs:" -ForegroundColor Yellow
Write-Host "   Invoke-RestMethod -Uri '$BackendUrl/api/cart-abandonment/logs?event_id=$eventId' -Headers @{'Authorization'='Bearer $token'}`n" -ForegroundColor Gray

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

Write-Host "`n✅ TESTE INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "   Event ID: $eventId" -ForegroundColor Cyan
Write-Host "   Telefone: $Phone" -ForegroundColor Cyan
Write-Host "`n   Acompanhe o processamento nos logs do backend e no ManyChat!`n" -ForegroundColor Yellow

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TESTE CONCLUÍDO - Acompanhe o processamento              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
