-- Schema inicial para o CRM
-- Criação de todas as tabelas básicas

-- Tabela de usuários/sellers
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'seller',
    is_active BOOLEAN DEFAULT true,
    is_in_distribution BOOLEAN DEFAULT false,
    distribution_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de status de leads
CREATE TABLE IF NOT EXISTS lead_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL,
    display_order INTEGER NOT NULL,
    is_conversion BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    mirror_campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    first_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    product_name VARCHAR(255),
    observations TEXT,
    status_id INTEGER REFERENCES lead_statuses(id),
    seller_id INTEGER REFERENCES users(id),
    campaign_id INTEGER REFERENCES campaigns(id),
    subcampaign_id INTEGER,
    checking BOOLEAN DEFAULT false,
    previous_status_id INTEGER,
    previous_checking BOOLEAN,
    is_active BOOLEAN DEFAULT true,
    import_batch_id INTEGER,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de subcampanhas
CREATE TABLE IF NOT EXISTS subcampaigns (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL,
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de batches de importação
CREATE TABLE IF NOT EXISTS import_batches (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    total_leads INTEGER NOT NULL,
    campaign_id INTEGER REFERENCES campaigns(id),
    seller_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações da API
CREATE TABLE IF NOT EXISTS api_settings (
    id SERIAL PRIMARY KEY,
    manychat_api_token VARCHAR(255),
    greatpages_default_campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de grupos WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    campaign_id INTEGER REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de participantes de grupos
CREATE TABLE IF NOT EXISTS group_participants (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, phone)
);

-- Tabela de autenticação WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_auth_state (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    auth_state JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de webhooks Hotmart
CREATE TABLE IF NOT EXISTS hotmart_webhooks (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(50) UNIQUE NOT NULL,
    campaign_id INTEGER REFERENCES campaigns(id),
    use_round_robin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de grupos de campanha de leads
CREATE TABLE IF NOT EXISTS lead_campaign_groups (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    in_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lead_id, campaign_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_seller ON leads(seller_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_phone ON group_participants(phone);
CREATE INDEX IF NOT EXISTS idx_lead_campaign_groups_lead ON lead_campaign_groups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaign_groups_campaign ON lead_campaign_groups(campaign_id);

-- Inserir status padrão
INSERT INTO lead_statuses (name, color, display_order, is_conversion) VALUES
('Onboarding', '#3B82F6', 1, false),
('Qualificado', '#10B981', 2, false),
('Convertido', '#22C55E', 3, true),
('Perdido', '#EF4444', 4, false)
ON CONFLICT (name) DO NOTHING;

-- Inserir configuração padrão da API
INSERT INTO api_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMIT;
