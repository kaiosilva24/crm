
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDailyCheckin() {
    console.log('--- DEBUG DAILY CHECK-IN ---');

    // Time diagnostics
    const now = new Date();
    console.log('Server Time (new Date()):', now.toString());
    console.log('Server Time (ISO):', now.toISOString());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    console.log('Today Start (setHours(0,0,0,0) -> ISO):', todayStr);

    // 1. Count Total Leads Today
    const { count: totalToday, error: errTotal } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStr);

    if (errTotal) console.error('Error counting today leads:', errTotal);
    console.log('Total Leads Today:', totalToday);

    // 2. Count Check-in Completed Today (using "checking" = true)
    const { count: checkingTrue, error: errTrue } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('checking', true)
        .gte('created_at', todayStr);

    if (errTrue) console.error('Error counting check-in=true:', errTrue);
    console.log('Check-in Completed (checking=true) Today:', checkingTrue);

    // 3. Inspect Leads Today to see column values
    const { data: leads, error: errLeads } = await supabase
        .from('leads')
        .select('id, created_at, checking, lead_statuses(name)')
        .gte('created_at', todayStr)
        .limit(10);

    if (errLeads) {
        console.error('Error fetching leads:', errLeads);
    } else {
        console.log('\nSample Leads Created Today:');
        leads.forEach(l => {
            console.log(`ID: ${l.id}, Created: ${l.created_at}, Checking: ${l.checking}, Status: ${l.lead_statuses?.name}`);
        });
    }
}

debugDailyCheckin();
