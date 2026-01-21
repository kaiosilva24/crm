$BackendUrl = "http://localhost:3001"

$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

# Use the EXACT name that exists in ManyChat for this ghost number
$name = "Debug WA"
$phone = "5567981720357"
$email = "final.proof.user@example.com"

Write-Host "Testing with Name='$name' Phone='$phone'..."

$webhookPayload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer   = @{
            email          = $email
            name           = $name
            phone          = $phone
            checkout_phone = $phone
        }
        product = @{ id = 999999; name = "Final Proof Product" }
    }
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $webhookPayload -ContentType "application/json"
Write-Host "✅ Webhook sent! Event ID: $($response.event_id)"

Start-Sleep -Seconds 5

$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$($response.event_id)" -Method GET -Headers $headers
$logs.logs | ForEach-Object { Write-Host "[$($_.status)] $($_.action_type): $($_.message)" }
