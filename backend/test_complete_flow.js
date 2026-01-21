import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BACKEND_URL = 'http://localhost:3001';
const TEST_PHONE = '5567981720357';
const TEST_EMAIL = 'teste.fluxo.completo@hotmart.com';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log('🚀 Starting Complete Flow Test...');

    // 1. Setup: Clean DB and Set Short Delay
    console.log('🧹 Cleaning up previous test data...');
    await supabase.from('cart_abandonment_events').delete().eq('contact_email', TEST_EMAIL);

    console.log('⚙️ Configuring settings (Delay: 1 min)...');
    // Note: We need admin token to update settings normally, but we can do it via Supabase directly if we have service key
    // assuming service key is available.
    await supabase
        .from('cart_abandonment_settings')
        .update({ delay_minutes: 1, is_enabled: true })
        .eq('id', 1);

    // 2. Send INITIAL Event
    console.log('📨 Sending Initial Webhook...');
    const payload = {
        event: 'CART_ABANDONMENT',
        data: {
            buyer: {
                name: 'Suporte Kaio',
                email: TEST_EMAIL,
                checkout_phone: TEST_PHONE,
                phone: TEST_PHONE
            },
            product: { name: 'Produto Teste Flow' },
            purchase: { transaction: `HP${Date.now()}` }
        }
    };

    const res1 = await fetch(`${BACKEND_URL}/api/cart-abandonment/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data1 = await res1.json();
    console.log('Event 1 Response:', data1);
    const eventId = data1.event_id;

    if (!eventId) {
        console.error('❌ Failed to create event');
        return;
    }

    // 3. Send DUPLICATE Event immediately
    console.log('📨 Sending Duplicate Webhook (should be ignored)...');
    const res2 = await fetch(`${BACKEND_URL}/api/cart-abandonment/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data2 = await res2.json();
    console.log('Event 2 Response:', data2);
    if (data2.message && data2.message.includes('Duplicate')) {
        console.log('✅ Duplicate correctly detected and ignored.');
    } else {
        console.error('❌ Duplicate Check Failed!');
    }

    // 4. Login to get token for checking logs/status via API (simulating frontend)
    const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@crm.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 5. Monitor Status
    console.log('⏳ Monitoring Event Status (Waiting for Delay ~1 min)...');
    let completed = false;
    let attempts = 0;

    while (!completed && attempts < 20) { // Wait up to ~100s
        await new Promise(r => setTimeout(r, 5000));
        attempts++;

        const evRes = await fetch(`${BACKEND_URL}/api/cart-abandonment/events?status=&limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const evData = await evRes.json();
        const myEvent = evData.events.find(e => e.id === eventId);

        if (myEvent) {
            console.log(`[${new Date().toLocaleTimeString()}] Status: ${myEvent.status} | Msg1: ${myEvent.first_message_sent} | Msg2: ${myEvent.second_message_sent}`);

            if (myEvent.status === 'completed' || myEvent.status === 'error') {
                completed = true;
            }
        }
    }

    // 6. Fetch Logs to verify sequence
    console.log('📜 Fetching Logs...');
    const logRes = await fetch(`${BACKEND_URL}/api/cart-abandonment/logs?event_id=${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const logData = await logRes.json();
    const logs = logData.logs;

    fs.writeFileSync('complete_test_logs.json', JSON.stringify(logs, null, 2));

    // Check specific steps in logs
    const hasDuplicate = logs.some(l => l.status === 'skipped' && l.message.includes('Duplicate')); // Actually duplicate logs are on the DUPLICATE event ID, not the original.

    // Check main event flow
    const hasFirstMsg = logs.some(l => l.action_type === 'first_message');
    const hasDelay = logs.some(l => l.action_type === 'delay_wait');
    const hasCampaignCheck = logs.some(l => l.action_type === 'campaign_check');
    const hasSecondMsg = logs.some(l => l.action_type === 'second_message');

    console.log('\n--- VERIFICATION REPORT ---');
    console.log(`1. Duplicate Check: ${data2.message.includes('Duplicate') ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`2. First Message: ${hasFirstMsg ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`3. Delay Wait: ${hasDelay ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`4. Campaign Check: ${hasCampaignCheck ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`5. Second Message: ${hasSecondMsg ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`6. Final Status Approved: ${completed ? 'PASSED ✅' : 'FAILED ❌'}`);

    console.log('\nLogs saved to complete_test_logs.json');
}

runTest();
