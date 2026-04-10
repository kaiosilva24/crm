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

        // Build base WHERE clause
        let whereBase = interval ? `WHERE lje.created_at >= ${interval}` : 'WHERE 1=1';
        if (utm_source) whereBase += ` AND lje.utm_source = '${utm_source.replace(/'/g, "''")}'`;
        if (platform) whereBase += ` AND lje.metadata->>'platform' = '${platform.replace(/'/g, "''")}'`;

        const [
            kpiResult,
            bySourceResult,
            byMediumResult,
            byPlatformResult,
            byCampaignResult,
            timelineResult,
            topContentResult
        ] = await Promise.all([

            // ── KPIs Financeiros totais ──────────────────────────────────────
            pool.query(`
                SELECT
                    COUNT(DISTINCT lje.id)::int AS total_events,
                    COUNT(DISTINCT lje.lead_id)::int AS total_leads,
                    COALESCE(SUM((lje.metadata->'financials'->>'gross')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS total_gross,
                    COALESCE(SUM((lje.metadata->'financials'->>'net')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS total_net,
                    COUNT(DISTINCT lje.lead_id) FILTER (WHERE lje.metadata->'financials' IS NOT NULL)::int AS vendas_rastreadas,
                    COUNT(DISTINCT lje.lead_id) FILTER (WHERE lje.utm_medium IN ('cpc','paid','cpm','ppc'))::int AS leads_pagos,
                    COUNT(DISTINCT lje.lead_id) FILTER (WHERE lje.utm_medium IN ('organic','organico') OR lje.utm_medium IS NULL)::int AS leads_organicos
                FROM lead_journey_events lje
                ${whereBase}
            `),

            // ── Leads por Source (Top 10) ────────────────────────────────────
            pool.query(`
                SELECT
                    COALESCE(lje.utm_source, 'Direto / Sem UTM') AS source,
                    COUNT(DISTINCT lje.lead_id)::int AS leads,
                    COALESCE(SUM((lje.metadata->'financials'->>'gross')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS gross_revenue,
                    COALESCE(SUM((lje.metadata->'financials'->>'net')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS net_revenue
                FROM lead_journey_events lje
                ${whereBase}
                GROUP BY source
                ORDER BY leads DESC
                LIMIT 10
            `),

            // ── Leads por Medium ─────────────────────────────────────────────
            pool.query(`
                SELECT
                    COALESCE(lje.utm_medium, 'Sem Medium') AS medium,
                    COUNT(DISTINCT lje.lead_id)::int AS leads
                FROM lead_journey_events lje
                ${whereBase}
                GROUP BY medium
                ORDER BY leads DESC
                LIMIT 8
            `),

            // ── Plataformas de Venda ─────────────────────────────────────────
            pool.query(`
                SELECT
                    lje.metadata->>'platform' AS platform,
                    COUNT(DISTINCT lje.lead_id)::int AS vendas,
                    COALESCE(SUM((lje.metadata->'financials'->>'gross')::numeric), 0) AS gross,
                    COALESCE(SUM((lje.metadata->'financials'->>'net')::numeric), 0) AS net
                FROM lead_journey_events lje
                ${whereBase.replace('WHERE', 'WHERE lje.metadata->'+'>'+"'platform' IS NOT NULL AND")}
                AND lje.metadata->'financials' IS NOT NULL
                GROUP BY platform
                ORDER BY vendas DESC
            `),

            // ── Top Campanhas (Top 10) ───────────────────────────────────────
            pool.query(`
                SELECT
                    lje.utm_campaign AS campaign,
                    COUNT(DISTINCT lje.lead_id)::int AS leads,
                    COALESCE(SUM((lje.metadata->'financials'->>'gross')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS gross_revenue
                FROM lead_journey_events lje
                ${whereBase}
                AND lje.utm_campaign IS NOT NULL
                GROUP BY campaign
                ORDER BY leads DESC
                LIMIT 10
            `),

            // ── Timeline diária (Pago vs Orgânico) ──────────────────────────
            pool.query(`
                SELECT
                    DATE(lje.created_at AT TIME ZONE 'America/Sao_Paulo') AS date,
                    COUNT(DISTINCT lje.lead_id)::int AS total,
                    COUNT(DISTINCT lje.lead_id) FILTER (WHERE lje.utm_medium IN ('cpc','paid','cpm','ppc'))::int AS pago,
                    COUNT(DISTINCT lje.lead_id) FILTER (WHERE lje.utm_medium IN ('organic','organico') OR lje.utm_medium IS NULL)::int AS organico,
                    COALESCE(SUM((lje.metadata->'financials'->>'gross')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS revenue
                FROM lead_journey_events lje
                ${whereBase}
                GROUP BY date
                ORDER BY date ASC
            `),

            // ── Top Conteúdos/Anúncios ───────────────────────────────────────
            pool.query(`
                SELECT
                    lje.utm_content AS content,
                    lje.utm_source AS source,
                    COUNT(DISTINCT lje.lead_id)::int AS leads,
                    COALESCE(SUM((lje.metadata->'financials'->>'gross')::numeric) FILTER (WHERE lje.metadata->'financials' IS NOT NULL), 0) AS gross_revenue
                FROM lead_journey_events lje
                ${whereBase}
                AND lje.utm_content IS NOT NULL
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

export default router;
