$payload = @{
    event = "PURCHASE_CANCELED"
    data  = @{
        buyer    = @{
            name           = "Teste Integracao"
            email          = "teste.integracao.real@email.com"
            checkout_phone = "5567981720357"
        }
        product  = @{
            name = "Produto Teste"
        }
        purchase = @{
            transaction = "TEST_CTX_REAL_$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
    }
} | ConvertTo-Json -Depth 5

Write-Host "Sending Webhook for REAL phone..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/cart-abandonment/webhook" -Method POST -Body $payload -ContentType "application/json"
    Write-Host "Success!"
    Write-Host $response
}
catch {
    Write-Host "Error:"
    Write-Host $_.Exception.Message
}
