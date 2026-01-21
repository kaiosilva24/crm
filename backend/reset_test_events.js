import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// We likely need service role key to delete if RLS protects it, but let's try anon or just see if we can use the backend client.
// Actually, I can just import the backend supabase client.

import { supabase } from './src/database/supabase.js';

async function reset() {
    console.log('Clearing events for 5567981720357...');

    // Normalize phone mostly just in case
    const phone = '5567981720357';

    const { error } = await supabase
        .from('cart_abandonment_events')
        .delete()
        .eq('contact_phone', phone);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Events cleared.');
    }
}

reset();
