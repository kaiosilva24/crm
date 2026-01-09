# 🚀 Guia de Configuração - Sistema Dual WhatsApp

Seu sistema agora suporta **DOIS providers** de WhatsApp:
1. **Baileys** (local, grátis, mas perde contatos com LIDs)
2. **Whapi.Cloud** (API paga, **GARANTE 100% dos contatos**)

---

## ☁️ Configurar Whapi.Cloud (Recomendado)

### Passo 1: Criar conta no Whapi.Cloud

1. Acesse: https://whapi.cloud
2. Crie uma conta
3. Escolha um plano (verificar preços em https://whapi.cloud/pricing)

### Passo 2: Obter API Token

1. No painel do Whapi.Cloud, vá em **API Settings**
2. Copie seu **API Token** (formato: `Bearer xxxxx`)
3. Anote também o **Channel ID** se disponível

### Passo 3: Executar Migration SQL

Execute o SQL no Supabase:

```sql
-- Abra o arquivo e execute:
-- migrations/add_whapi_support.sql
```

Ou use o Supabase Dashboard:
1. Vá em **SQL Editor**
2. Cole o conteúdo de `migrations/add_whapi_support.sql`
3. Clique em **Run**

### Passo 4: Configurar via API

Use a rota de configuração:

```bash
POST http://localhost:3000/api/whatsapp-groups/whapi/settings
Content-Type: application/json

{
  "apiToken": "SEU_TOKEN_AQUI",
  "channelId": "SEU_CHANNEL_ID" // opcional
}
```

Ou use o Postman/Insomnia para enviar a requisição.

### Passo 5: Testar Conexão

```bash
GET http://localhost:3000/api/whatsapp-groups/whapi/test
```

Deve retornar:
```json
{
  "success": true,
  "connected": true,
  "phoneNumber": "5511999999999"
}
```

---

## 📱 Como Usar os Providers

### Criar Conexão com Whapi.Cloud

```json
POST /api/whatsapp-groups/connections
{
  "name": "Whapi - Grupo Principal",
  "provider": "whapi"  // ← IMPORTANTE!
}
```

### Criar Conexão com Baileys (tradicional)

```json
POST /api/whatsapp-groups/connections
{
  "name": "Baileys - Teste",
  "provider": "baileys"  // ou omitir (default)
}
```

---

## 🔄 Sincronizar Grupos

### Via Whapi.Cloud (método direto)

```bash
GET /api/whatsapp-groups/whapi/groups
# Retorna todos os grupos
```

```bash
POST /api/whatsapp-groups/whapi/groups/{groupId}/sync
{
  "connectionId": "uuid-da-conexao"
}
```

### Via Sincronização de Campanha (automático)

A rota **detecta automaticamente** qual provider usar:

```bash
POST /api/whatsapp-groups/campaigns/:campaignId/sync-participants
{
  "groupIds": ["grupo-1-uuid", "grupo-2-uuid"]
}
```

O sistema verá qual conexão está associada a cada grupo e usará:
- **Whapi.Cloud** se `provider = 'whapi'` → **100% dos contatos**
- **Baileys** se `provider = 'baileys'` → melhor esforço com validações

---

## ✅ Vantagens de Cada Provider

### Whapi.Cloud ☁️
- ✅ **100% dos contatos** (zero perdas!)
- ✅ Sem Privacy IDs (LIDs)
- ✅ API REST estável
- ✅ Retry automático
- ✅ Paginação automática
- ❌ Serviço pago

### Baileys 🔌
- ✅ Grátis
- ✅ Local (sem dependências)
- ✅ Código aberto
- ❌ Perde contatos com LIDs
- ❌ Conexão instável
- ❌ Problemas de QR code

---

## 🧪 Testando

### Script de Teste (criar este arquivo):

```javascript
// backend/src/tests/test_whapi.js
import { whapiService } from '../services/whapiService.js';

async function test() {
    console.log('🧪 Testando Whapi.Cloud...\n');

    // 1. Testar conexão
    console.log('1. Testando conexão...');
    const status = await whapiService.testConnection();
    console.log(status);

    // 2. Listar grupos
    console.log('\n2. Listando grupos...');
    const groups = await whapiService.listAllGroups();
    console.log(`✅ ${groups.length} grupos encontrados`);

    if (groups.length > 0) {
        console.log('\nPrimeiro grupo:', groups[0]);

        // 3. Buscar participantes
        console.log('\n3. Buscando participantes do primeiro grupo...');
        const participants = await whapiService.getGroupParticipants(groups[0].id);
        console.log(`✅ ${participants.length} participantes encontrados`);
        console.log('Exemplo de participante:', participants[0]);
    }
}

test().catch(console.error);
```

Execute:
```bash
node src/tests/test_whapi.js
```

---

## 🎯 Recomendação

**Use Whapi.Cloud para grupos importantes** onde você NÃO PODE perder nenhum contato.

**Use Baileys para testes** ou grupos menos críticos.

Você pode misturar os dois no mesmo sistema! 🚀
