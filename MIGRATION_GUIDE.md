# Guia Completo de Migração: Supabase → Render PostgreSQL

Este guia irá te orientar passo a passo na migração do banco de dados do seu CRM do Supabase para o Render PostgreSQL.

## 📋 Pré-requisitos

- [ ] Acesso ao painel do Render (https://render.com)
- [ ] Acesso ao painel do Supabase
- [ ] Node.js instalado localmente
- [ ] Git configurado

## 🎯 Passo 1: Criar PostgreSQL Database no Render

1. **Acesse o Render Dashboard**
   - Vá para https://dashboard.render.com
   - Faça login na sua conta

2. **Criar Novo PostgreSQL Database**
   - Clique em **"New +"** no topo
   - Selecione **"PostgreSQL"**
   - Configure:
     - **Name**: `crm-database` (ou nome de sua preferência)
     - **Database**: `crm` (nome do banco)
     - **User**: `crm_user` (será criado automaticamente)
     - **Region**: Escolha a mesma região do seu backend (ex: Ohio)
     - **PostgreSQL Version**: 15 ou superior
     - **Plan**: **Free** (1 GB storage, sem limite de Egress!)
   - Clique em **"Create Database"**

3. **Aguardar Criação**
   - O Render levará 1-2 minutos para provisionar o banco
   - Aguarde até o status ficar **"Available"**

4. **Copiar Credenciais**
   - Na página do database, você verá:
     - **Internal Database URL**: Use esta para conexão do backend
     - **External Database URL**: Use esta para ferramentas externas
   - Copie a **Internal Database URL** (formato: `postgresql://user:password@host:port/database`)
   - **IMPORTANTE**: Guarde esta URL em local seguro!

## 🔄 Passo 2: Exportar Dados do Supabase

1. **Executar Script de Exportação**
   ```bash
   cd C:\Users\kaiob\Downloads\CRM-main\CRM-main
   node database/export-supabase.js
   ```

2. **Verificar Backup**
   - Um arquivo `database/supabase-backup.sql` será criado
   - Verifique o tamanho do arquivo (deve ter vários KB/MB dependendo dos dados)
   - Abra o arquivo e confirme que contém:
     - Comandos `CREATE TABLE`
     - Comandos `INSERT INTO`

3. **Backup Manual (Opcional mas Recomendado)**
   - Acesse o Supabase Dashboard
   - Vá em **Database** → **Backups**
   - Clique em **"Create Backup"**
   - Aguarde conclusão e faça download

## 📥 Passo 3: Importar Dados no Render PostgreSQL

1. **Configurar Variável de Ambiente Temporária**
   
   Crie um arquivo `database/.env.migration` com:
   ```env
   # Supabase (origem)
   SUPABASE_URL=sua_url_atual_do_supabase
   SUPABASE_ANON_KEY=sua_anon_key_atual
   
   # Render PostgreSQL (destino)
   DATABASE_URL=postgresql://user:password@host:port/database
   ```
   
   **IMPORTANTE**: Substitua `DATABASE_URL` pela URL copiada no Passo 1!

2. **Executar Script de Importação**
   ```bash
   node database/import-to-render.js
   ```

3. **Verificar Logs**
   - O script mostrará o progresso:
     - ✅ Conexão estabelecida
     - ✅ Migrations executadas
     - ✅ Dados importados
     - ✅ Validação de integridade
   - Ao final, você verá um relatório com contagem de registros

4. **Validar no Render Dashboard**
   - Volte ao Render Dashboard → PostgreSQL
   - Clique na aba **"Shell"**
   - Execute:
     ```sql
     \dt
     SELECT COUNT(*) FROM leads;
     SELECT COUNT(*) FROM campaigns;
     SELECT COUNT(*) FROM sellers;
     ```
   - Confirme que as tabelas existem e têm dados

## ⚙️ Passo 4: Atualizar Backend Local

1. **Atualizar arquivo `.env` do backend**
   
   Edite `backend/.env`:
   ```env
   # REMOVA estas linhas:
   # SUPABASE_URL=...
   # SUPABASE_ANON_KEY=...
   
   # ADICIONE esta linha:
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # Mantenha:
   JWT_SECRET=sua_chave_secreta_jwt
   PORT=3001
   ```

2. **Instalar Nova Dependência**
   ```bash
   cd backend
   npm install pg
   ```

3. **Testar Conexão Local**
   ```bash
   node database/test-connection.js
   ```
   
   Você deve ver:
   ```
   ✅ Conexão com Render PostgreSQL estabelecida!
   ✅ Todas as tabelas encontradas
   ✅ Dados validados
   ```

4. **Reiniciar Backend Local**
   - Pare o servidor atual (Ctrl+C no terminal)
   - Inicie novamente:
     ```bash
     npm run dev
     ```
   - Verifique se não há erros de conexão

## 🌐 Passo 5: Atualizar Backend em Produção (Render)

1. **Acessar Configuração do Backend no Render**
   - Vá para Render Dashboard
   - Clique no seu serviço de backend (`crm-api` ou similar)
   - Vá na aba **"Environment"**

2. **Atualizar Variáveis de Ambiente**
   - **REMOVA**:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
   - **ADICIONE**:
     - Key: `DATABASE_URL`
     - Value: (cole a Internal Database URL do Passo 1)
   - **MANTENHA**:
     - `JWT_SECRET`
     - Outras variáveis existentes

3. **Salvar e Aguardar Deploy**
   - Clique em **"Save Changes"**
   - O Render fará redeploy automático (2-3 minutos)
   - Aguarde até o status ficar **"Live"**

## ✅ Passo 6: Validação Final

### Teste Local

1. **Abrir aplicação local**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

2. **Testar funcionalidades**:
   - [ ] Login funciona
   - [ ] Leads são listados corretamente
   - [ ] Campanhas são listadas
   - [ ] Filtros funcionam
   - [ ] Criar novo lead funciona
   - [ ] Editar lead funciona

### Teste em Produção

1. **Acessar aplicação em produção**
   - URL do seu frontend no Render

2. **Testar funcionalidades principais**:
   - [ ] Login funciona
   - [ ] Leads são listados
   - [ ] Campanhas são listadas
   - [ ] Configurações carregam (ManyChat, Hotmart, etc)
   - [ ] Webhooks funcionam (testar com Hotmart/GreatPages)

### Validação de Dados

Execute no Render PostgreSQL Shell:
```sql
-- Contar registros principais
SELECT 'leads' as table_name, COUNT(*) as count FROM leads
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'sellers', COUNT(*) FROM sellers
UNION ALL
SELECT 'api_settings', COUNT(*) FROM api_settings;
```

Compare com os números do Supabase para garantir que tudo foi migrado.

## 🎉 Passo 7: Limpeza (Opcional)

Após confirmar que tudo está funcionando perfeitamente por alguns dias:

1. **Fazer backup final do Supabase** (por precaução)
2. **Pausar/Deletar projeto no Supabase**
   - Isso evitará cobranças futuras
   - Você pode pausar primeiro e deletar depois de 1 semana

## 🚨 Rollback (Se Algo Der Errado)

Se encontrar problemas durante a migração:

1. **Reverter variáveis de ambiente no Render**
   - Volte para `SUPABASE_URL` e `SUPABASE_ANON_KEY`
   - Remova `DATABASE_URL`

2. **Reverter `.env` local**
   - Volte para configuração antiga do Supabase

3. **Reiniciar servidores**
   - Local: Ctrl+C e `npm run dev`
   - Render: Fará redeploy automático

4. **Reportar problema**
   - Me informe o erro para investigarmos

## 📞 Suporte

Se tiver dúvidas em qualquer etapa, me avise! Estou aqui para ajudar.

---

**Tempo estimado total**: 30-45 minutos
**Downtime em produção**: 5-10 minutos (durante Passo 5)
