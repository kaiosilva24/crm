$BackendUrl = "http://localhost:3001"

# 1. Login
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$token = $loginResponse.token

# 2. Get Token from Settings
$headers = @{ Authorization = "Bearer $token" }
$settingsResponse = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/settings" -Method GET -Headers $headers
$apiToken = $settingsResponse.settings.manychat_api_token

if ([string]::IsNullOrWhiteSpace($apiToken)) {
    Write-Host "❌ No API Token found in settings!"
    exit
}

Write-Host "Token found: $($apiToken.Substring(0, 10))..."

# 3. Test Connection
$testPayload = @{ api_token = $apiToken } | ConvertTo-Json
try {
    $testResponse = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/test-connection" -Method POST -Headers $headers -Body $testPayload -ContentType "application/json"
    
    if ($testResponse.success) {
        Write-Host "✅ Connection Test PASSED!"
    }
    else {
        Write-Host "❌ Connection Test FAILED: $($testResponse.error)"
    }
}
catch {
    Write-Host "❌ Connection Test ERROR: $($_.Exception.Message)"
}
