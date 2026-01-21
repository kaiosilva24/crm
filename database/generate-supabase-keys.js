const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

// Gerar JWT Secret
const jwtSecret = crypto.randomBytes(32).toString('base64');

// Gerar Anon Key
const anonPayload = {
    role: 'anon',
    iss: 'postgrest',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};
const anonKey = jwt.sign(anonPayload, jwtSecret);

// Gerar Service Role Key
const servicePayload = {
    role: 'service_role',
    iss: 'postgrest',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60)
};
const serviceKey = jwt.sign(servicePayload, jwtSecret);

// Salvar em arquivo
const config = `
═══════════════════════════════════════════════════════════
🔐 CONFIGURAÇÃO SUPABASE SELF-HOSTED - TOKENS GERADOS
═══════════════════════════════════════════════════════════

📋 PASSO 1: CONFIGURAR POSTGREST NO RENDER
───────────────────────────────────────────────────────────

Criar Web Service no Render com estas variáveis de ambiente:

PGRST_DB_URI=postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a/crm_banco_de_dados_06xu

PGRST_DB_SCHEMA=public

PGRST_DB_ANON_ROLE=anon

PGRST_JWT_SECRET=${jwtSecret}

PGRST_SERVER_PORT=3000

───────────────────────────────────────────────────────────

📋 PASSO 2: ATUALIZAR BACKEND (LOCAL E PRODUÇÃO)
───────────────────────────────────────────────────────────

Editar backend/.env:

SUPABASE_URL=https://crm-postgrest.onrender.com

SUPABASE_ANON_KEY=${anonKey}

JWT_SECRET=super_secret_jwt_key_123456789

PORT=3001

───────────────────────────────────────────────────────────

📋 OPCIONAL: SERVICE ROLE KEY (ADMIN)
───────────────────────────────────────────────────────────

SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

═══════════════════════════════════════════════════════════
✅ TOKENS SALVOS EM: database/TOKENS_SUPABASE.txt
═══════════════════════════════════════════════════════════
`;

fs.writeFileSync(__dirname + '/TOKENS_SUPABASE.txt', config);
console.log(config);
console.log('\n✅ Arquivo salvo em: database/TOKENS_SUPABASE.txt\n');
