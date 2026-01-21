const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    console.log('🔧 Preparando ambiente Supabase CLI...\n');

    // 1. Criar pasta supabase/migrations se não existir
    const supabaseDir = path.join(__dirname, '../supabase');
    const migrationsDestDir = path.join(supabaseDir, 'migrations');

    if (!fs.existsSync(migrationsDestDir)) {
        console.log('📂 Criando diretórios supabase/migrations...');
        fs.mkdirSync(migrationsDestDir, { recursive: true });
    }

    // 2. Criar config.toml básico se não existir
    const configPath = path.join(supabaseDir, 'config.toml');
    if (!fs.existsSync(configPath)) {
        console.log('📝 Criando config.toml básico...');
        fs.writeFileSync(configPath, 'project_id = "nedtihfmhmlqwrhzajmd"\n', 'utf8');
    }

    // 3. Ler migrações atuais
    const sourceDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(sourceDir)
        .filter(f => f.endsWith('.sql'))
        // Filtrar correções manuais se já estiverem incorporadas ou manter ordem
        .sort();

    console.log(`\n📋 Convertendo ${files.length} arquivos de migração para formato CLI...`);

    let timestamp = 20240101000000; // Começar de uma data segura

    for (const file of files) {
        // Gerar timestamp sequencial
        timestamp += 10;
        const prefix = timestamp.toString();

        // Nome novo
        const newName = `${prefix}_${file}`;
        const srcPath = path.join(sourceDir, file);
        const destPath = path.join(migrationsDestDir, newName);

        // Copiar conteúdo
        const content = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, content, 'utf8');

        console.log(`   ✅ ${file} -> ${newName}`);
    }

    console.log('\n🎉 Preparação concluída!');
    console.log('👉 Próximo passo: Rodar "npx supabase link" e "npx supabase db push"');
}

main();
