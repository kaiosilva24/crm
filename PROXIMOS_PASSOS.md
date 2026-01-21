# 🎯 PRÓXIMOS PASSOS - Deploy PostgREST no Render

## ✅ CONCLUÍDO
- Tokens JWT gerados
- Configuração salva em `database/TOKENS_SUPABASE.txt`

---

## 📍 AGORA VOCÊ PRECISA FAZER:

### PASSO 1: Criar PostgREST no Render (5 minutos)

1. **Acesse**: https://dashboard.render.com

2. **Clique em**: `New +` → `Web Service`

3. **Selecione**: `Deploy an existing image from a registry`

4. **Configure**:
   - **Name**: `crm-postgrest`
   - **Region**: `Oregon` (mesma do PostgreSQL!)
   - **Image URL**: `postgrest/postgrest:latest`
   - **Instance Type**: `Free`

5. **Clique em**: `Create Web Service`

---

### PASSO 2: Configurar Variáveis de Ambiente (2 minutos)

No Web Service criado, vá em **Environment** e adicione estas 5 variáveis:

```
PGRST_DB_URI
postgresql://crm_banco_de_dados_06xu_user:kaknOV5bi88UUIlJY9bMMgv5rydS7WCS@dpg-d5lrs5koud1c738v8upg-a/crm_banco_de_dados_06xu

PGRST_DB_SCHEMA
public

PGRST_DB_ANON_ROLE
anon

PGRST_JWT_SECRET
txiD7T9DwAHEk7HBHHUa4UzHMHfy5MYhG6rguOxOSbI=

PGRST_SERVER_PORT
3000
```

**Clique em**: `Save Changes`

O Render vai fazer deploy automático (2-3 minutos).

---

### PASSO 3: Configurar Roles no PostgreSQL (2 minutos)

1. **Render Dashboard** → **PostgreSQL database**

2. **Clique em**: `Shell` ou `Connect`

3. **Cole e execute** este SQL:

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

## 🎉 DEPOIS DISSO, ME AVISE!

Quando terminar esses 3 passos, me avise que eu vou:
1. Atualizar o backend local
2. Testar a conexão
3. Atualizar produção no Render

**Tempo total**: ~10 minutos
**Resultado**: Supabase self-hosted 100% grátis! 🚀
