$BackendUrl = "http://localhost:3001"

# 1. Login
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$token = $loginResponse.token

# 2. Fetch Latest Log
$headers = @{ Authorization = "Bearer $token" }
$events = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/events?limit=1" -Method GET -Headers $headers
$eventId = $events.events[0].id

Write-Host "Checking logs for latest Event ID: $eventId"

$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$eventId" -Method GET -Headers $headers
    
$logs.logs | Select-Object action_type, status, message, error_message | ConvertTo-Json -Depth 5
