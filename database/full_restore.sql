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


-- MIGRATION: 000_FIX_add_in_group.sql
-- FIX: Add missing in_group column to leads
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE leads ADD COLUMN in_group BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;


-- MIGRATION: 000_FIX_cart_abandonment.sql
-- FIX: Create missing cart_abandonment_settings table with FULL SCHEMA
-- This ensures 'manychat_tag_name' exists for migration 012
CREATE TABLE IF NOT EXISTS cart_abandonment_settings (
    id SERIAL PRIMARY KEY,
    
    -- ManyChat
    manychat_api_token TEXT,
    manychat_flow_id_first TEXT,
    manychat_flow_id_second TEXT,
    manychat_webhook_url TEXT,
    manychat_tag_name TEXT DEFAULT 'abandono_carrinho', -- REQUIRED by 012
    
    -- Processing
    delay_minutes INTEGER DEFAULT 60,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    is_enabled BOOLEAN DEFAULT false,
    
    -- Aliases/Legacy support (if needed, but better to stick to 013 definition)
    enabled BOOLEAN DEFAULT false, -- Keeping for safety if used elsewhere, though 013 uses is_enabled
    message_template TEXT, -- From my previous fix, maybe unused? Keeping just in case.
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default record
INSERT INTO cart_abandonment_settings (id, is_enabled, delay_minutes, manychat_tag_name)
VALUES (1, false, 60, 'abandono_carrinho')
ON CONFLICT (id) DO NOTHING;


-- MIGRATION: 000_FIX_whatsapp_connections.sql
-- FIX: Create missing whatsapp_connections table
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id VARCHAR(255) PRIMARY KEY, -- connection_id like 'default'
    status VARCHAR(50) DEFAULT 'disconnected',
    qr_code TEXT,
    phone_number VARCHAR(50),
    -- pairing_code and pairing_phone will be added by 004 if not present here, 
    -- but good to have base structure. 
    -- 004 uses ALTER TABLE ADD COLUMN IF NOT EXISTS, so it is safe.
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default connection if not exists
INSERT INTO whatsapp_connections (id, status)
VALUES ('default', 'disconnected')
ON CONFLICT (id) DO NOTHING;


-- MIGRATION: 000_FIX_whatsapp_templates.sql
-- FIX: Create missing whatsapp_templates table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text',
    seller_id INTEGER REFERENCES users(id),
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- MIGRATION: 003_subcampaigns.sql
-- Tabela de Subcampanhas
CREATE TABLE IF NOT EXISTS subcampaigns (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1', -- Cor hex para o ponto
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo subcampaign_id na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS subcampaign_id INTEGER REFERENCES subcampaigns(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subcampaigns_campaign_id ON subcampaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_subcampaign_id ON leads(subcampaign_id);

-- RLS para subcampaigns
ALTER TABLE subcampaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON subcampaigns
    FOR ALL USING (true) WITH CHECK (true);


-- MIGRATION: 004_pairing_code.sql
-- Execute esta migration no Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);

COMMENT ON COLUMN whatsapp_connections.pairing_code IS 'Código de pareamento de 8 dígitos para vincular WhatsApp';
COMMENT ON COLUMN whatsapp_connections.pairing_phone IS 'Número de telefone usado para gerar o pairing code';

-- Verificar que as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_connections'
ORDER BY ordinal_position;


-- MIGRATION: 004_whatsapp_templates_seller.sql
-- ============================================
-- MIGRAÇÃO 004: Templates de WhatsApp por Vendedor
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Adicionar coluna seller_id na tabela whatsapp_templates
-- Se seller_id for NULL, o template é global (visível para todos)
-- Se seller_id tiver valor, é um template individual da vendedora
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_seller ON whatsapp_templates(seller_id);

-- Opcional: Adicionar coluna created_by para saber quem criou
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- IMPORTANTE: Remover templates antigos sem seller_id (globais)
-- Isso evita que templates apareçam para vendedores errados
DELETE FROM whatsapp_templates WHERE seller_id IS NULL;


-- MIGRATION: 005_backups_table.sql
-- Tabela para armazenar backups no Supabase
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    total_leads INTEGER DEFAULT 0,
    total_schedules INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar backups por data
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);

-- RLS para backups
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON backups
    FOR ALL USING (true) WITH CHECK (true);


-- MIGRATION: 006_whatsapp_groups.sql
-- Tabela para armazenar conexões WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id VARCHAR(255) PRIMARY KEY, -- Changed to VARCHAR to support 'default' and match fix
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) DEFAULT 'baileys',
    phone_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'disconnected',
    qr_code TEXT,
    pairing_code VARCHAR(10),
    pairing_phone VARCHAR(20),
    session_data JSONB,
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar grupos do WhatsApp
-- Table likely exists from 000_initial, so we alter it
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id SERIAL PRIMARY KEY,
    connection_id VARCHAR(255) REFERENCES whatsapp_connections(id) ON DELETE CASCADE,
    group_id VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    participant_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(connection_id, group_id)
);

