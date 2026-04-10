/**
 * migrate_installments_csv.js
 * 
 * Fase 0: Migração retroativa de planos de parcelamento do CSV histórico da Hotmart.
 * 
 * COMO USAR:
 *   1. Exporte todas as vendas da Hotmart (sem filtro de data) como CSV
 *   2. Salve o arquivo como: backend/hotmart_vendas_historico.csv
 *   3. Execute: node migrate_installments_csv.js
 * 
 * RESULTADO:
 *   - Planos ativos (parcelas não concluídas) → is_historical = TRUE
 *   - Planos quitados → is_historical = TRUE, status = 'completed'
 *   - Leads não encontrados no CRM → listados no relatório final
 *   - NENHUM dado entra nas métricas de receita (is_historical = true)
 */

import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const CSV_FILE = join(__dirname, 'hotmart_vendas_historico.csv');
const MIGRATION_SOURCE = `csv_hotmart_${new Date().toISOString().slice(0, 7).replace('-', '_')}`;

function parseValue(str) {
    if (!str || str.trim() === '') return null;
    return parseFloat(str.trim().replace(/\./g, '').replace(',', '.'));
}

function normalizePhone(ddd, tel) {
    if (!ddd && !tel) return null;
    const raw = `${ddd || ''}${tel || ''}`.replace(/\D/g, '');
    if (!raw) return null;
    if (raw.length === 11) return `55${raw}`;
    if (raw.length === 10) return `55${raw}`;
    return raw;
}

async function findLeadInCRM(email, phone) {
    // Tentar por email primeiro
    if (email && email.trim()) {
        const { data } = await supabase
            .from('leads')
            .select('uuid, id, first_name, email, phone')
            .eq('email', email.trim().toLowerCase())
            .limit(1);
        if (data?.length) return data[0];
    }

    // Tentar por telefone
    if (phone) {
        const tail = phone.slice(-8);
        const { data } = await supabase
            .from('leads')
            .select('uuid, id, first_name, email, phone')
            .ilike('phone', `%${tail}`)
            .limit(1);
        if (data?.length) return data[0];
    }

    return null;
}

