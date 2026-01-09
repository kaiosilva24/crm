# Sistema de Keep-Alive para Render

## Problema
O Render Free Tier hiberna após 15 minutos de inatividade, causando cold starts de 30-60 segundos.

## Solução
Usar um serviço de cron job gratuito para fazer ping no backend a cada 10 minutos.

---

## Passo 1: Endpoints de Health Check

✅ **Já configurado no backend:**

- `GET /health` - Retorna status do servidor
- `GET /ping` - Retorna "pong"

---

## Passo 2: Configurar Cron Job Gratuito

### Opção 1: cron-job.org (Recomendado)

1. **Acessar:** https://cron-job.org/en/
2. **Criar conta gratuita**
3. **Criar novo cron job:**
   - **Title:** Keep Render Alive
   - **URL:** `https://seu-backend.onrender.com/ping`
   - **Schedule:** Every 10 minutes
   - **Execution:** `*/10 * * * *`
   - **Notifications:** Disabled

4. **Salvar e ativar**

### Opção 2: UptimeRobot

1. **Acessar:** https://uptimerobot.com
2. **Criar conta gratuita**
3. **Add New Monitor:**
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Render Backend
   - **URL:** `https://seu-backend.onrender.com/ping`
   - **Monitoring Interval:** 5 minutes

4. **Create Monitor**

### Opção 3: Render Cron Job (Alternativa)

Criar um segundo serviço no Render como Cron Job:

```yaml
# render.yaml
services:
  - type: web
    name: sales-recovery-crm-backend
    # ... configuração existente

  - type: cron
    name: keep-alive-ping
    env: node
    schedule: "*/10 * * * *"
    buildCommand: echo "Ping job"
    startCommand: curl https://sales-recovery-crm-backend.onrender.com/ping
```

---

## Passo 3: Verificar Funcionamento

### Testar Health Check

```bash
curl https://seu-backend.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T12:00:00.000Z",
  "uptime": 3600
}
```

### Monitorar Logs no Render

1. Acessar Dashboard do Render
2. Selecionar o serviço backend
3. Ir em "Logs"
4. Verificar requisições GET /ping a cada 10 minutos

---

## Benefícios

✅ **Servidor sempre acordado** (99% uptime)
✅ **Webhooks instantâneos** (sem cold start)
✅ **Melhor experiência** para usuários
✅ **Grátis** (dentro do limite de 750h/mês do Render)

---

## Consumo de Horas

- **Sem ping:** ~200-300 horas/mês (hiberna muito)
- **Com ping:** ~720 horas/mês (sempre acordado)
- **Limite Render Free:** 750 horas/mês

**Margem de segurança:** 30 horas/mês

---

## Troubleshooting

### Servidor ainda hiberna

- Verificar se o cron job está ativo
- Verificar URL do ping (deve ser HTTPS)
- Verificar logs do cron job

### Excedeu limite de horas

- Reduzir frequência do ping para 14 minutos
- Aceitar hibernação em horários de baixo uso
- Upgrade para plano pago ($7/mês)

---

## Configuração Recomendada

**Para produção:**
- Usar **cron-job.org** (mais confiável)
- Ping a cada **10 minutos**
- Monitorar com **UptimeRobot** (backup)
- Configurar alertas por email

**Para desenvolvimento:**
- Aceitar hibernação
- Usar ngrok para testes locais
