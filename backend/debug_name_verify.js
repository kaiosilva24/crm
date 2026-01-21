import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MANYCHAT_API_BASE = 'https://api.manychat.com';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSubscriberByName(name, apiToken) {
    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByName`, {
            params: { name: name },
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });
        if (response.data && response.data.data) {
            return response.data.data.map(s => s.id);
        }
        return [];
    } catch (e) { return []; }
}

async function runStrategyTest() {
    try {
        const { data: settings } = await supabase.from('cart_abandonment_settings').select('manychat_api_token').single();
        const apiToken = settings.manychat_api_token;
        const TARGET_PHONE = '5567981720357';
        const NAME = 'Suporte Kaio';

        console.log(`🔍 TESTE DE ESTRATEGIA HIBRIDA`);
        console.log(`Nome: ${NAME} | Phone: ${TARGET_PHONE}`);

        // 1. Find candidates
        const candidates = await findSubscriberByName(NAME, apiToken);
        console.log(`Candidatos encontrados por nome: ${candidates.join(', ')}`);

        // 2. Verify
        const cleanTarget = TARGET_PHONE.replace(/\D/g, '');

        for (const id of candidates) {
            const res = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/getInfo?subscriber_id=${id}`, {
                headers: { 'Authorization': `Bearer ${apiToken}` }
            });
            const sub = res.data.data;

            console.log(`\nVerificando ID ${id}:`);
            console.log(`   Status: ${sub.status}`);

            if (sub.status === 'deleted') {
                console.log('   ⚠️ DELETED - IGNORADO');
                continue;
            }

            const phoneA = sub.phone ? sub.phone.replace(/\D/g, '') : '';
            const phoneB = sub.whatsapp_phone ? sub.whatsapp_phone.replace(/\D/g, '') : '';

            if (phoneA.includes(cleanTarget) || phoneB.includes(cleanTarget)) {
                console.log('   ✅ MATCH CONFIRMADO! (Verificação Numérica OK)');
            } else {
                console.log('   ❌ NÃO BATE O NÚMERO');
            }
        }

    } catch (error) {
        console.error('Fatal:', error);
    }
}

runStrategyTest();
