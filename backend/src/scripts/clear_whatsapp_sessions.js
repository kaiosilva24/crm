import { supabase } from '../database/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function clearAllSessions() {
    console.log('🧹 Limpando todas as sessões WhatsApp...\n');

    try {
        // 1. Listar todas as conexões
        const { data: connections, error } = await supabase
            .from('whatsapp_connections')
            .select('*');

        if (error) throw error;

        console.log(`📊 Encontradas ${connections.length} conexões no banco\n`);

        // 2. Para cada conexão, deletar arquivos e registro
        for (const conn of connections) {
            console.log(`🗑️ Limpando conexão: ${conn.name} (${conn.id})`);

            // Deletar arquivos de autenticação
            const authDir = path.join(__dirname, '../../../.wwebjs_auth', conn.id);
            if (fs.existsSync(authDir)) {
                console.log(`   📁 Deletando pasta: ${authDir}`);
                fs.rmSync(authDir, { recursive: true, force: true });
                console.log(`   ✅ Pasta deletada`);
            } else {
                console.log(`   ⚠️ Pasta não existe`);
            }

            // Deletar do banco
            const { error: deleteError } = await supabase
                .from('whatsapp_connections')
                .delete()
                .eq('id', conn.id);

            if (deleteError) {
                console.log(`   ❌ Erro ao deletar do banco: ${deleteError.message}`);
            } else {
                console.log(`   ✅ Deletado do banco`);
            }

            console.log('');
        }

        console.log('\n🎉 TUDO LIMPO!');
        console.log('\n📝 Próximos passos:');
        console.log('1. Acesse http://localhost:5173/groups');
        console.log('2. Clique em "+ Nova Conexão"');
        console.log('3. Nome: "WhatsApp Principal"');
        console.log('4. Conecte e escolha "🔑 Código de Pareamento"');
        console.log('5. Digite seu número com DDI: 5562999981718');
        console.log('6. Use o código gerado no WhatsApp!\n');

    } catch (error) {
        console.error('❌ Erro:', error);
    }

    process.exit(0);
}

clearAllSessions();
