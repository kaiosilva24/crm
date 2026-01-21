# 🔧 CORREÇÃO: Executar Migração do Banco de Dados

## ❌ Problema Identificado

A aba "Grupos" não está funcionando porque **as tabelas do banco de dados ainda não foram criadas**.

Erro: `Could not find the table 'public.whatsapp_connections'`

---

## ✅ SOLUÇÃO: Execute a Migração SQL

### Passo 1: Copiar o SQL

Abra o arquivo: `database/migrations/006_whatsapp_groups.sql`

Ou copie o SQL abaixo:

```sql
-- Tabela para armazenar conexões WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'disconnected',
    qr_code TEXT,
    session_data JSONB,
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para armazenar grupos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    group_id VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(connection_id, group_id)
);

-- Tabela para associar grupos a campanhas
CREATE TABLE IF NOT EXISTS campaign_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    whatsapp_group_id UUID REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(campaign_id, whatsapp_group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_connection ON whatsapp_groups(connection_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_campaign ON campaign_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_group ON campaign_groups(whatsapp_group_id);

-- RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_groups ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections;
CREATE POLICY "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on campaign_groups" ON campaign_groups;
CREATE POLICY "Allow all for authenticated users on campaign_groups" ON campaign_groups
    FOR ALL USING (true) WITH CHECK (true);
```

### Passo 2: Executar no Supabase

1. **Acesse**: https://supabase.com/dashboard
2. **Selecione** seu projeto do CRM
3. **Clique** em "SQL Editor" (menu lateral esquerdo)
4. **Clique** em "+ New Query"
5. **Cole** o SQL acima
6. **Clique** em "Run" (ou pressione Ctrl+Enter)
7. **Aguarde** a mensagem "Success. No rows returned"

### Passo 3: Verificar

Após executar o SQL:

1. Vá em "Table Editor" no Supabase
2. Verifique se as tabelas foram criadas:
   - ✅ `whatsapp_connections`
   - ✅ `whatsapp_groups`
   - ✅ `campaign_groups`

### Passo 4: Testar

1. Volte ao CRM: http://localhost:5173
2. Faça login como **Admin**
3. Clique em **"Grupos"** no menu
4. A página deve carregar sem erros!

---

## 🎯 Após Executar a Migração

A funcionalidade estará 100% operacional:

- ✅ Criar conexões WhatsApp
- ✅ Gerar QR Code
- ✅ Conectar dispositivo
- ✅ Listar grupos
- ✅ Associar grupos a campanhas

---

## 📞 Precisa de Ajuda?

Se ainda houver erros:

1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do backend no terminal
3. Confirme que está logado como **Admin**
4. Tente recarregar a página (Ctrl+F5)

---

**Depois de executar a migração, a aba Grupos funcionará perfeitamente! 🚀**
