# ✅ Checklist de Testes - Integração Hotmart

## 📋 ANTES DE COMEÇAR

### Pré-requisitos
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 5173
- [ ] ngrok rodando e conectado
- [ ] Você consegue fazer login no CRM

---

## 🧪 TESTE 1: CONFIGURAÇÃO BÁSICA

### 1.1 Verificar Configurações no CRM
- [ ] Acesse: `http://localhost:5173`
- [ ] Login: `admin@crm.com` / `admin123`
- [ ] Vá em **Configurações > Hotmart**
- [ ] Verifique se aparece a aba Hotmart (⚡)
- [ ] Verifique se mostra a URL do webhook

### 1.2 Configurar Hotmart
- [ ] Selecione uma **Campanha Padrão** (obrigatório!)
- [ ] ✅ Marque **"Ativar importação automática"**
- [ ] ✅ Marque **"Ativar distribuição Round-Robin"** (se quiser distribuir)
- [ ] Clique em **"Salvar Configurações"**
- [ ] Aguarde mensagem de sucesso

**✅ PASSOU?** Se sim, continue. Se não, me avise!

---

## 🧪 TESTE 2: WEBHOOK INTERNO (CRM)

### 2.1 Teste Interno
- [ ] Na mesma tela (Configurações > Hotmart)
- [ ] Clique em **"Enviar Webhook de Teste"**
- [ ] Aguarde 2-3 segundos

### 2.2 Verificar Log de Atividades
- [ ] Role a página para baixo até "Log de Atividades"
- [ ] Deve aparecer uma linha com:
  - ✅ Status: `success` (verde)
  - Nome: `Teste Hotmart`
  - Email: `teste.xxxxx@hotmart.com`
  - Produto: `Produto Teste`

### 2.3 Verificar Lead Criado
- [ ] Vá em **Leads** (menu lateral)
- [ ] Procure por "Teste Hotmart"
- [ ] Verifique:
  - ✅ Nome: `Teste Hotmart`
  - ✅ Email: `teste.xxxxx@hotmart.com`
  - ✅ Telefone: `5511999999999` (13 dígitos)
  - ✅ Produto: `Produto Teste`
  - ✅ Campanha: A que você selecionou
  - ✅ Vendedora: Se distribuição ativa, deve ter uma vendedora

**✅ PASSOU?** Se sim, continue. Se não, PARE e me avise!

---

## 🧪 TESTE 3: WEBHOOK EXTERNO (NGROK)

### 3.1 Preparar Teste
Abra PowerShell e execute:

```powershell
$body = @{
    event = "PURCHASE_COMPLETE"
    data = @{
        buyer = @{
            name = "Cliente Teste ngrok"
            email = "cliente.ngrok@teste.com"
            phone = "21987654321"
        }
        product = @{
            name = "Produto Teste ngrok"
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"
```

**⚠️ IMPORTANTE:** Substitua `SUA_URL_NGROK` pela sua URL real!

### 3.2 Verificar Resposta
- [ ] Deve retornar:
  ```json
  {
    "message": "Webhook processed successfully",
    "lead_uuid": "abc-123-def...",
    "status": "success"
  }
  ```

### 3.3 Verificar no CRM
- [ ] Vá em **Configurações > Hotmart**
- [ ] Clique em "Atualizar" no Log de Atividades
- [ ] Deve aparecer:
  - ✅ Nome: `Cliente Teste ngrok`
  - ✅ Email: `cliente.ngrok@teste.com`
  - ✅ Status: `success`

### 3.4 Verificar Lead
- [ ] Vá em **Leads**
- [ ] Procure por "Cliente Teste ngrok"
- [ ] Verifique:
  - ✅ Telefone: `5521987654321` (13 dígitos - com DDI 55!)

**✅ PASSOU?** Se sim, continue. Se não, PARE e me avise!

---

## 🧪 TESTE 4: DISTRIBUIÇÃO ROUND-ROBIN

### 4.1 Verificar Vendedoras Ativas
- [ ] Vá em **Vendedoras** (menu lateral)
- [ ] Verifique quantas vendedoras estão:
  - ✅ Ativas (is_active = true)
  - ✅ Na distribuição (is_in_distribution = true)
- [ ] Anote os nomes: ___________________

### 4.2 Enviar Múltiplos Webhooks
Execute 3 vezes (uma de cada vez):

```powershell
# Webhook 1
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Lead 1";email="lead1@teste.com";phone="11911111111"};product=@{name="Produto 1"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"

# Webhook 2
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Lead 2";email="lead2@teste.com";phone="11922222222"};product=@{name="Produto 2"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"

# Webhook 3
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Lead 3";email="lead3@teste.com";phone="11933333333"};product=@{name="Produto 3"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"
```

### 4.3 Verificar Distribuição
- [ ] Vá em **Leads**
- [ ] Procure por "Lead 1", "Lead 2", "Lead 3"
- [ ] Verifique se foram distribuídos para vendedoras DIFERENTES
- [ ] A ordem deve seguir a configuração em **Configurações > Ordem**

**Exemplo esperado:**
- Lead 1 → Vendedora A
- Lead 2 → Vendedora B  
- Lead 3 → Vendedora C (ou volta para A se só tiver 2)

