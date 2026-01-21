$BackendUrl = "http://localhost:3001"

# Unique email to ensure new event
$newEmail = "debug.wa.final.v3@test.com"
$payload = @{
    event = "PURCHASE_OUT_OF_SHOPPING_CART"
    data  = @{
        buyer   = @{
            email = $newEmail
            name  = "Debug WA 2"
            phone = "5567981720357"
        }
        product = @{
            name = "Produto Teste Final 2"
        }
    }
} | ConvertTo-Json -Depth 5

Write-Host "Sending webhook for $newEmail..."
$response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $payload -ContentType "application/json"
Write-Host "✅ Event Created: $($response.event_id)"
