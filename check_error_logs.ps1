$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=31" -Method GET -Headers $headers
$logs.logs | Where-Object { $_.status -eq 'error' } | Select-Object -ExpandProperty error_message
