$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=37" -Method GET -Headers $headers
$logs.logs | ForEach-Object { 
    Write-Host "----------------"
    Write-Host "Type: $($_.action_type)"
    Write-Host "Status: $($_.status)"
    Write-Host "Message: $($_.message)"
    Write-Host "Error: $($_.error_message)"
}
