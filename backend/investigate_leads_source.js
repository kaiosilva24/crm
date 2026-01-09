/**
 * Script para verificar de onde vieram os 79 leads
 */

import { supabase } from './src/database/supabase.js';

console.log('\n🔍 INVESTIGANDO ORIGEM DOS LEADS\n');
console.log('='.repeat(70));

async function investigateLeads() {
    try {
        // Buscar todos os leads
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, first_name, phone, source, campaign_id, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`📊 Total de leads: ${leads.length}\n`);

        // Agrupar por source
        const bySource = {};
        leads.forEach(lead => {
            const source = lead.source || 'unknown';
            if (!bySource[source]) bySource[source] = [];
            bySource[source].push(lead);
        });

        console.log('📊 Leads por fonte:\n');
        for (const [source, list] of Object.entries(bySource)) {
            console.log(`   ${source}: ${list.length} leads`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📋 Primeiros 10 leads:\n');

        leads.slice(0, 10).forEach((lead, i) => {
            console.log(`${i + 1}. ${lead.first_name || 'Sem nome'}`);
            console.log(`   Phone: ${lead.phone}`);
            console.log(`   Source: ${lead.source || 'N/A'}`);
            console.log(`   Campaign: ${lead.campaign_id}`);
            console.log(`   Created: ${lead.created_at}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        process.exit(0);
    }
}

investigateLeads();
