import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
    console.log('🔍 Testando conexão com Supabase...');
    console.log('📍 URL:', process.env.SUPABASE_URL);

    try {
        // Testar listando tabelas
        const { data, error } = await supabase
            .from('cart_abandonment_settings')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ Erro ao conectar:', error.message);
            console.log('💡 Isso é esperado se a tabela ainda não existir no novo banco');
        } else {
            console.log('✅ Conexão bem-sucedida!');
            console.log('📊 Dados encontrados:', data);
        }
    } catch (err) {
        console.log('❌ Erro:', err.message);
    }
}

testConnection();
