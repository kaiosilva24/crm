import { supabase } from './src/database/supabase.js';

async function check() {
    const { data } = await supabase
        .from('campaigns')
        .select('id, name, mirror_sales_source_id')
        .or('name.ilike.%LP 07%,name.ilike.%ALUNOS AVANÇADO%')
        .order('name');

    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}

check();
