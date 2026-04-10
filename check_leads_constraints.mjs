import('./backend/src/database/pg-adapter.js').then(async ({ getPool }) => {
    const pool = getPool();
    try {
        const r = await pool.query(`
            SELECT tc.constraint_type, tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'leads' 
            AND tc.constraint_type IN ('PRIMARY KEY','UNIQUE')
            ORDER BY tc.constraint_type, kcu.column_name;
        `);
        console.log('Constraints da tabela leads:');
        r.rows.forEach(row => console.log(` ${row.constraint_type} | ${row.constraint_name} | ${row.column_name}`));

        // também verificar se uuid é PK
        const r2 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name IN ('id','uuid')
            ORDER BY ordinal_position;
        `);
        console.log('\nColunas id e uuid:');
        r2.rows.forEach(row => console.log(` ${row.column_name}: ${row.data_type}`));

        process.exit(0);
    } catch (e) {
        console.error('Erro:', e.message);
        process.exit(1);
    }
}).catch(e => { console.error(e.message); process.exit(1); });
