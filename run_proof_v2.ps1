$BackendUrl = "http://localhost:3001"

$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

$rnd = Get-Random
$email = "proof.v2.$rnd@example.com"
# Name MUST match ManyChat name exactly for fallback
$name = "Debug WA" 
$phone = "5567981720357"

Write-Host "Verifying fallback with Email=$email Name=$name Phone=$phone"

$webhookPayload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer   = @{
            email          = $email
            name           = $name
            phone          = $phone
            checkout_phone = $phone
        }
        product = @{ id = 999999; name = "Final Proof V2" }
    }
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $webhookPayload -ContentType "application/json"
$eventId = $response.event_id
Write-Host "✅ Event ID: $eventId"

Start-Sleep -Seconds 5

$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$eventId" -Method GET -Headers $headers
$logs.logs | ForEach-Object { 
    Write-Host "---"
    Write-Host "[$($_.action_type)] $($_.status)"
    if ($_.message) { Write-Host "Msg: $($_.message)" }
    if ($_.error_message) { Write-Host "Err: $($_.error_message)" }
}