-- Ensure columns exist if table was created by 000_initial
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE whatsapp_groups ADD COLUMN connection_id VARCHAR(255) REFERENCES whatsapp_connections(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE whatsapp_groups ADD COLUMN participant_count INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add UNIQUE constraint if not exists (tricky in DO block, skipping for now as it risks errors)
END $$;

-- Tabela para associar grupos a campanhas
CREATE TABLE IF NOT EXISTS campaign_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    whatsapp_group_id INTEGER REFERENCES whatsapp_groups(id) ON DELETE CASCADE, -- Changed to INTEGER to match SERIAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, whatsapp_group_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status ON whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_connection ON whatsapp_groups(connection_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_campaign ON campaign_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_groups_group ON campaign_groups(whatsapp_group_id);

-- RLS Policies
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections;
CREATE POLICY "Allow all for authenticated users on whatsapp_connections" ON whatsapp_connections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups;
CREATE POLICY "Allow all for authenticated users on whatsapp_groups" ON whatsapp_groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users on campaign_groups" ON campaign_groups;
CREATE POLICY "Allow all for authenticated users on campaign_groups" ON campaign_groups FOR ALL USING (true) WITH CHECK (true);


-- MIGRATION: 007_add_provider_pairing.sql
-- Adicionar coluna provider para suportar múltiplos providers (baileys/whapi)
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'baileys';

-- Adicionar colunas para suporte a Pairing Code (Redirect+)
ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(10);

ALTER TABLE whatsapp_connections 
ADD COLUMN IF NOT EXISTS pairing_phone VARCHAR(20);

-- Atualizar comentários para status
COMMENT ON COLUMN whatsapp_connections.status IS 'Status: disconnected, connecting, waiting_pairing, connected';
COMMENT ON COLUMN whatsapp_connections.provider IS 'Provider: baileys (local) ou whapi (cloud API)';
COMMENT ON COLUMN whatsapp_connections.pairing_code IS 'Código de pareamento para método Redirect+';
COMMENT ON COLUMN whatsapp_connections.pairing_phone IS 'Número de telefone usado para gerar o código de pareamento';


-- MIGRATION: 007_wappi_settings.sql
-- Tabela para armazenar configurações da Wappi
CREATE TABLE IF NOT EXISTS wappi_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_token VARCHAR(255) NOT NULL,
    profile_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Política de RLS (apenas autenticados podem ver/editar)
ALTER TABLE wappi_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users on wappi_settings" ON wappi_settings;
CREATE POLICY "Allow all for authenticated users on wappi_settings" ON wappi_settings
    FOR ALL USING (true) WITH CHECK (true);


-- MIGRATION: 008_add_whatsapp_groups_column.sql
-- Migration: Adicionar coluna whatsapp_groups na tabela leads
-- Para armazenar em quais grupos do WhatsApp o lead está

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS whatsapp_groups TEXT;

COMMENT ON COLUMN leads.whatsapp_groups IS 'Lista de grupos do WhatsApp que o lead participa (separados por vírgula)';


-- MIGRATION: 008_hotmart_integration.sql
-- Migration: Hotmart Integration
-- Creates tables for Hotmart webhook configuration and activity logging

-- Hotmart settings table (singleton)
CREATE TABLE IF NOT EXISTS hotmart_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    webhook_secret TEXT,
    default_campaign_id INTEGER REFERENCES campaigns(id),
    enable_auto_import BOOLEAN DEFAULT false,
    enable_distribution BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    CHECK (id = 1)
);

-- Webhook activity log
CREATE TABLE IF NOT EXISTS hotmart_webhook_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', 'duplicate'
    error_message TEXT,
    lead_uuid TEXT,
    buyer_email TEXT,
    buyer_name TEXT,
    product_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created_at ON hotmart_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_status ON hotmart_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_buyer_email ON hotmart_webhook_logs(buyer_email);


-- MIGRATION: 009_group_participants.sql
-- Migration: Create table to store group participants for display
-- This allows showing participants without needing active Baileys connection

CREATE TABLE IF NOT EXISTS group_participants (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_phone ON group_participants(phone);

COMMENT ON TABLE group_participants IS 'Cached participants from WhatsApp groups for display purposes';


-- MIGRATION: 009_hotmart_supabase.sql
-- SQL para criar tabelas do Hotmart no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar tabela de configurações
CREATE TABLE IF NOT EXISTS public.hotmart_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    webhook_secret TEXT,
    default_campaign_id INTEGER,
    enable_auto_import BOOLEAN DEFAULT false,
    enable_distribution BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_hotmart CHECK (id = 1)
);

-- 2. Criar tabela de logs de webhooks
CREATE TABLE IF NOT EXISTS public.hotmart_webhook_logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    lead_uuid TEXT,
    buyer_email TEXT,
    buyer_name TEXT,
    product_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created_at ON public.hotmart_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_status ON public.hotmart_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_hotmart_logs_buyer_email ON public.hotmart_webhook_logs(buyer_email);

-- 4. Inserir configuração padrão
INSERT INTO public.hotmart_settings (id, enable_auto_import, enable_distribution)
VALUES (1, true, false)
ON CONFLICT (id) DO NOTHING;

-- 5. Verificar se foi criado
SELECT * FROM public.hotmart_settings;


-- MIGRATION: 010_add_product_column.sql
-- Add product column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS product TEXT;

-- Index for searching by product
CREATE INDEX IF NOT EXISTS idx_leads_product ON public.leads(product);


-- MIGRATION: 010_hotmart_multiple_webhooks.sql
-- SQL para criar suporte a múltiplos webhooks do Hotmart no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar tabela de configurações de webhooks
CREATE TABLE IF NOT EXISTS public.hotmart_webhook_configs (
    id SERIAL PRIMARY KEY,
    webhook_number INTEGER NOT NULL UNIQUE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    webhook_secret TEXT,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar coluna webhook_config_id na tabela de logs
ALTER TABLE public.hotmart_webhook_logs 
ADD COLUMN IF NOT EXISTS webhook_config_id INTEGER REFERENCES hotmart_webhook_configs(id) ON DELETE SET NULL;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hotmart_configs_webhook_number 
ON public.hotmart_webhook_configs(webhook_number);

CREATE INDEX IF NOT EXISTS idx_hotmart_configs_enabled 
ON public.hotmart_webhook_configs(is_enabled);

CREATE INDEX IF NOT EXISTS idx_hotmart_logs_webhook_config 
ON public.hotmart_webhook_logs(webhook_config_id);

-- 4. Migrar configuração existente (se houver)
-- Cria webhook #1 com a campanha padrão atual
INSERT INTO public.hotmart_webhook_configs (webhook_number, campaign_id, is_enabled)
SELECT 
    1 as webhook_number,
    default_campaign_id,
    enable_auto_import
FROM public.hotmart_settings
WHERE id = 1
ON CONFLICT (webhook_number) DO NOTHING;

-- 5. Verificar se foi criado
SELECT * FROM public.hotmart_webhook_configs ORDER BY webhook_number;


-- MIGRATION: 011_allow_null_status.sql
-- Allow null status_id in leads table (to show "-selecione-" in UI)
ALTER TABLE public.leads 
ALTER COLUMN status_id DROP NOT NULL;


-- MIGRATION: 011_webhook_round_robin.sql
-- Migration: Add Round-Robin configuration per webhook
-- Adiciona suporte para configuração de Round-Robin individual por webhook

-- 1. Adicionar coluna enable_round_robin na tabela de webhooks
ALTER TABLE public.hotmart_webhook_configs 
ADD COLUMN IF NOT EXISTS enable_round_robin BOOLEAN DEFAULT false;

-- 2. Migrar configuração global existente para os webhooks ativos
-- Isso preserva o comportamento atual do sistema
UPDATE public.hotmart_webhook_configs 
SET enable_round_robin = (
    SELECT COALESCE(enable_distribution, false)
    FROM public.hotmart_settings 
    WHERE id = 1
)
WHERE is_enabled = true;

-- 3. Verificar resultado
SELECT 
    id,
    webhook_number,
    campaign_id,
    enable_round_robin,
    is_enabled
FROM public.hotmart_webhook_configs 
ORDER BY webhook_number;


-- MIGRATION: 012_add_group_indexes.sql
-- Migration: Add indexes for faster group synchronization
-- Date: 2024-01-05

-- Index for filtering leads by group status
CREATE INDEX IF NOT EXISTS idx_leads_in_group ON leads(in_group);

-- Index for looking up leads by phone number (used heavily during sync)
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);


-- MIGRATION: 012_dual_tag_config.sql
-- Migration: Add separate field for second tag
-- This allows independent configuration of Tag 1 and Tag 2

ALTER TABLE cart_abandonment_settings 
ADD COLUMN IF NOT EXISTS manychat_tag_name_second VARCHAR(255);

-- Set default for existing rows (append _2 to current tag)
UPDATE cart_abandonment_settings 
SET manychat_tag_name_second = CONCAT(COALESCE(manychat_tag_name, 'abandono_carrinho'), '_2')
WHERE manychat_tag_name_second IS NULL;


-- MIGRATION: 013_add_flow_id_first.sql
-- Adicionar coluna manychat_flow_id_first que estava faltando
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.cart_abandonment_settings 
ADD COLUMN IF NOT EXISTS manychat_flow_id_first TEXT;

-- Verificar se foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cart_abandonment_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;


-- MIGRATION: 013_cart_abandonment.sql
-- Migration 013: Cart Abandonment System
-- Cria tabelas para gerenciar abandono de carrinho com integração ManyChat

-- 1. Tabela de configurações do sistema de abandono de carrinho
CREATE TABLE IF NOT EXISTS public.cart_abandonment_settings (
    id SERIAL PRIMARY KEY,
    
    -- Configurações ManyChat
    manychat_api_token TEXT,
    manychat_flow_id_first TEXT, -- Flow disparado pela TAG (primeira mensagem)
    manychat_flow_id_second TEXT, -- Flow disparado via API (segunda mensagem)
    manychat_webhook_url TEXT, -- URL do webhook ManyChat (opcional)
    manychat_tag_name TEXT DEFAULT 'abandono_carrinho', -- Nome da TAG a ser aplicada
    
    -- Configurações de processamento
    delay_minutes INTEGER DEFAULT 60, -- Tempo de espera antes da segunda verificação
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL, -- Campanha para verificar conversão
    
    -- Controle
    is_enabled BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO public.cart_abandonment_settings (id, is_enabled, delay_minutes)
VALUES (1, false, 60)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de eventos de abandono de carrinho
CREATE TABLE IF NOT EXISTS public.cart_abandonment_events (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- Dados do contato
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    product_name TEXT,
    
    -- Dados do evento Hotmart
    event_type TEXT, -- PURCHASE_CANCELED, CART_ABANDONED, etc.
    hotmart_transaction_id TEXT,
    
    -- Status de processamento
    status TEXT DEFAULT 'pending', -- pending, processing, completed, error, duplicate
    error_message TEXT,
    
    -- Controle de mensagens
    first_message_sent BOOLEAN DEFAULT false,
    first_message_sent_at TIMESTAMPTZ,
    
    second_message_sent BOOLEAN DEFAULT false,
    second_message_sent_at TIMESTAMPTZ,
    
    -- Verificação de campanha
    found_in_campaign BOOLEAN DEFAULT false,
    campaign_check_at TIMESTAMPTZ,
    
    -- ManyChat
    manychat_subscriber_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Payload original
    payload JSONB
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cart_events_email 
ON public.cart_abandonment_events(contact_email);

CREATE INDEX IF NOT EXISTS idx_cart_events_phone 
ON public.cart_abandonment_events(contact_phone);

CREATE INDEX IF NOT EXISTS idx_cart_events_status 
ON public.cart_abandonment_events(status);

CREATE INDEX IF NOT EXISTS idx_cart_events_created 
ON public.cart_abandonment_events(created_at DESC);

-- Índice composto para buscar duplicatas
CREATE INDEX IF NOT EXISTS idx_cart_events_duplicate_check 
ON public.cart_abandonment_events(contact_email, contact_phone, created_at DESC);

-- 3. Tabela de logs detalhados de processamento
CREATE TABLE IF NOT EXISTS public.cart_abandonment_logs (
    id SERIAL PRIMARY KEY,
    
    -- Referência ao evento
    event_id INTEGER REFERENCES cart_abandonment_events(id) ON DELETE CASCADE,
    
    -- Tipo de ação
    action_type TEXT NOT NULL, -- webhook_received, first_message, delay_wait, campaign_check, second_message, error
    
    -- Status da ação
    status TEXT NOT NULL, -- success, error, skipped
    
    -- Detalhes
    message TEXT,
    error_message TEXT,
    
    -- Payload da ação (para debug)
    payload JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_cart_logs_event 
ON public.cart_abandonment_logs(event_id);

CREATE INDEX IF NOT EXISTS idx_cart_logs_action 
ON public.cart_abandonment_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_cart_logs_created 
ON public.cart_abandonment_logs(created_at DESC);

-- 4. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_cart_abandonment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_cart_abandonment_settings_updated_at 
ON public.cart_abandonment_settings;

CREATE TRIGGER trigger_update_cart_abandonment_settings_updated_at
    BEFORE UPDATE ON public.cart_abandonment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_abandonment_settings_updated_at();

-- Verificar criação
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT * FROM public.cart_abandonment_settings;


