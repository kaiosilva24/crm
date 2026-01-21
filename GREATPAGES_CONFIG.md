# Configuração do Webhook GreatPages

## 📋 Mapeamento de Campos

Configure os campos do GreatPages exatamente como mostrado abaixo:

### Campos Obrigatórios

| Campo no GreatPages | Variável de Integração | Descrição |
|---------------------|------------------------|-----------|
| Digite seu nome | `NOME` | Nome do lead |
| Digite seu melhor e-mail | `EMAIL` | Email do lead |
| Digite seu (DDD) + (WhatsApp) | `TELEFONE` | Telefone/WhatsApp |

### Campos Opcionais (Informações Adicionais)

| Campo no GreatPages | Variável de Integração | Uso |
|---------------------|------------------------|-----|
| IP do usuário | `IP_do_usuario` | Rastreamento |
| Data da conversão | `Data_da_conversao` | Timestamp |
| Dispositivo | `Dispositivo` | Mobile/Desktop |
| Referral Source | `Referral_Source` | Origem do tráfego |
| URL | `URL` | Página de origem |
| Id da página | `Id_da_pagina` | ID da landing page |
| Id do formulário | `Id_do_formulario` | ID do formulário |
| País do usuário | `Pais_do_usuario` | Localização |
| Região do usuário | `Regiao_do_usuario` | Estado/Região |
| Cidade do usuário | `Cidade_do_usuario` | Cidade |

## 🔧 Configuração no GreatPages

### Passo 1: Configurar Webhook
1. Acesse o editor da sua página no GreatPages
2. Clique no formulário
3. Vá em **Integrações** → **Webhook**
4. Configure:
   - **URL**: Cole a URL do seu CRM (ex: `https://seu-ngrok.ngrok-free.app/api/webhook/greatpages`)
   - **Método**: `POST`
   - **Content-Type**: `application/json`

### Passo 2: Mapear Campos
Para cada campo do formulário, configure a **Variável de Integração**:

1. **Campo Nome**:
   - Variável: `NOME`
   
2. **Campo Email**:
   - Variável: `EMAIL`
   
3. **Campo Telefone/WhatsApp**:
   - Variável: `TELEFONE`

### Passo 3: Testar
1. Publique a página
2. Preencha o formulário com dados de teste
3. Verifique no CRM se o lead apareceu em **Leads** e nos **Logs de Atividade**

## ✅ Exemplo de Payload Recebido

```json
{
  "NOME": "João Silva",
  "EMAIL": "joao@example.com",
  "TELEFONE": "11999999999",
  "IP_do_usuario": "192.168.1.1",
  "Data_da_conversao": "2026-01-09 02:30:00",
  "Dispositivo": "Mobile",
  "URL": "https://minhapage.greatpages.io"
}
```

## 🎯 Campos Aceitos pelo CRM

O webhook aceita os seguintes formatos de campo (case-insensitive):

### Nome
- `NOME` ✅ (Recomendado)
- `nome`
- `name`
- `Nome`
- `first_name`

### Email
- `EMAIL` ✅ (Recomendado)
- `email`
- `Email`
- `e-mail`
- `E-mail`

### Telefone
- `TELEFONE` ✅ (Recomendado)
- `telefone`
- `phone`
- `Phone`
- `whatsapp`
- `WhatsApp`
- `celular`

## 🔍 Logs e Debugging

### Ver Logs no Backend
Os logs aparecem no terminal do backend:
```
📥 GreatPages Webhook received: {"NOME":"João Silva","EMAIL":"joao@example.com","TELEFONE":"11999999999"}
   📋 Dados extraídos: Nome="João Silva", Email="joao@example.com", Telefone="11999999999"
   📞 Telefone limpo: 11999999999
   🎯 Campanha identificada: Minha Campanha (1)
```

### Ver Logs no CRM
1. Acesse **Configurações** → **GreatPages**
2. Role até **Logs de Atividade**
3. Veja os últimos leads recebidos em tempo real

## ⚠️ Troubleshooting

### Lead não aparece no CRM
1. ✅ Verifique se os campos estão mapeados corretamente (NOME, EMAIL, TELEFONE)
2. ✅ Confirme que a URL do webhook está correta
3. ✅ Verifique se o método é POST
4. ✅ Veja os logs do backend para erros
5. ✅ Certifique-se que os webhooks estão habilitados em Configurações → Forms Checking

### Lead duplicado
- O CRM verifica automaticamente por email e telefone
- Se o lead já existir, retorna sucesso mas não cria duplicado

### Telefone não formatado
- O CRM remove automaticamente caracteres não numéricos
- Aceita formatos: `(11) 99999-9999`, `11999999999`, `+55 11 99999-9999`

## 🚀 Dicas

1. **Use MAIÚSCULAS** nas variáveis de integração para seguir o padrão do GreatPages
2. **Teste sempre** com dados reais antes de ir para produção
3. **Monitore os logs** para garantir que os dados estão chegando corretamente
4. **Configure uma campanha** para organizar os leads do GreatPages
