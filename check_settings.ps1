$BackendUrl = "http://localhost:3001"

# 1. Login
$loginPayload = @{
    email    = "admin@crm.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$token = $loginResponse.token

# 2. Fetch Settings
$headers = @{ Authorization = "Bearer $token" }
$response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/settings" -Method GET -Headers $headers

Write-Host "Checking specific fields:"
Write-Host "Enabled: $($response.settings.is_enabled)"
Write-Host "API Token: '$($response.settings.manychat_api_token)'"
Write-Host "Flow 1 ID: '$($response.settings.manychat_flow_id_first)'"
Write-Host "Flow 2 ID: '$($response.settings.manychat_flow_id_second)'"
