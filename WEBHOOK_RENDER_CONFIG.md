# Configuração do Webhook no Render

## Após o Deploy

### 1. Obter URL do Backend

Após o deploy no Render, você receberá uma URL como:
```
https://sales-recovery-crm-backend.onrender.com
```

### 2. Configurar Webhook da Hotmart

1. **Acessar Hotmart:**
   - https://app.hotmart.com
   - Login com sua conta

2. **Ir em Ferramentas > Webhooks:**
   - Produtos > Seu Produto > Ferramentas > Webhooks

3. **Adicionar Novo Webhook:**
   ```
   URL: https://sales-recovery-crm-backend.onrender.com/api/hotmart/webhook
   Versão: 2.0
   Eventos: PURCHASE_COMPLETE, PURCHASE_APPROVED
   ```

4. **Salvar e Testar:**
   - Usar o botão "Testar Webhook" no painel
   - Verificar se retorna status 200

### 3. Testar Manualmente

```bash
curl -X POST https://sales-recovery-crm-backend.onrender.com/api/hotmart/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PURCHASE_COMPLETE",
    "data": {
      "buyer": {
        "name": "Teste Producao",
        "email": "teste@producao.com",
        "checkout_phone": "11999999999"
      },
      "product": {
        "name": "Produto Teste"
      }
    }
  }'
```

**Resposta esperada:**
```json
{
  "message": "Webhook processed successfully",
  "lead_uuid": "uuid-do-lead",
  "status": "success"
}
```

### 4. Verificar no CRM

1. Acessar `https://seu-app.vercel.app`
2. Login: `admin@crm.com` / `admin123`
3. Ir em **Leads**
4. Verificar se o lead "Teste Producao" foi criado
5. Confirmar que tem telefone e vendedora atribuída

### 5. Monitorar Logs

**No Render:**
- Dashboard > Seu Serviço > Logs
- Filtrar por "Hotmart webhook"
- Verificar requisições em tempo real

**No CRM:**
- Configurações > Hotmart
- Ver "Atividade de Webhooks"
- Verificar status (success/error/duplicate)

---

## Variáveis de Ambiente no Render

Certifique-se de configurar:

```
NODE_ENV=production
PORT=3001
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_do_supabase
JWT_SECRET=sua_chave_secreta_forte
FRONTEND_URL=https://seu-app.vercel.app
```

---

## Troubleshooting

### Webhook retorna 503

- Servidor hibernou (cold start)
- Aguardar 30-60s e tentar novamente
- Configurar keep-alive (ver KEEP_ALIVE_RENDER.md)

### Webhook retorna 500

- Verificar logs no Render
- Verificar se variáveis de ambiente estão configuradas
- Verificar se Supabase está acessível

### Lead não aparece no CRM

- Verificar se webhook retornou sucesso
- Verificar logs de webhook no CRM
- Verificar se distribuição está ativada
- Verificar se campanha padrão está configurada

---

## Checklist Pós-Deploy

- [ ] Backend deployado no Render
- [ ] Frontend deployado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado com URL do Vercel
- [ ] Webhook da Hotmart configurado
- [ ] Keep-alive configurado (cron-job.org)
- [ ] Teste de webhook realizado
- [ ] Lead de teste criado com sucesso
- [ ] Telefone normalizado corretamente
- [ ] Distribuição round-robin funcionando
