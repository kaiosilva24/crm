
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLongNumbers() {
    console.log('--- Checking for long phone numbers (>14 chars) ---');
    // Using a regex or length check would be ideal, but Supabase simple filter:
    // We can fetch a batch and filter in JS
    const { data, error } = await supabase
        .from('leads')
        .select('phone, id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error(error);
        return;
    }

    const longPhones = data.filter(l => l.phone.length > 14);
    console.log(`Found ${longPhones.length} long numbers out of 50 recent leads.`);
    if (longPhones.length > 0) {
        console.log('Sample:', longPhones.slice(0, 5));
    }
}

checkLongNumbers();
