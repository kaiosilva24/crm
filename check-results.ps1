# Verificar Resultados do Teste de Abandono de Carrinho

# Login
$loginPayload = @{
    email    = "admin@crm.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$token = $loginResponse.token

$headers = @{
    "Authorization" = "Bearer $token"
}

Write-Host "`n=== CONFIGURACOES ATUAIS ===" -ForegroundColor Cyan
$settings = Invoke-RestMethod -Uri "http://localhost:3001/api/cart-abandonment/settings" -Method GET -Headers $headers
Write-Host "Enabled: $($settings.settings.enabled)" -ForegroundColor $(if ($settings.settings.enabled) { 'Green' }else { 'Red' })
Write-Host "Delay: $($settings.settings.delay_minutes) minutos" -ForegroundColor Gray
Write-Host "ManyChat Token: $(if($settings.settings.manychat_api_token){'Configurado'}else{'NAO configurado'})" -ForegroundColor $(if ($settings.settings.manychat_api_token) { 'Green' }else { 'Red' })
Write-Host "Flow ID 1: $($settings.settings.manychat_flow_id_first)" -ForegroundColor Gray
Write-Host "Flow ID 2: $($settings.settings.manychat_flow_id_second)" -ForegroundColor Gray
Write-Host "Campaign ID: $($settings.settings.campaign_id)" -ForegroundColor Gray

Write-Host "`n=== ULTIMOS EVENTOS ===" -ForegroundColor Cyan
$events = Invoke-RestMethod -Uri "http://localhost:3001/api/cart-abandonment/events?limit=5" -Method GET -Headers $headers
foreach ($event in $events.events) {
    Write-Host "`nEvent ID: $($event.id)" -ForegroundColor Yellow
    Write-Host "  Status: $($event.status)" -ForegroundColor $(if ($event.status -eq 'completed') { 'Green' }elseif ($event.status -eq 'error') { 'Red' }else { 'Yellow' })
    Write-Host "  Contato: $($event.contact_name) - $($event.contact_phone)" -ForegroundColor Gray
    Write-Host "  Produto: $($event.product_name)" -ForegroundColor Gray
    Write-Host "  Primeira msg enviada: $($event.first_message_sent)" -ForegroundColor $(if ($event.first_message_sent) { 'Green' }else { 'Red' })
    Write-Host "  Segunda msg enviada: $($event.second_message_sent)" -ForegroundColor $(if ($event.second_message_sent) { 'Green' }else { 'Yellow' })
    Write-Host "  Encontrado na campanha: $($event.found_in_campaign)" -ForegroundColor $(if ($event.found_in_campaign) { 'Green' }else { 'Yellow' })
    Write-Host "  Criado em: $($event.created_at)" -ForegroundColor Gray
}

Write-Host "`n=== ULTIMOS LOGS ===" -ForegroundColor Cyan
$logs = Invoke-RestMethod -Uri "http://localhost:3001/api/cart-abandonment/logs?limit=15" -Method GET -Headers $headers
foreach ($log in $logs.logs) {
    $statusColor = switch ($log.status) {
        "success" { "Green" }
        "error" { "Red" }
        "skipped" { "Yellow" }
        default { "Gray" }
    }
    
    Write-Host "`n[$($log.action_type)]" -ForegroundColor Cyan -NoNewline
    Write-Host " - $($log.status)" -ForegroundColor $statusColor
    Write-Host "  $($log.message)" -ForegroundColor Gray
    if ($log.error_message) {
        Write-Host "  ERRO: $($log.error_message)" -ForegroundColor Red
    }
}

Write-Host "`n"
