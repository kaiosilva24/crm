# 📋 Funcionalidade: Visualização e Exportação de Participantes

## ✨ O que foi implementado:

### 🎯 Nova Funcionalidade na Aba "Campanhas Sincronizadas"

Adicionada a capacidade de:
1. **Ver lista completa de participantes** de cada campanha
2. **Exportar participantes em CSV** para uso externo

---

## 🔄 Como Funciona:

### 1. **Ver Participantes**
   - Clique no botão "Ver Participantes" em qualquer campanha
   - Uma tabela expandível aparece mostrando:
     - Nome do participante
     - Telefone
     - Email
     - Data de importação
   - Scroll automático para listas grandes (máx 400px)

### 2. **Exportar CSV**
   - Após carregar os participantes, clique em "Exportar CSV"
   - Arquivo CSV é baixado automaticamente com:
     - Nome: `participantes_[CAMPANHA]_[DATA].csv`
     - Colunas: Nome, Telefone, Email, Grupo, Data Importação
   - Formato compatível com Excel e Google Sheets

---

## 📊 Interface:

### Botões Adicionados:
1. **👥 Ver Participantes** (Azul)
   - Carrega e exibe lista de participantes
   - Mostra contagem total

2. **📥 Exportar CSV** (Verde)
   - Exporta participantes carregados
   - Requer clicar em "Ver Participantes" primeiro

### Tabela de Participantes:
```
┌─────────────┬────────────┬─────────────┬──────────────┐
│ Nome        │ Telefone   │ Email       │ Data         │
├─────────────┼────────────┼─────────────┼──────────────┤
│ João Silva  │ 11999...   │ joao@...    │ 29/12/2025   │
│ Maria Santos│ 11988...   │ maria@...   │ 29/12/2025   │
└─────────────┴────────────┴─────────────┴──────────────┘
```

- **Scroll**: Automático para listas grandes
- **Botão Ocultar**: Fecha a lista
- **Estilo**: Integrado com tema do sistema

---

## 🔧 Implementação Técnica:

### Frontend (`Groups.jsx`):

#### Estados Adicionados:
```javascript
const [selectedCampaignId, setSelectedCampaignId] = useState(null);
const [participants, setParticipants] = useState([]);
```

#### Funções Criadas:

**1. loadParticipants(campaignId)**
- Busca participantes da campanha via API
- Armazena em `participants`
- Define `selectedCampaignId`

**2. exportParticipantsCSV(campaignId, campaignName)**
- Cria arquivo CSV com headers
- Formata dados dos participantes
- Faz download automático
- Mostra mensagem de sucesso

### Backend (`whatsappGroups.js`):

#### Nova Rota:
```javascript
GET /api/whatsapp-groups/campaigns/:campaignId/participants
```

**Retorna:**
```json
[
  {
    "id": 123,
    "first_name": "João Silva",
    "phone": "11999999999",
    "email": "joao@email.com",
    "in_group": true,
    "created_at": "2025-12-29T18:00:00Z"
  }
]
```

---

## 📁 Formato do CSV:

### Exemplo:
```csv
"Nome","Telefone","Email","Grupo","Data Importação"
"João Silva","11999999999","joao@email.com","Sim","29/12/2025"
"Maria Santos","11988888888","maria@email.com","Sim","29/12/2025"
"55119777777","55119777777","","Sim","29/12/2025"
```

### Campos:
- **Nome**: `first_name` ou telefone se vazio
- **Telefone**: Número completo
- **Email**: Email ou "-" se vazio
- **Grupo**: "Sim" ou "Não" baseado em `in_group`
- **Data Importação**: Formatada em pt-BR

---

## 🎨 Fluxo de Uso:

```
1. Ir para "Campanhas Sincronizadas"
        ↓
2. Escolher uma campanha
        ↓
3. Clicar "Ver Participantes"
        ↓
4. Visualizar lista completa
        ↓
5. Clicar "Exportar CSV"
        ↓
6. Arquivo baixado automaticamente
```

---

## ⚡ Recursos:

### ✅ Implementado:
- [x] Botão "Ver Participantes"
- [x] Tabela com scroll
- [x] Botão "Exportar CSV"
- [x] Download automático
- [x] Formatação pt-BR
- [x] Mensagens de feedback
- [x] Botão "Ocultar"
- [x] Contagem de participantes
- [x] Integração com tema

### 🎯 Características:
- **Performance**: Scroll para listas grandes
- **UX**: Feedback claro em cada ação
- **Compatibilidade**: CSV funciona em Excel/Sheets
- **Responsivo**: Adapta a diferentes tamanhos
- **Acessível**: Cores e contrastes adequados

---

## 📝 Exemplo de Uso:

### Cenário:
Você sincronizou 3 grupos WhatsApp com 150 participantes para a campanha "Black Friday 2025"

### Passos:
1. Vá para aba "Campanhas Sincronizadas"
2. Veja o card "Black Friday 2025" mostrando "3 grupos • 150 participantes"
3. Clique "Ver Participantes"
4. Visualize a tabela com os 150 contatos
5. Clique "Exportar CSV"
6. Arquivo `participantes_Black_Friday_2025_2025-12-29.csv` é baixado
7. Abra no Excel para análise ou envio

---

## 🔒 Segurança:

- ✅ Requer autenticação JWT
- ✅ Filtra por campanha do usuário
- ✅ Não expõe dados sensíveis desnecessários
- ✅ Validação de IDs

---

## 📊 Dados Exportados:

### O que é incluído:
- Nome completo ou telefone
- Número de telefone
- Email (se disponível)
- Status de grupo
- Data de importação

### O que NÃO é incluído:
- Senhas ou tokens
- Dados de outras campanhas
- Informações de vendedoras
- Histórico de ações

---

## ✅ Checklist de Teste:

- [ ] Ver participantes de uma campanha
- [ ] Verificar se tabela mostra dados corretos
- [ ] Testar scroll em lista grande
- [ ] Clicar em "Ocultar"
- [ ] Exportar CSV
- [ ] Abrir CSV no Excel
- [ ] Verificar formatação pt-BR
- [ ] Testar com campanha sem participantes
- [ ] Testar com múltiplas campanhas

---

**Funcionalidade completa e pronta para uso!** 🎉

Agora você pode visualizar e exportar todos os participantes importados dos grupos WhatsApp!
