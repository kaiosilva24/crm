# Script de Teste - Abandono de Carrinho com ManyChat
# Telefone: 5567981720357

$BackendUrl = "http://localhost:3001"
$Phone = "5567981720357"
$Name = "Teste Kaio"
$Email = "teste.kaio@email.com"
$Product = "Produto Teste Abandono"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTE ABANDONO DE CARRINHO + MANYCHAT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Configuracoes:" -ForegroundColor Yellow
Write-Host "  Backend: $BackendUrl"
Write-Host "  Telefone: $Phone"
Write-Host "  Nome: $Name"
Write-Host "  Email: $Email`n"

# Criar payload
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
            transaction = "TEST_$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
    }
} | ConvertTo-Json -Depth 10

# PASSO 1: Enviar evento
Write-Host "PASSO 1: Enviando evento de abandono..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" `
        -Method POST `
        -Body $payload `
        -ContentType "application/json"
    
    Write-Host "OK - Evento enviado!" -ForegroundColor Green
    Write-Host "  Event ID: $($response.event_id)" -ForegroundColor Gray
    Write-Host "  Mensagem: $($response.message)`n" -ForegroundColor Gray
    
    $eventId = $response.event_id
}
catch {
    Write-Host "ERRO ao enviar evento:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# PASSO 2: Aguardar
Write-Host "PASSO 2: Aguardando processamento (5 segundos)..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# PASSO 3: Fazer login
Write-Host "`nPASSO 3: Fazendo login..." -ForegroundColor Cyan

try {
    $loginPayload = @{
        email    = "admin@crm.com"
        password = "admin123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" `
        -Method POST `
        -Body $loginPayload `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "OK - Token obtido`n" -ForegroundColor Green
}
catch {
    Write-Host "ERRO ao fazer login:" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# PASSO 4: Verificar evento
Write-Host "PASSO 4: Verificando status do evento..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $events = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/events?limit=1" `
        -Method GET `
        -Headers $headers
    
    $event = $events.events[0]
    
    Write-Host "OK - Status do Evento:" -ForegroundColor Green
    Write-Host "  ID: $($event.id)"
    Write-Host "  Status: $($event.status)"
    Write-Host "  Contato: $($event.contact_name) ($($event.contact_phone))"
    Write-Host "  Produto: $($event.product_name)"
    Write-Host "  Primeira mensagem: $($event.first_message_sent)"
    Write-Host "  Segunda mensagem: $($event.second_message_sent)"
    Write-Host "  Na campanha: $($event.found_in_campaign)`n"
}
catch {
    Write-Host "AVISO: Erro ao verificar evento" -ForegroundColor Yellow
    Write-Host "  $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# PASSO 5: Verificar logs
Write-Host "PASSO 5: Verificando logs..." -ForegroundColor Cyan

try {
    $logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?limit=10" `
        -Method GET `
        -Headers $headers
    
    Write-Host "OK - Ultimos logs:" -ForegroundColor Green
    foreach ($log in $logs.logs) {
        $timestamp = ([DateTime]$log.created_at).ToString("HH:mm:ss")
        Write-Host "  [$timestamp] $($log.action_type) - $($log.status) - $($log.message)"
    }
    Write-Host ""
}
catch {
    Write-Host "AVISO: Erro ao buscar logs" -ForegroundColor Yellow
    Write-Host "  $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# PASSO 6: Instrucoes
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACAO NO MANYCHAT:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nTelefone de teste: $Phone" -ForegroundColor Yellow
Write-Host "`nO que verificar:" -ForegroundColor Green
Write-Host "  1. Acesse ManyChat -> Live Chat"
Write-Host "  2. Busque pelo telefone: $Phone"
Write-Host "  3. Verifique se recebeu a primeira mensagem"
Write-Host "  4. Aguarde o delay configurado"
Write-Host "  5. Verifique se recebeu a segunda mensagem`n"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE CONCLUIDO!" -ForegroundColor Green
Write-Host "Event ID: $eventId" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
