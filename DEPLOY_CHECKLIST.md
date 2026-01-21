# Checklist de Deploy - Render + Vercel

## Pré-Deploy

- [x] Código testado localmente
- [x] Integração Hotmart funcionando
- [x] Telefones normalizados corretamente
- [x] Distribuição round-robin testada
- [ ] Repositório no GitHub criado
- [ ] `.env` adicionado ao `.gitignore`

---

## Deploy Backend (Render)

### 1. Preparação
- [ ] Push do código para GitHub
- [ ] Verificar que `render.yaml` existe
- [ ] Verificar que endpoint `/ping` existe

### 2. Criar Serviço no Render
- [ ] Acessar https://dashboard.render.com
- [ ] New + > Web Service
- [ ] Conectar repositório GitHub
- [ ] Configurar:
  - Name: `sales-recovery-crm-backend`
  - Region: Oregon (Free)
  - Branch: `main`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`

### 3. Variáveis de Ambiente
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `SUPABASE_URL=` (copiar do Supabase)
- [ ] `SUPABASE_ANON_KEY=` (copiar do Supabase)
- [ ] `JWT_SECRET=` (gerar chave forte)

### 4. Deploy
- [ ] Clicar em "Create Web Service"
- [ ] Aguardar build (5-10 min)
- [ ] Copiar URL: `https://_____.onrender.com`
- [ ] Testar: `curl https://_____.onrender.com/ping`

---

## Deploy Frontend (Vercel)

### 1. Preparação
- [ ] Atualizar `frontend/.env.production`:
  ```
  VITE_API_URL=https://seu-backend.onrender.com
  ```
- [ ] Push para GitHub

### 2. Criar Projeto no Vercel
- [ ] Acessar https://vercel.com/dashboard
- [ ] Add New > Project
- [ ] Importar repositório GitHub
- [ ] Configurar:
  - Framework: Vite
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`

### 3. Variáveis de Ambiente
- [ ] `VITE_API_URL=https://seu-backend.onrender.com`

### 4. Deploy
- [ ] Clicar em "Deploy"
- [ ] Aguardar build (2-3 min)
- [ ] Copiar URL: `https://_____.vercel.app`
- [ ] Testar login

---

## Configurar Keep-Alive

### Opção 1: cron-job.org (Recomendado)
- [ ] Acessar https://cron-job.org
- [ ] Criar conta
- [ ] Novo cron job:
  - URL: `https://seu-backend.onrender.com/ping`
  - Schedule: `*/10 * * * *` (a cada 10 min)
- [ ] Ativar

### Opção 2: UptimeRobot
- [ ] Acessar https://uptimerobot.com
- [ ] Criar conta
- [ ] Add Monitor:
  - Type: HTTP(s)
  - URL: `https://seu-backend.onrender.com/ping`
  - Interval: 5 minutes

---

## Configurar Webhook Hotmart

- [ ] Acessar https://app.hotmart.com
- [ ] Produtos > Seu Produto > Ferramentas > Webhooks
- [ ] Adicionar webhook:
  - URL: `https://seu-backend.onrender.com/api/hotmart/webhook`
  - Versão: 2.0
  - Eventos: PURCHASE_COMPLETE, PURCHASE_APPROVED
- [ ] Salvar
- [ ] Testar webhook no painel

---

## Atualizar CORS no Backend

- [ ] Adicionar variável de ambiente no Render:
  ```
  FRONTEND_URL=https://seu-app.vercel.app
  ```
- [ ] Atualizar `backend/src/index.js`:
  ```javascript
  const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ];
  ```
- [ ] Fazer push e aguardar redeploy automático

---

## Testes Pós-Deploy

### Backend
- [ ] `curl https://seu-backend.onrender.com/ping` → "pong"
- [ ] `curl https://seu-backend.onrender.com/api/health` → status ok

### Frontend
- [ ] Acessar `https://seu-app.vercel.app`
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Leads aparecem

### Webhook
- [ ] Enviar teste via Hotmart
- [ ] Verificar logs no Render
- [ ] Verificar lead criado no CRM
- [ ] Confirmar telefone normalizado
- [ ] Confirmar vendedora atribuída

---

## Monitoramento

### Render
- [ ] Verificar logs em tempo real
- [ ] Configurar alertas de erro
- [ ] Monitorar uso de horas (limite: 750h/mês)

### Vercel
- [ ] Verificar analytics
- [ ] Monitorar bandwidth (limite: 100GB/mês)

### Cron Job
- [ ] Verificar execuções bem-sucedidas
- [ ] Confirmar que servidor não hiberna

---

## Troubleshooting

### Backend retorna 503
- Servidor hibernou (aguardar 30-60s)
- Verificar se keep-alive está ativo

### Webhook não funciona
- Verificar URL no painel Hotmart
- Verificar logs no Render
- Testar manualmente com curl

### Frontend não conecta
- Verificar VITE_API_URL
- Verificar CORS no backend
- Verificar console do navegador

---

## ✅ Deploy Completo!

Quando todos os itens estiverem marcados:
- Backend rodando no Render
- Frontend rodando no Vercel
- Keep-alive configurado
- Webhook da Hotmart funcionando
- Leads sendo criados automaticamente

**🎉 CRM em Produção!**
