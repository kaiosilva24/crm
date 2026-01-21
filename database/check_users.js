const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) console.error(error);
    else console.log(`👥 Usuários no banco: ${count}`);
}

check();
