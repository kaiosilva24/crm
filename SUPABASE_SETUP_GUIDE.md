# 🚀 GUIA RÁPIDO: Self-Hosted Supabase no Render

## PASSO 1: Gerar Tokens (CONCLUÍDO ✅)

Execute este comando para ver os tokens gerados:
```bash
node database/generate-supabase-keys.js
```

Copie TODOS os valores que aparecerem.

---

## PASSO 2: Criar PostgREST no Render

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Selecione **"Deploy an existing image from a registry"**
4. Configure:
   - **Name**: `crm-postgrest`
   - **Region**: **Oregon** (mesma do PostgreSQL)
   - **Image URL**: `postgrest/postgrest:latest`
   - **Instance Type**: **Free**

5. Clique em **"Create Web Service"**

---

## PASSO 3: Configurar Variáveis do PostgREST

No Web Service criado, vá em **"Environment"** e adicione:

**IMPORTANTE**: Execute `node database/generate-supabase-keys.js` e copie os valores!

```
PGRST_DB_URI=postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a/crm_banco_de_dados_06xu

PGRST_DB_SCHEMA=public

PGRST_DB_ANON_ROLE=anon

PGRST_JWT_SECRET=<COPIAR DO SCRIPT>

PGRST_SERVER_PORT=3000
```

Clique em **"Save Changes"**

---

## PASSO 4: Configurar Roles no PostgreSQL

1. Acesse Render Dashboard → PostgreSQL database
2. Clique em **"Shell"** (ou **"Connect"**)
3. Cole e execute este SQL:

```sql
CREATE ROLE anon NOLOGIN;
CREATE ROLE service_role NOLOGIN;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT USAGE, SELECT ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON SEQUENCES TO service_role;
```

---

## PASSO 5: Atualizar Backend Local

Edite `backend/.env`:

```env
# SUBSTITUIR estas linhas:
SUPABASE_URL=https://crm-postgrest.onrender.com
SUPABASE_ANON_KEY=<COPIAR DO SCRIPT - linha "SUPABASE_ANON_KEY">

# MANTER:
JWT_SECRET=super_secret_jwt_key_123456789
PORT=3001
```

Reiniciar backend:
```bash
# Parar servidor (Ctrl+C)
cd backend
npm run dev
```

---

## PASSO 6: Testar Localmente

1. Abrir http://localhost:5173
2. Fazer login
3. Verificar que funciona

---

## PASSO 7: Atualizar Produção (Render)

1. Render Dashboard → Backend Service
2. Aba **"Environment"**
3. Atualizar:
   ```
   SUPABASE_URL=https://crm-postgrest.onrender.com
   SUPABASE_ANON_KEY=<MESMO DO PASSO 5>
   JWT_SECRET=super_secret_jwt_key_123456789
   PORT=3001
   ```
4. Salvar (redeploy automático)

---

## ✅ VALIDAÇÃO

Testar PostgREST:
```bash
curl https://crm-postgrest.onrender.com/
```

Deve retornar JSON com informações das tabelas.

---

## 🎉 RESULTADO

- ✅ Sem limite de Egress
- ✅ 100% gratuito
- ✅ Zero mudanças no código
- ✅ Total: $0/mês

---

**PRÓXIMO PASSO**: Execute `node database/generate-supabase-keys.js` e me mostre a saída completa para eu te ajudar a configurar!
