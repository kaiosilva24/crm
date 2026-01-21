$payload = @"
{
  "event": "PURCHASE_CANCELED",
  "data": {
    "buyer": {
      "name": "Teste Abandono CRM",
      "email": "teste.abandono@crm.com",
      "phone": "5567981720357",
      "checkout_phone": "5567981720357"
    },
    "product": {
      "name": "Produto Teste Abandono"
    },
    "purchase": {
      "transaction": "TEST-20260117115000"
    }
  }
}
"@

Invoke-RestMethod -Uri "http://localhost:3001/api/cart-abandonment/webhook" -Method POST -ContentType "application/json" -Body $payload
