
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    console.log('--- DEBUG START ---');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    console.log('Today:', todayStr);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, checking, created_at, lead_statuses(name)')
        .gte('created_at', todayStr);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${leads.length} leads created today.`);
    const checkedIn = leads.filter(l => l.checking === true);
    console.log(`Leads with checking=true: ${checkedIn.length}`);

    leads.forEach(l => {
        console.log(`Lead ${l.id}: checking=${l.checking}, status=${l.lead_statuses?.name}`);
    });
}

run();
