import { db, supabase } from './src/database/supabase.js';

async function checkLead() {
    console.log('Listing top 5 leads...');
    const { data: leads, error } = await supabase.from('leads').select('email, checking').limit(5);
    if (error) console.error(error);
    console.log(leads);
}

checkLead();
