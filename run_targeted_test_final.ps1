$BackendUrl = "http://localhost:3001"

$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json").token
$headers = @{ Authorization = "Bearer $token" }

# Unique email to force CREATE path
$uniqueId = Get-Random
$email = "test.create.newtoken.$uniqueId@example.com"
Write-Host "Testing with email: $email"

$webhookPayload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer   = @{
            email          = $email
            name           = "Token Verification User"
            phone          = "5567981720357"
            checkout_phone = "5567981720357"
        }
        product = @{ id = 123456; name = "Test Product" }
    }
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $webhookPayload -ContentType "application/json"
Write-Host "✅ Webhook sent! Event ID: $($response.event_id)"

Start-Sleep -Seconds 5

$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=$($response.event_id)" -Method GET -Headers $headers
$logs.logs | ForEach-Object { Write-Host "[$($_.status)] $($_.action_type): $($_.message)" }
