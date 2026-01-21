# 🚀 Passo a Passo: Testando Hotmart com ngrok

## ✅ PRÉ-REQUISITOS

Antes de começar, certifique-se que:
- [x] Backend está rodando na porta 3001
- [x] Frontend está rodando na porta 5173
- [x] Você consegue fazer login no CRM

---

## 📥 PASSO 1: BAIXAR E INSTALAR NGROK

### Opção A: Download Manual
1. Acesse: https://ngrok.com/download
2. Clique em "Download for Windows"
3. Extraia o arquivo `ngrok.exe` para `C:\ngrok`

### Opção B: Via Chocolatey (se tiver instalado)
```powershell
choco install ngrok
```

---

## 🔑 PASSO 2: CRIAR CONTA E CONFIGURAR TOKEN

### 2.1 Criar Conta
1. Acesse: https://dashboard.ngrok.com/signup
2. Crie uma conta gratuita (pode usar Google/GitHub)
3. Confirme seu email

### 2.2 Copiar AuthToken
1. Após login, você será redirecionado para: https://dashboard.ngrok.com/get-started/your-authtoken
2. **Copie o authtoken** (algo como: `2abc123def456ghi789jkl0`)

### 2.3 Configurar Token (APENAS UMA VEZ)
Abra PowerShell e execute:

```powershell
cd C:\ngrok
.\ngrok config add-authtoken SEU_TOKEN_AQUI
```

**Exemplo:**
```powershell
.\ngrok config add-authtoken 2abc123def456ghi789jkl0
```

✅ Você verá: `Authtoken saved to configuration file`

---

## 🌐 PASSO 3: INICIAR O TÚNEL NGROK

### 3.1 Abrir PowerShell
1. Abra um **NOVO** PowerShell
2. Navegue até a pasta do ngrok:

```powershell
cd C:\ngrok
```

### 3.2 Iniciar Túnel
Execute:

```powershell
.\ngrok http 3001
```

### 3.3 Copiar URL
Você verá uma tela assim:

```
ngrok

Session Status                online
Account                       seu@email.com
Version                       3.x.x
Region                        United States (us)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**📋 COPIE A URL HTTPS:**
- Exemplo: `https://abc123.ngrok-free.app`
- ⚠️ **IMPORTANTE:** Copie APENAS a parte HTTPS, sem o `-> http://localhost:3001`

---

## ⚙️ PASSO 4: CONFIGURAR HOTMART NO CRM

### 4.1 Acessar Configurações
1. Abra o navegador: `http://localhost:5173`
2. Faça login:
   - Email: `admin@crm.com`
   - Senha: `admin123`
3. Clique em **"Configurações"** (menu lateral)
4. Clique na aba **"Hotmart"** (ícone ⚡)

### 4.2 Configurar Webhook
Você verá a URL local do webhook. **IGNORE ela por enquanto.**

Para teste com ngrok, a URL correta é:
```
https://abc123.ngrok-free.app/api/hotmart/webhook
```
(Substitua `abc123` pela sua URL do ngrok)

### 4.3 Configurar Opções
1. **Webhook Secret:** Clique em "Gerar" (opcional, mas recomendado)
2. **Campanha Padrão:** Selecione uma campanha da lista
3. **✅ Ativar importação automática:** Marque
4. **✅ Ativar distribuição Round-Robin:** Marque (se quiser distribuir para vendedoras)
5. Clique em **"Salvar Configurações"**

---

## 🧪 PASSO 5: TESTAR WEBHOOK LOCALMENTE

### 5.1 Teste Interno
1. Na mesma tela de Hotmart, clique em **"Enviar Webhook de Teste"**
2. Aguarde a mensagem de sucesso
3. Verifique o **Log de Atividades** abaixo
4. Você deve ver uma linha com:
   - ✅ Status: `success`
   - Nome: `Teste Hotmart`
   - Email: `teste.xxxxx@hotmart.com`

### 5.2 Verificar Lead Criado
1. Vá em **"Leads"** (menu lateral)
2. Você deve ver um novo lead:
   - Nome: `Teste Hotmart`
   - Email: `teste.xxxxx@hotmart.com`
   - Produto: `Produto Teste`

✅ **Se funcionou, o webhook está OK!**

---

## 🌍 PASSO 6: TESTAR VIA NGROK (EXTERNO)

### 6.1 Testar com cURL (PowerShell)
Abra outro PowerShell e execute:

