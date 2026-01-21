$BackendUrl = "http://localhost:3001"

# 1. Login to get token
$loginPayload = @{
    email    = "admin@crm.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful"
}
catch {
    Write-Error "Login failed: $_"
    exit
}

# 2. Prepare Webhook Payload with SPECIFIC PHONE
$webhookPayload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer   = @{
            email          = "test.created.new@example.com"
            name           = "Test Created User"
            phone          = "5511999999999"
            checkout_phone = "5511999999999"
        }
        product = @{
            id   = 123456
            name = "Test Product"
        }
    }
} | ConvertTo-Json -Depth 5

# 3. Send Webhook
Write-Host "Sending Specific Webhook for 5567981720357..."
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $webhookPayload -ContentType "application/json"
    Write-Host "✅ Webhook sent! Event ID: $($response.event_id)"
    
    $eventId = $response.event_id
    
    # 4. Check Logs after short delay
    Start-Sleep -Seconds 3
    
    $headers = @{ Authorization = "Bearer $token" }
    $logsResponse = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$eventId" -Method GET -Headers $headers
    
    Write-Host "`n--- Execution Logs ---"
    $logsResponse.logs | Select-Object action_type, status, message | Format-Table -AutoSize
    
}
catch {
    Write-Error "Webhook failed: $_"
}
