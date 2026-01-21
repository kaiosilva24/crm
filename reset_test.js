$BackendUrl = "http://localhost:3001"

# 1. Login
$loginPayload = @{ email = "admin@crm.com"; password = "admin123" } | ConvertTo - Json
$loginResponse = Invoke - RestMethod - Uri "$BackendUrl/api/auth/login" - Method POST - Body $loginPayload - ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

# 2. SQL to delete (simulated by just deleting via Supabase if possible, but we don't have direct DB access easily via API)
# Actually, I can't easily delete via API unless I have an endpoint. 
# BUT, I can send a Modified phone number that LOOKS like the user's but is slightly different? 
# No, user wants THAT number.

# Alternative: We can just manually insert a "completed" status or delete via SQL if I can run SQL.
# I have access to migrations.I can write a migration to clear it ? No that's overkill.

# I will use the `run_command` to run a node script that uses supabase client to delete it.
# That is reliable.
