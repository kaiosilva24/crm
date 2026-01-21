# 🔧 Correção: Adicionar Colunas Provider e Pairing Code

## Problema
A tabela `whatsapp_connections` está faltando colunas essenciais:
- `provider` - Para suportar Baileys (local) e Whapi (cloud)
- `pairing_code` - Para método de pareamento por código
- `pairing_phone` - Número usado para gerar código de pareamento

Isso está causando **erro 500** ao tentar criar/listar conexões WhatsApp.

## ✅ Solução - Execute no Supabase SQL Editor

### Passo 1: Acesse o SQL Editor
1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto: `otgfcogtttydrmpfcukl`
3. Vá em **SQL Editor** (menu lateral esquerdo)

### Passo 2: Execute o SQL abaixo

Copie e cole todo o código SQL abaixo no editor e clique em **RUN**:

```sql
-- Adicionar coluna provider para suportar múltiplos providers (baileys/whapi)
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'baileys';

-- Adicionar colunas para suporte a Pairing Code (Redirect+)
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10);

ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);

-- Atualizar conexões existentes para terem provider 'baileys'
UPDATE whatsapp_connections 
SET provider = 'baileys' 
WHERE provider IS NULL;
```

### Passo 3: Verificar
Execute este comando para confirmar que as colunas foram adicionadas:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_connections'
ORDER BY ordinal_position;
```

Você deve ver as colunas:
- `provider` (varchar com default 'baileys')
- `pairing_code` (varchar)
- `pairing_phone` (varchar)

## 🎯 Após a Execução

1. Recarregue a página do frontend (F5)
2. O erro 500 deve desaparecer
3. Você poderá criar novas conexões normalmente
4. A seleção de grupos funcionará corretamente

## 📝 O que essas colunas fazem?

- **provider**: Define se a conexão usa Baileys (local, com QR code/pairing) ou Whapi.Cloud (API externa)
- **pairing_code**: Armazena o código de 8 dígitos gerado para pareamento via Redirect+
- **pairing_phone**: Armazena o número de telefone usado para gerar o código de pareamento

---

**Data**: 2026-01-02
**Arquivo de Migration**: `database/migrations/007_add_provider_pairing.sql`
