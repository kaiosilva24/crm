$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

# Get current
$settings = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/settings" -Method GET -Headers $headers
$current = $settings.settings

# Update delay to 0.1
$body = @{
    manychat_api_token = $current.manychat_api_token
    manychat_tag_name  = $current.manychat_tag_name
    delay_minutes      = 0.1
    is_enabled         = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/settings" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
Write-Host "✅ Delay updated to 0.1 minutes"
