$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$events = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/events?limit=1" -Method GET -Headers $headers
$lastId = $events.events[0].id
Write-Host "Checking logs for Last Event ID: $lastId"
$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$lastId" -Method GET -Headers $headers
$logs.logs | ForEach-Object { Write-Host "[$($_.status)] $($_.action_type): $($_.message)" }
