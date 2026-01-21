# 🔍 Guia de Teste - Grupos WhatsApp

## ✅ Melhorias Implementadas

1. **Polling Automático**: A página agora atualiza as conexões automaticamente a cada 3 segundos
2. **Feedback Visual**: Mensagens claras quando não há grupos ou conexões
3. **Melhor UX**: Status das conexões atualiza em tempo real

---

## 🧪 Como Testar

### 1️⃣ Verificar se a Página Carrega

1. Acesse: http://localhost:5173
2. Faça login como **Admin**
3. Clique em **"Grupos"** no menu lateral
4. Você deve ver duas abas:
   - ✅ Conectar Dispositivo
   - ✅ Selecionar Grupos

### 2️⃣ Conectar WhatsApp

**Na aba "Conectar Dispositivo":**

1. Clique em **"Nova Conexão"**
2. Digite um nome (ex: "Meu WhatsApp")
3. Clique em **"Criar"**
4. Clique em **"Conectar"** na conexão criada
5. **Aguarde** o QR Code aparecer (pode levar alguns segundos)
6. **Escaneie** o QR Code no WhatsApp:
   - WhatsApp → ⋮ (três pontos) → Aparelhos conectados → Conectar aparelho
7. **Aguarde** a conexão ser estabelecida
8. O status deve mudar para **"🟢 Conectado"**
9. Os grupos devem aparecer automaticamente

### 3️⃣ Verificar Grupos

**Ainda na aba "Conectar Dispositivo":**

1. Após conectar, clique em **"Ver Grupos"**
2. Você deve ver a lista de grupos do WhatsApp
3. Se não aparecer, clique em **"Sincronizar"**

### 4️⃣ Associar Grupos a Campanhas

**Na aba "Selecionar Grupos":**

1. Selecione uma **campanha** no dropdown
2. Selecione a **conexão WhatsApp** conectada
3. Os grupos devem aparecer automaticamente
4. **Clique** nos grupos que deseja associar
5. Clique em **"Associar X Grupo(s) à Campanha"**
6. Deve aparecer mensagem de sucesso!

---

## 🐛 Problemas Comuns e Soluções

### Problema: "Fica conectando" infinitamente

**Causas possíveis:**
- O QR Code não foi escaneado
- O WhatsApp não conseguiu conectar
- Erro no Baileys

**Solução:**
1. Verifique os logs do backend no terminal
2. Procure por mensagens como:
   - `✅ Conectado ao WhatsApp!`
   - `🔄 Sincronizando grupos...`
   - `📊 X grupos encontrados`
3. Se não aparecer, tente:
   - Deletar a conexão
   - Criar uma nova
   - Tentar novamente

### Problema: Grupos não aparecem

**Causas possíveis:**
- WhatsApp não tem grupos
- Erro na sincronização
- Problema no banco de dados

**Solução:**
1. Verifique se o WhatsApp tem grupos
2. Clique em **"Sincronizar"** manualmente
3. Verifique os logs do backend
4. Verifique no Supabase se a tabela `whatsapp_groups` tem dados:
   - Supabase → Table Editor → whatsapp_groups

### Problema: Aba "Selecionar Grupos" vazia

**Causas possíveis:**
- Nenhuma conexão ativa
- Nenhum grupo sincronizado

**Solução:**
1. Vá para aba "Conectar Dispositivo"
2. Conecte um WhatsApp
3. Aguarde os grupos sincronizarem
4. Volte para "Selecionar Grupos"
5. Selecione a conexão no dropdown

---

## 📊 Verificar no Banco de Dados

### Supabase - Table Editor

1. **whatsapp_connections**
   - Deve ter a conexão criada
   - Status deve ser "connected"
   - phone_number deve estar preenchido

2. **whatsapp_groups**
   - Deve ter os grupos do WhatsApp
   - connection_id deve corresponder à conexão
   - group_name e participant_count devem estar corretos

3. **campaign_groups**
   - Após associar, deve ter os registros
   - campaign_id e whatsapp_group_id devem estar corretos

---

## 🔍 Logs do Backend

Verifique o terminal do backend para ver:

```
🔄 Iniciando conexão WhatsApp: [ID]
📱 QR Code gerado
✅ Conectado ao WhatsApp!
🔄 Sincronizando grupos...
📊 5 grupos encontrados
✅ Grupos sincronizados!
```

---

## ✅ Checklist de Funcionamento

- [ ] Página carrega sem erros
- [ ] Consigo criar nova conexão
- [ ] QR Code aparece
- [ ] Consigo escanear QR Code
- [ ] Status muda para "Conectado"
- [ ] Grupos aparecem automaticamente
- [ ] Consigo ver lista de grupos
- [ ] Consigo sincronizar grupos manualmente
- [ ] Aba "Selecionar Grupos" mostra conexões
- [ ] Consigo selecionar grupos
- [ ] Consigo associar grupos a campanhas
- [ ] Mensagem de sucesso aparece

---

## 🆘 Se Nada Funcionar

1. **Reinicie o backend:**
   - Pare o servidor (Ctrl+C)
   - Execute: `npm run dev` na pasta `backend`

2. **Limpe o cache do navegador:**
   - Pressione Ctrl+Shift+Delete
   - Limpe cache e cookies
   - Ou use Ctrl+F5 para hard reload

3. **Verifique as tabelas no Supabase:**
   - Confirme que as 3 tabelas foram criadas
   - Verifique se as políticas RLS estão ativas

4. **Verifique os logs:**
   - Console do navegador (F12)
   - Terminal do backend
   - Procure por erros em vermelho

---

**Se tudo estiver funcionando, você verá os grupos do WhatsApp e poderá associá-los às campanhas! 🎉**