async function main() {
    console.log('🔍 Iniciando migração de planos de parcelamento do CSV...');
    console.log(`📂 Arquivo: ${CSV_FILE}`);
    console.log(`📅 Fonte da migração: ${MIGRATION_SOURCE}\n`);

    // 1. Ler CSV
    const rows = [];
    await new Promise((resolve, reject) => {
        createReadStream(CSV_FILE)
            .pipe(parse({
                delimiter: '\t',       // CSV da Hotmart é separado por TAB
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true
            }))
            .on('data', row => rows.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`📊 Total de linhas no CSV: ${rows.length}`);

    // 2. Filtrar apenas linhas com Recorrência (= parcelamento inteligente)
    const recurrentRows = rows.filter(r => {
        const rec = r['Recorrência'] || r['Recorrencia'] || r['recorrencia'] || '';
        return rec.trim() !== '' && !isNaN(parseInt(rec));
    });

    console.log(`🔄 Linhas com recorrência: ${recurrentRows.length}\n`);

    // 3. Agrupar por: email + produto + total_parcelas
    //    Cada grupo = 1 plano de parcelamento único
    const plans = {};

    for (const row of recurrentRows) {
        const email = (row['Email'] || row['email'] || '').trim().toLowerCase();
        const produto = (row['Nome do Produto'] || '').trim();
        const totalParcelas = parseInt(row['Número da Parcela'] || row['Numero da Parcela'] || '0');
        const recorrencia = parseInt(row['Recorrência'] || row['Recorrencia'] || '0');

        if (!totalParcelas || !recorrencia) continue;

        const key = `${email}|${produto}|${totalParcelas}`;

        if (!plans[key]) {
            const ddd = (row['DDD'] || '').trim();
            const tel = (row['Telefone'] || '').trim();
            const phone = normalizePhone(ddd, tel);

            // Valores: bruto (Preço Total) e líquido (valor recebido)
            const grossValue = parseValue(row['Preço Total'] || row['Preco Total']);
            const netValue = parseValue(row['Valor que você recebeu convertido'] || row['Valor que voce recebeu convertido']);

            plans[key] = {
                email,
                phone,
                name: (row['Nome'] || '').trim(),
                product: produto,
                total_installments: totalParcelas,
                gross_installment_value: grossValue,
                net_installment_value: netValue,
                currency: (row['Moeda de recebimento'] || 'BRL').trim(),
                has_coproduction: (row['Tem co-produção'] || row['Tem co-producao'] || 'Não').trim() === 'Sim',
                payments_seen: [],
                first_payment_date: null
            };
        }

        plans[key].payments_seen.push(recorrencia);

        // Pegar a data da parcela mais recente como referência
        const dateStr = row['Data de Confirmação'] || row['Data de Confirmacao'] || '';
        if (dateStr && plans[key].payments_seen.length === 1) {
            // Tentar parsear dd/MM/yyyy HH:mm:ss
            const parts = dateStr.split(' ')[0].split('/');
            if (parts.length === 3) {
                plans[key].first_payment_date = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}T00:00:00Z`;
            }
        }
    }

    const allPlans = Object.values(plans);
    console.log(`📋 Planos únicos identificados: ${allPlans.length}\n`);

    // 4. Calcular estado de cada plano e processar
    let stats = {
        active: 0,
        completed: 0,
        not_found_in_crm: 0,
        already_exists: 0,
        errors: 0
    };

    const notFoundLeads = [];
    let totalGrossRemaining = 0;
    let totalNetRemaining = 0;

    for (const plan of allPlans) {
        plan.installments_paid = Math.max(...plan.payments_seen);
        plan.installments_remaining = plan.total_installments - plan.installments_paid;
        plan.status = plan.installments_remaining <= 0 ? 'completed' : 'active';
        plan.gross_remaining = (plan.installments_remaining * (plan.gross_installment_value || 0));
        plan.net_remaining = (plan.installments_remaining * (plan.net_installment_value || 0));

        // Buscar lead no CRM
        const lead = await findLeadInCRM(plan.email, plan.phone);

        if (!lead) {
            stats.not_found_in_crm++;
            notFoundLeads.push({
                name: plan.name,
                email: plan.email,
                product: plan.product,
                paid: `${plan.installments_paid}/${plan.total_installments}`,
                remaining: plan.installments_remaining
            });
            continue;
        }

        // Verificar se já existe um plano para este lead+produto
        const { data: existing } = await supabase
            .from('installment_plans')
            .select('id')
            .eq('lead_uuid', lead.uuid)
            .ilike('product_name', `%${plan.product.split(' ').slice(0, 3).join(' ')}%`)
            .limit(1);

        if (existing?.length) {
            stats.already_exists++;
            continue;
        }

        // Inserir o plano de parcelamento
        const { error } = await supabase.from('installment_plans').insert({
            lead_uuid: lead.uuid,
            lead_email: plan.email,
            lead_name: plan.name,
            product_name: plan.product,
            platform: 'hotmart',
            gross_installment_value: plan.gross_installment_value,
            net_installment_value: plan.net_installment_value,
            currency: plan.currency,
            has_coproduction: plan.has_coproduction,
            total_installments: plan.total_installments,
            installments_paid: plan.installments_paid,
            status: plan.status,
            first_payment_at: plan.first_payment_date,
            last_payment_at: plan.first_payment_date,
            next_expected_at: plan.status === 'active'
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : null,
            // CRÍTICO: marcar como histórico — não entra em métricas
            is_historical: true,
            migration_source: MIGRATION_SOURCE,
            metrics_start_date: null   // histórico não tem data de métricas
        });

        if (error) {
            console.error(`❌ Erro ao inserir plano ${plan.email} — ${plan.product}:`, error.message);
            stats.errors++;
        } else {
            if (plan.status === 'active') {
                stats.active++;
                totalGrossRemaining += plan.gross_remaining;
                totalNetRemaining += plan.net_remaining;
                console.log(`✅ ${plan.name} — ${plan.product} — ${plan.installments_paid}/${plan.total_installments} — A receber: R$ ${plan.gross_remaining.toFixed(2)}`);
            } else {
                stats.completed++;
                console.log(`✅ (Quitado) ${plan.name} — ${plan.product} — ${plan.installments_paid}/${plan.total_installments}`);
            }
        }
    }

    // 5. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Planos ATIVOS migrados:     ${stats.active}`);
    console.log(`✅ Planos QUITADOS migrados:   ${stats.completed}`);
    console.log(`⚠️  Já existiam no banco:       ${stats.already_exists}`);
    console.log(`⚠️  Não encontrados no CRM:     ${stats.not_found_in_crm}`);
    console.log(`❌ Erros:                       ${stats.errors}`);
    console.log('-'.repeat(60));
    console.log(`💰 Receita bruta a receber:    R$ ${totalGrossRemaining.toFixed(2)}`);
    console.log(`💵 Receita líquida a receber:  R$ ${totalNetRemaining.toFixed(2)}`);
    console.log(`📅 Fonte: ${MIGRATION_SOURCE} (is_historical = TRUE — não entra em métricas ao vivo)`);

    if (notFoundLeads.length > 0) {
        console.log('\n⚠️  Leads não encontrados no CRM (compraram antes do sistema):');
        notFoundLeads.forEach(l => {
            console.log(`   • ${l.name} (${l.email}) — ${l.product} — ${l.paid} parcelas`);
        });
    }

    console.log('='.repeat(60));
    console.log('✅ Migração concluída!');
}

main().catch(err => {
    console.error('❌ Erro fatal na migração:', err);
    process.exit(1);
});
