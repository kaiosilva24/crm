$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$newToken = "1130274:bdc97c93f4e0529504b218836910ade1"
$body = @{ manychat_api_token = $newToken } | ConvertTo-Json

Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/settings" -Method PUT -Body $body -Headers $headers -ContentType "application/json"
Write-Host "✅ API Token updated successfully!"