```powershell
$url = "https://abc123.ngrok-free.app/api/hotmart/webhook"
$body = @{
    event = "PURCHASE_COMPLETE"
    data = @{
        buyer = @{
            name = "João Silva"
            email = "joao@teste.com"
            phone = "11999999999"
        }
        product = @{
            name = "Curso Teste"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
```

**Substitua `abc123` pela sua URL do ngrok!**

### 6.2 Verificar Resultado
1. Volte para **Configurações > Hotmart**
2. Clique em "Atualizar" no Log de Atividades
3. Você deve ver o novo webhook com:
   - Nome: `João Silva`
   - Email: `joao@teste.com`
   - Status: `success`

4. Vá em **Leads** e veja o novo lead criado!

---

## 🎯 PASSO 7: CONFIGURAR NA HOTMART (PRODUÇÃO)

⚠️ **ATENÇÃO:** Só faça isso quando tiver certeza que está funcionando!

### 7.1 Acessar Painel Hotmart
1. Faça login em: https://app.hotmart.com
2. Vá em **Ferramentas > Postback de Vendas**

### 7.2 Configurar Postback
1. Clique em **"Adicionar URL de Postback"**
2. **URL:** Cole sua URL do ngrok + `/api/hotmart/webhook`
   - Exemplo: `https://abc123.ngrok-free.app/api/hotmart/webhook`
3. **Eventos:** Selecione:
   - ✅ Compra Aprovada
   - ✅ Compra Completa
4. Clique em **"Salvar"**

### 7.3 Testar
1. Faça uma compra de teste na Hotmart
2. Aguarde alguns segundos
3. Verifique no CRM se o lead foi criado automaticamente!

---

## 📊 PASSO 8: MONITORAR WEBHOOKS

### 8.1 Interface Web do ngrok
Acesse: `http://127.0.0.1:4040`

Aqui você pode ver:
- Todas as requisições recebidas
- Payloads completos
- Respostas enviadas
- Erros (se houver)

### 8.2 Logs do CRM
No terminal do backend, você verá:
```
📥 Hotmart webhook received: {...}
✅ Created new lead: abc-123-def
```

### 8.3 Log de Atividades
No CRM (Configurações > Hotmart), você pode ver todo o histórico de webhooks.

---

## ⚠️ PROBLEMAS COMUNS

### ❌ "Impossível conectar ao servidor remoto"
**Solução:** Verifique se o ngrok está rodando e se a URL está correta

### ❌ "Auto import disabled"
**Solução:** Vá em Configurações > Hotmart e marque "Ativar importação automática"

### ❌ "Invalid payload"
**Solução:** Verifique se o JSON está correto. Use o formato do exemplo acima.

### ❌ Lead não aparece
**Solução:** 
1. Verifique o Log de Atividades
2. Veja se há erro
3. Verifique se a campanha está selecionada

### ❌ ngrok desconecta
**Solução:** 
- Plano gratuito desconecta após 2 horas
- Basta reiniciar: `.\ngrok http 3001`
- ⚠️ A URL vai mudar! Atualize na Hotmart

---

## 💡 DICAS IMPORTANTES

### 🔄 URL do ngrok muda sempre
- Toda vez que você reiniciar o ngrok, a URL muda
- Você precisará atualizar na Hotmart
- Para URL fixa, use ngrok pago ou deploy em produção

### 🕐 Mantenha ngrok rodando
- Deixe o terminal do ngrok aberto
- Se fechar, o webhook para de funcionar

### 📱 Teste antes de produção
- Sempre teste com o botão "Enviar Webhook de Teste"
- Depois teste com cURL
- Só então configure na Hotmart

### 🔒 Webhook Secret
- Use o secret para maior segurança
- Configure o mesmo secret na Hotmart (se suportado)

---

## ✅ CHECKLIST FINAL

Antes de usar em produção, verifique:

- [ ] Backend rodando sem erros
- [ ] ngrok conectado e com URL HTTPS
- [ ] Configurações salvas no CRM
- [ ] Teste interno funcionando
- [ ] Teste via cURL funcionando
- [ ] Leads sendo criados corretamente
- [ ] Distribuição Round-Robin funcionando (se ativada)
- [ ] Log de atividades mostrando webhooks

---

## 🎉 PRONTO!

Agora você tem:
- ✅ Webhook Hotmart funcionando
- ✅ Importação automática de leads
- ✅ Distribuição para vendedoras
- ✅ Log completo de atividades
- ✅ Teste local com ngrok

**Qualquer dúvida, me avise!** 🚀
