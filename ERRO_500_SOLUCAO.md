# 🚨 ERRO 500 - Migration Necessária

## ❌ Problema
O erro acontece porque as colunas `pairing_code` e `pairing_phone` ainda não existem na tabela `whatsapp_connections`.

---

## ✅ SOLUÇÃO (3 minutos)

### Passo 1: Abra o Supabase
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto do CRM

### Passo 2: SQL Editor
1. No menu lateral, clique em **SQL Editor** (ícone de banco de dados)
2. Clique em **+ New Query**

### Passo 3: Cole e Execute
Cole este código SQL e clique em **RUN**:

```sql
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);
```

### Passo 4: Confirme
Você deve ver a mensagem: **"Success. No rows returned"**

---

## 🎉 Pronto!

Agora volte ao sistema e tente conectar novamente com o **Código de Pareamento**!

O erro 500 não vai mais aparecer e você conseguirá gerar o código de 8 dígitos.

---

## 🔍 Verificar se funcionou (Opcional)

Para confirmar que as colunas foram criadas, execute:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_connections'
ORDER BY ordinal_position;
```

Você deve ver as colunas `pairing_code` e `pairing_phone` na lista!
