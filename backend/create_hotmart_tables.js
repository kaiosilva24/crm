/**
 * Script para criar tabelas do Hotmart no Supabase
 */

import { supabase } from './src/database/supabase.js';

async function createHotmartTables() {
    console.log('🔧 Criando tabelas do Hotmart no Supabase...\n');

    try {
        // Criar tabela hotmart_settings
        console.log('1️⃣ Criando tabela hotmart_settings...');
        const { error: error1 } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS hotmart_settings (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    webhook_secret TEXT,
                    default_campaign_id INTEGER,
                    enable_auto_import BOOLEAN DEFAULT false,
                    enable_distribution BOOLEAN DEFAULT false,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    CONSTRAINT single_row CHECK (id = 1)
                );
            `
        });

        if (error1) {
            console.error('❌ Erro ao criar hotmart_settings:', error1.message);
        } else {
            console.log('✅ Tabela hotmart_settings criada!\n');
        }

        // Criar tabela hotmart_webhook_logs
        console.log('2️⃣ Criando tabela hotmart_webhook_logs...');
        const { error: error2 } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE TABLE IF NOT EXISTS hotmart_webhook_logs (
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
            `
        });

        if (error2) {
            console.error('❌ Erro ao criar hotmart_webhook_logs:', error2.message);
        } else {
            console.log('✅ Tabela hotmart_webhook_logs criada!\n');
        }

        // Criar índices
        console.log('3️⃣ Criando índices...');
        const { error: error3 } = await supabase.rpc('exec_sql', {
            sql_query: `
                CREATE INDEX IF NOT EXISTS idx_hotmart_logs_created_at ON hotmart_webhook_logs(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_hotmart_logs_status ON hotmart_webhook_logs(status);
                CREATE INDEX IF NOT EXISTS idx_hotmart_logs_buyer_email ON hotmart_webhook_logs(buyer_email);
            `
        });

        if (error3) {
            console.error('❌ Erro ao criar índices:', error3.message);
        } else {
            console.log('✅ Índices criados!\n');
        }

        console.log('🎉 Tabelas do Hotmart criadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

createHotmartTables();
