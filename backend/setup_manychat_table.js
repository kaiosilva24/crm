import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://otgfcogtttydrmpfcukl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupManyChatEventsTable() {
    console.log("Setting up manychat_events table...");
    
    // We'll execute raw SQL using the Supabase REST API or a stored procedure if available
    // But since we can't easily run DDL via the JS client without a stored procedure,
    // we'll instruct the user to run it OR create a SQL file for them.
    
    const sql = `
CREATE TABLE IF NOT EXISTS manychat_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    product_name TEXT,
    status TEXT DEFAULT 'pending',
    automation_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);
`;
    console.log(sql);
}

setupManyChatEventsTable();