**✅ PASSOU?** Se sim, continue. Se não, me avise!

---

## 🧪 TESTE 5: NORMALIZAÇÃO DE TELEFONE

### 5.1 Testar Diferentes Formatos
Execute cada um e verifique o telefone no CRM:

```powershell
# Teste 1: Celular sem DDI (11 dígitos)
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Teste Tel 1";email="tel1@teste.com";phone="11987654321"};product=@{name="Produto"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"
# Esperado: 5511987654321 (13 dígitos)

# Teste 2: Celular com DDI (13 dígitos)
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Teste Tel 2";email="tel2@teste.com";phone="5521987654321"};product=@{name="Produto"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"
# Esperado: 5521987654321 (13 dígitos - mantém)

# Teste 3: Fixo sem DDI (10 dígitos)
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Teste Tel 3";email="tel3@teste.com";phone="1133334444"};product=@{name="Produto"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"
# Esperado: 551133334444 (12 dígitos)
```

### 5.2 Verificar no CRM
- [ ] Vá em **Leads**
- [ ] Procure por "Teste Tel 1", "Teste Tel 2", "Teste Tel 3"
- [ ] Verifique os telefones:
  - ✅ Teste Tel 1: `5511987654321` (13 dígitos)
  - ✅ Teste Tel 2: `5521987654321` (13 dígitos)
  - ✅ Teste Tel 3: `551133334444` (12 dígitos)

**✅ PASSOU?** Se sim, continue!

---

## 🧪 TESTE 6: DUPLICATAS

### 6.1 Enviar Webhook Duplicado
```powershell
# Primeiro webhook
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Cliente Duplicado";email="duplicado@teste.com";phone="11944444444"};product=@{name="Produto A"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"

# Aguarde 5 segundos

# Segundo webhook (MESMO EMAIL)
$body = @{event="PURCHASE_COMPLETE";data=@{buyer=@{name="Cliente Duplicado ATUALIZADO";email="duplicado@teste.com";phone="11955555555"};product=@{name="Produto B"}}} | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook" -Method Post -Body $body -ContentType "application/json"
```

### 6.2 Verificar Comportamento
- [ ] Vá em **Leads**
- [ ] Procure por "duplicado@teste.com"
- [ ] Deve ter APENAS 1 lead (não duplicou!)
- [ ] Verifique se foi ATUALIZADO:
  - ✅ Nome: `Cliente Duplicado ATUALIZADO`
  - ✅ Telefone: `5511955555555`
  - ✅ Produto: `Produto B`

### 6.3 Verificar Log
- [ ] Vá em **Configurações > Hotmart**
- [ ] No Log de Atividades, procure os 2 webhooks
- [ ] O primeiro deve ter status: `success`
- [ ] O segundo deve ter status: `duplicate` (laranja)

**✅ PASSOU?** Perfeito!

---

## 🧪 TESTE 7: MONITORAMENTO NGROK

### 7.1 Interface Web do ngrok
- [ ] Acesse: `http://127.0.0.1:4040`
- [ ] Veja todas as requisições recebidas
- [ ] Clique em uma requisição
- [ ] Verifique:
  - ✅ Status: 200 OK
  - ✅ Request Body: JSON com dados da compra
  - ✅ Response: `{"message":"Webhook processed successfully",...}`

**✅ PASSOU?** Ótimo!

---

## 📊 RESUMO FINAL

### Checklist Geral
- [ ] ✅ Webhook interno funciona
- [ ] ✅ Webhook externo (ngrok) funciona
- [ ] ✅ Leads sendo criados automaticamente
- [ ] ✅ Telefones normalizados (13 dígitos)
- [ ] ✅ Distribuição Round-Robin funcionando
- [ ] ✅ Duplicatas sendo detectadas e atualizadas
- [ ] ✅ Log de atividades registrando tudo
- [ ] ✅ ngrok mostrando requisições

### Informações para Produção
- **URL do Webhook:** `https://SUA_URL_NGROK.ngrok-free.app/api/hotmart/webhook`
- **Campanha Padrão:** ___________________
- **Distribuição Ativa:** [ ] Sim [ ] Não
- **Vendedoras na Distribuição:** ___________________

---

## 🚀 PRÓXIMOS PASSOS

### Quando tudo estiver OK:
1. [ ] Configure a URL no painel da Hotmart
2. [ ] Selecione eventos: "Compra Aprovada" e "Compra Completa"
3. [ ] Faça uma compra de teste real na Hotmart
4. [ ] Verifique se o lead aparece no CRM
5. [ ] Monitore os primeiros dias

### Se algo falhar:
- ❌ Anote qual teste falhou
- ❌ Tire screenshot do erro
- ❌ Me avise com detalhes

---

## 📝 OBSERVAÇÕES

**Lembre-se:**
- ⚠️ ngrok muda a URL toda vez que reinicia
- ⚠️ Mantenha o ngrok rodando enquanto estiver testando
- ⚠️ Atualize a URL na Hotmart se reiniciar o ngrok
- ⚠️ Verifique se "Ativar importação automática" está marcado

**Dúvidas?**
- Me avise em qual teste você está
- Envie screenshot se houver erro
- Teste um de cada vez, não pule etapas!

---

✅ **BOA SORTE NOS TESTES!** 🎉
