$BackendUrl = "http://localhost:3001"

# 1. Login
$loginPayload = @{
    email    = "admin@crm.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$token = $loginResponse.token

# 2. Fetch Logs
$headers = @{ Authorization = "Bearer $token" }
$logs = Invoke-RestMethod -Uri "$BackendUrl/api/cart-abandonment/logs?event_id=10" -Method GET -Headers $headers
    
$logs.logs | Select-Object action_type, status, message | Format-List
