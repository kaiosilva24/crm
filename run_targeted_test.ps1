$BackendUrl = "http://localhost:3001"

# 1. Login
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
try {
    $token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
    Write-Host "✅ Login successful"
}
catch {
    Write-Error "Login failed: $_"; exit
}

# 2. Payload with Target Phone but Unique Email
$uniqueId = Get-Random
$webhookPayload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer   = @{
            email          = "test.user.$uniqueId@example.com"
            name           = "Test Retry User"
            phone          = "5567981720357"
            checkout_phone = "5567981720357"
        }
        product = @{ id = 123456; name = "Test Product" }
    }
} | ConvertTo-Json -Depth 5

# 3. Send Webhook
Write-Host "Sending Webhook for 5567981720357..."
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $webhookPayload -ContentType "application/json"
    Write-Host "✅ Webhook sent! Event ID: $($response.event_id)"
    
    # 4. Check Logs
    Start-Sleep -Seconds 5
    $headers = @{ Authorization = "Bearer $token" }
    $logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$($response.event_id)" -Method GET -Headers $headers
    
    Write-Host "`n--- Execution Logs ---"
    $logs.logs | Select-Object action_type, status, message | ConvertTo-Json -Depth 5
}
catch {
    Write-Error "Test failed: $_"
}
