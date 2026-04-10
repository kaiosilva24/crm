/**
 * Analytics Routes - UTM & Financial Dashboard
 * GET /api/analytics/utm
 */

import { Router } from 'express';
import { supabase } from '../database/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

const PERIOD_INTERVALS = {
    '7d': "NOW() - INTERVAL '7 days'",
    '30d': "NOW() - INTERVAL '30 days'",
    '90d': "NOW() - INTERVAL '90 days'",
    'all': null
};

router.get('/utm', async (req, res) => {
    try {
        const { period = '30d', utm_source, platform } = req.query;
        const interval = PERIOD_INTERVALS[period] || PERIOD_INTERVALS['30d'];
        const pool = supabase._pool;

        // Filtros dinâmicos (sem alias lje para CTEs)
        const periodFilter = interval ? `AND created_at >= ${interval}` : '';
        const sourceFilter = utm_source ? `AND utm_source = '${utm_source.replace(/'/g, "''")}'` : '';
        const platformFilter = platform ? `AND metadata->>'platform' = '${platform.replace(/'/g, "''")}'` : '';
        const extraFilters = `${sourceFilter} ${platformFilter}`;

        // Mediums considerados como tráfego PAGO
        const PAID_MEDIUMS = `('cpc','paid','cpm','ppc','paidsocial','paid_social','cpa')`;

        const [
            kpiResult,
            bySourceResult,
            byMediumResult,
            byPlatformResult,
            byCampaignResult,
            timelineResult,
            topContentResult
        ] = await Promise.all([

            // ── KPIs: classifica cada lead pelo SEU PRIMEIRO evento de entrada ──
            pool.query(`
                WITH first_entries AS (
                    SELECT DISTINCT ON (lead_id)
                        lead_id,
                        utm_medium,
                        metadata
                    FROM lead_journey_events
                    WHERE event_type = 'entry'
                    ${periodFilter}
                    ${extraFilters}
                    ORDER BY lead_id, created_at ASC
                ),
                financial_totals AS (
                    SELECT
                        COUNT(DISTINCT lead_id)::int AS vendas_rastreadas,
                        COALESCE(SUM((metadata->'financials'->>'gross')::numeric), 0) AS total_gross,
                        COALESCE(SUM((metadata->'financials'->>'net')::numeric), 0) AS total_net
                    FROM lead_journey_events
                    WHERE metadata->'financials' IS NOT NULL
                    ${periodFilter}
                )
                SELECT
                    (SELECT COUNT(*) FROM first_entries)::int AS total_leads,
                    (SELECT total_gross FROM financial_totals) AS total_gross,
                    (SELECT total_net FROM financial_totals) AS total_net,
                    (SELECT vendas_rastreadas FROM financial_totals) AS vendas_rastreadas,
                    COUNT(*) FILTER (WHERE utm_medium IN ${PAID_MEDIUMS})::int AS leads_pagos,
                    COUNT(*) FILTER (WHERE utm_medium NOT IN ${PAID_MEDIUMS} OR utm_medium IS NULL)::int AS leads_organicos
                FROM first_entries
            `),

            // ── Leads por Source — baseado no 1º evento de entrada por lead ──
            pool.query(`
                WITH first_entries AS (
                    SELECT DISTINCT ON (lead_id)
                        lead_id,
                        COALESCE(utm_source, 'Direto / Sem UTM') AS source,
                        metadata
                    FROM lead_journey_events
                    WHERE event_type = 'entry'
                    ${periodFilter}
                    ${extraFilters}
                    ORDER BY lead_id, created_at ASC
                )
                SELECT
                    source,
                    COUNT(DISTINCT lead_id)::int AS leads,
                    COALESCE(SUM((metadata->'financials'->>'gross')::numeric) FILTER (WHERE metadata->'financials' IS NOT NULL), 0) AS gross_revenue,
                    COALESCE(SUM((metadata->'financials'->>'net')::numeric) FILTER (WHERE metadata->'financials' IS NOT NULL), 0) AS net_revenue
                FROM first_entries
                GROUP BY source
                ORDER BY leads DESC
                LIMIT 10
            `),

            // ── Leads por Medium — baseado no 1º evento de entrada por lead ──
            pool.query(`
                WITH first_entries AS (
                    SELECT DISTINCT ON (lead_id)
                        lead_id,
                        COALESCE(utm_medium, 'Sem Medium') AS medium
                    FROM lead_journey_events
                    WHERE event_type = 'entry'
                    ${periodFilter}
                    ${extraFilters}
                    ORDER BY lead_id, created_at ASC
                )
                SELECT
                    medium,
                    COUNT(DISTINCT lead_id)::int AS leads
                FROM first_entries
                GROUP BY medium
                ORDER BY leads DESC
                LIMIT 8
            `),

            // ── Plataformas de Venda (todos os eventos com financials) ────────
            pool.query(`
                SELECT
                    metadata->>'platform' AS platform,
                    COUNT(DISTINCT lead_id)::int AS vendas,
                    COALESCE(SUM((metadata->'financials'->>'gross')::numeric), 0) AS gross,
                    COALESCE(SUM((metadata->'financials'->>'net')::numeric), 0) AS net
                FROM lead_journey_events
                WHERE metadata->>'platform' IS NOT NULL
                  AND metadata->'financials' IS NOT NULL
                  ${periodFilter}
                  ${platformFilter}
                GROUP BY platform
                ORDER BY vendas DESC
            `),

            // ── Top Campanhas — baseado no 1º evento de entrada por lead ─────
            pool.query(`
                WITH first_entries AS (
                    SELECT DISTINCT ON (lead_id)
                        lead_id,
                        utm_campaign,
                        metadata
                    FROM lead_journey_events
                    WHERE event_type = 'entry'
                      AND utm_campaign IS NOT NULL
                      ${periodFilter}
                      ${extraFilters}
                    ORDER BY lead_id, created_at ASC
                )
                SELECT
                    utm_campaign AS campaign,
                    COUNT(DISTINCT lead_id)::int AS leads,
                    COALESCE(SUM((metadata->'financials'->>'gross')::numeric) FILTER (WHERE metadata->'financials' IS NOT NULL), 0) AS gross_revenue
                FROM first_entries
                GROUP BY campaign
                ORDER BY leads DESC
                LIMIT 10
            `),

            // ── Timeline diária — baseado no 1º evento de entrada por lead ───
            pool.query(`
                WITH first_entries AS (
                    SELECT DISTINCT ON (lead_id)
                        lead_id,
                        utm_medium,
                        created_at,
                        metadata
                    FROM lead_journey_events
                    WHERE event_type = 'entry'
                    ${periodFilter}
                    ${extraFilters}
                    ORDER BY lead_id, created_at ASC
                )
                SELECT
                    DATE(created_at AT TIME ZONE 'America/Sao_Paulo') AS date,
                    COUNT(DISTINCT lead_id)::int AS total,
                    COUNT(DISTINCT lead_id) FILTER (WHERE utm_medium IN ${PAID_MEDIUMS})::int AS pago,
                    COUNT(DISTINCT lead_id) FILTER (WHERE utm_medium NOT IN ${PAID_MEDIUMS} OR utm_medium IS NULL)::int AS organico,
                    COALESCE(SUM((metadata->'financials'->>'gross')::numeric) FILTER (WHERE metadata->'financials' IS NOT NULL), 0) AS revenue
                FROM first_entries
                GROUP BY date
                ORDER BY date ASC
            `),

            // ── Top Criativos (utm_content) — baseado no 1º evento por lead ──
            pool.query(`
                WITH first_entries AS (
                    SELECT DISTINCT ON (lead_id)
                        lead_id,
                        utm_content,
                        utm_source,
                        metadata
                    FROM lead_journey_events
                    WHERE event_type = 'entry'
                      AND utm_content IS NOT NULL
                      ${periodFilter}
                      ${extraFilters}
                    ORDER BY lead_id, created_at ASC
                )
                SELECT
                    utm_content AS content,
                    utm_source AS source,
                    COUNT(DISTINCT lead_id)::int AS leads,
                    COALESCE(SUM((metadata->'financials'->>'gross')::numeric) FILTER (WHERE metadata->'financials' IS NOT NULL), 0) AS gross_revenue
                FROM first_entries
                GROUP BY content, source
                ORDER BY leads DESC
                LIMIT 10
            `)
        ]);

        res.json({
            period,
            kpis: kpiResult.rows[0],
            by_source: bySourceResult.rows,
            by_medium: byMediumResult.rows,
            by_platform: byPlatformResult.rows,
            by_campaign: byCampaignResult.rows,
            timeline: timelineResult.rows,
            top_content: topContentResult.rows
        });

    } catch (error) {
        console.error('[Analytics] Erro:', error);
        res.status(500).json({ error: 'Erro ao buscar analytics UTM', detail: error.message });
    }
});


