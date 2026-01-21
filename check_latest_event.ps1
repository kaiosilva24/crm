$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$events = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/events?limit=1" -Method GET -Headers $headers
$lastEvent = $events.events[0]
$lastEvent | ConvertTo-Json -Depth 5
