$BackendUrl = "http://localhost:3001"
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$events = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/events?limit=50" -Method GET -Headers $headers
$event25 = $events.events | Where-Object { $_.id -eq 25 }

Write-Host "Event 25 Analysis:"
Write-Host "Phone: $($event25.contact_phone)"
Write-Host "ManyChat ID: $($event25.manychat_subscriber_id)"
Write-Host "Status: $($event25.status)"
