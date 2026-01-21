$BackendUrl = "http://localhost:3001"

# Unique email for V5
$newEmail = "debug.wa.final.v6@test.com"
$payload = @{
    event = "PURCHASE_OUT_OF_SHOPPING_CART"
    data  = @{
        buyer   = @{
            email = $newEmail
            name  = "Debug WA" 
            phone = "5567981720357"
        }
        product = @{
            name = "Produto Teste Final 3"
        }
    }
} | ConvertTo-Json -Depth 5

Write-Host "Sending webhook for $newEmail..."
$response = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/webhook" -Method POST -Body $payload -ContentType "application/json"
Write-Host "✅ Event Created: $($response.event_id)"
