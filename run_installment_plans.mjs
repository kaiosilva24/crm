import('./backend/src/database/pg-adapter.js').then(async ({ getPool }) => {
    const pool = getPool();
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS installment_plans (
                id                          SERIAL PRIMARY KEY,
                lead_id                     INTEGER REFERENCES leads(id) ON DELETE SET NULL,
                lead_uuid                   UUID,
                lead_email                  TEXT,
                lead_name                   TEXT,
                product_name                TEXT,
                platform                    TEXT DEFAULT 'hotmart',
                gross_installment_value     NUMERIC(10,2),
                net_installment_value       NUMERIC(10,2),
                currency                    TEXT DEFAULT 'BRL',
                has_coproduction            BOOLEAN DEFAULT FALSE,
                total_installments          INTEGER NOT NULL,
                installments_paid           INTEGER DEFAULT 1,
                status                      TEXT DEFAULT 'active',
                first_payment_at            TIMESTAMPTZ,
                last_payment_at             TIMESTAMPTZ,
                next_expected_at            TIMESTAMPTZ,
                is_historical               BOOLEAN DEFAULT FALSE,
                migration_source            TEXT,
                metrics_start_date          TIMESTAMPTZ,
                hotmart_transaction         TEXT,
                created_at                  TIMESTAMPTZ DEFAULT NOW(),
                updated_at                  TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✅ Tabela installment_plans criada!');

        await pool.query(`CREATE INDEX IF NOT EXISTS idx_installment_plans_lead_id    ON installment_plans(lead_id);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_installment_plans_lead_uuid  ON installment_plans(lead_uuid);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_installment_plans_email      ON installment_plans(lead_email);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_installment_plans_status     ON installment_plans(status);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_installment_plans_historical ON installment_plans(is_historical);`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_installment_plans_next       ON installment_plans(next_expected_at);`);
        console.log('✅ Índices criados!');

        // Verificar colunas criadas
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'installment_plans' 
            ORDER BY ordinal_position;
        `);
        console.log('\n📋 Colunas da tabela installment_plans:');
        result.rows.forEach(r => console.log(`   • ${r.column_name} (${r.data_type})`));

        console.log('\n✅ Migração concluída com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro na migração:', e.message);
        process.exit(1);
    }
}).catch(e => { console.error(e.message); process.exit(1); });