/**
 * GET /api/analytics/installments
 * Resumo dos planos de Parcelamento Inteligente (Hotmart)
 */
router.get('/installments', async (req, res) => {
    try {
        const { data: plans, error } = await supabase
            .from('installment_plans')
            .select('*')
            .order('status')
            .order('next_expected_at');

        if (error) throw error;
        const allPlans = plans || [];

        const livePlans = allPlans.filter(p => !p.is_historical);
        const historicalPlans = allPlans.filter(p => p.is_historical);
        const activePlans = allPlans.filter(p => p.status === 'active');
        const liveActive = livePlans.filter(p => p.status === 'active');
        const histActive = historicalPlans.filter(p => p.status === 'active');

        const sumGross = (arr) => arr.reduce((acc, p) => {
            const rem = (p.total_installments - p.installments_paid);
            return acc + (rem * (p.gross_installment_value || 0));
        }, 0);
        const sumNet = (arr) => arr.reduce((acc, p) => {
            const rem = (p.total_installments - p.installments_paid);
            return acc + (rem * (p.net_installment_value || 0));
        }, 0);
        const revenueNextDays = (days) => {
            const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            return activePlans
                .filter(p => p.next_expected_at && new Date(p.next_expected_at) <= cutoff)
                .reduce((acc, p) => acc + (p.gross_installment_value || 0), 0);
        };

        const byProduct = {};
        for (const p of activePlans) {
            const key = p.product_name || 'Desconhecido';
            if (!byProduct[key]) byProduct[key] = { product: key, active_plans: 0, gross_monthly: 0, gross_remaining: 0, net_remaining: 0 };
            byProduct[key].active_plans++;
            byProduct[key].gross_monthly += (p.gross_installment_value || 0);
            const rem = p.total_installments - p.installments_paid;
            byProduct[key].gross_remaining += rem * (p.gross_installment_value || 0);
            byProduct[key].net_remaining += rem * (p.net_installment_value || 0);
        }

        const plansList = allPlans.map(p => {
            const remaining = p.total_installments - p.installments_paid;
            return {
                id: p.id, lead_uuid: p.lead_uuid, lead_name: p.lead_name,
                lead_email: p.lead_email, product: p.product_name, platform: p.platform,
                progress: `${p.installments_paid}/${p.total_installments}`,
                installments_paid: p.installments_paid, total_installments: p.total_installments,
                installments_remaining: remaining,
                gross_monthly: p.gross_installment_value, net_monthly: p.net_installment_value,
                gross_remaining: +(remaining * (p.gross_installment_value || 0)).toFixed(2),
                net_remaining: +(remaining * (p.net_installment_value || 0)).toFixed(2),
                currency: p.currency, has_coproduction: p.has_coproduction, status: p.status,
                first_payment_at: p.first_payment_at, next_expected_at: p.next_expected_at,
                is_historical: p.is_historical, migration_source: p.migration_source
            };
        });

        res.json({
            live_summary: {
                note: 'Planos ao vivo � metricas confiaveis',
                total_plans: livePlans.length,
                active_plans: liveActive.length,
                completed_plans: livePlans.filter(p => p.status === 'completed').length,
                gross_expected_total: +sumGross(liveActive).toFixed(2),
                net_expected_total: +sumNet(liveActive).toFixed(2)
            },
            historical_summary: {
                note: 'Migrados do CSV � rastreamento apenas, nao entram em metricas',
                total_plans: historicalPlans.length,
                active_plans: histActive.length,
                completed_plans: historicalPlans.filter(p => p.status === 'completed').length,
                gross_expected_total: +sumGross(histActive).toFixed(2),
                net_expected_total: +sumNet(histActive).toFixed(2)
            },
            revenue_forecast: {
                next_30_days: +revenueNextDays(30).toFixed(2),
                next_60_days: +revenueNextDays(60).toFixed(2),
                next_90_days: +revenueNextDays(90).toFixed(2),
                total_remaining_gross: +sumGross(activePlans).toFixed(2),
                total_remaining_net: +sumNet(activePlans).toFixed(2)
            },
            by_product: Object.values(byProduct).sort((a, b) => b.gross_remaining - a.gross_remaining),
            plans: plansList
        });
    } catch (error) {
        console.error('Erro ao buscar installments analytics:', error);
        res.status(500).json({ error: 'Erro ao buscar dados de parcelamentos', detail: error.message });
    }
});

export default router;
