import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function test() {
    console.log('--- API FIX DIAGNOSTIC ---');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    // Test the problematic number
    const phone = "5562983160896";

    // Method A: Current implementation
    // /fb/subscriber/findBySystemField?field_name=phone&field_value=...
    console.log('[A] Testing field_name/field_value...');
    try {
        const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?field_name=phone&field_value=${encodeURIComponent(phone)}`;
        await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ [A] Success');
    } catch (e) {
        console.log(`❌ [A] Fail: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    }

    // Method B: Correct param implementation?
    // /fb/subscriber/findBySystemField?phone=...
    console.log('\n[B] Testing direct param phone=...');
    try {
        const url = `${MANYCHAT_API_BASE}/fb/subscriber/findBySystemField?phone=${encodeURIComponent(phone)}`;
        const res = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        console.log('✅ [B] Success');
        console.log(`   DATA: ${JSON.stringify(res.data)}`);
    } catch (e) {
        console.log(`❌ [B] Fail: ${e.response?.status} - ${JSON.stringify(e.response?.data)}`);
    }
}

test();
