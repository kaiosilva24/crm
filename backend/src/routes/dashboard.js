/**
 * Dashboard Routes - Supabase Version (OPTIMIZED)
 */

import { Router } from 'express';
import { db, supabase } from '../database/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/dashboard
 */
router.get('/', async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const sellerId = isAdmin ? null : req.user.id;
        const { campaign_id, subcampaign_id } = req.query;

        // Base filters helper
        // Se tem subcampaign_id: filtra pela subcampanha específica
        // Se tem campaign_id mas não subcampaign_id: mostra TODOS os leads da campanha (incluindo com subcampanha)
        // Assim as conversões (sale_completed) aparecem na campanha original
        const applyFilters = (query) => {
            if (sellerId) query = query.eq('seller_id', sellerId);
            if (campaign_id) query = query.eq('campaign_id', parseInt(campaign_id));
            if (subcampaign_id) {
                query = query.eq('subcampaign_id', parseInt(subcampaign_id));
            }
            // Nota: não excluímos mais leads com subcampanha da campanha original
            // para que as conversões (sale_completed) continuem contando
            return query;
        };

        // Buscar statuses primeiro (precisamos para várias queries)
        const { data: statuses } = await supabase.from('lead_statuses').select('*').order('display_order');

        // Helper para início do dia em Brasília (UTC-3)
        const getBrasiliaStartOfDay = () => {
            const now = new Date();
            const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(now);
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            // Criar Data ISO com offset UTC-3 (Padrão Brasília sem horário de verão)
            return new Date(`${year}-${month}-${day}T00:00:00.000-03:00`).toISOString();
        };

        const todayStart = getBrasiliaStartOfDay();

        // Executar TODAS as queries em paralelo
        const [
            totalResult,
            todayResult,
            checkingResult,
            salesResult,
            inGroupResult,
            outGroupResult,
            checkInCompletedResult,
            checkInPendingResult,
            inGroupTodayResult,
            checkInCompletedTodayResult,
            recentResult,
            sellersResult,
            ...statusCounts
        ] = await Promise.all([
            // Total de leads
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true })),

            // Leads de hoje (Brasília)
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', todayStart)),


            // Checking
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('checking', true)),

            // Vendas concluídas
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('sale_completed', true)),

            // In group - Raw SQL optimization
            (async () => {
                let sql = `SELECT COUNT(DISTINCT l.id) as count FROM leads l INNER JOIN lead_campaign_groups lcg ON l.id = lcg.lead_id WHERE lcg.in_group = true`;
                const params = [];
                if (campaign_id) { params.push(parseInt(campaign_id)); sql += ` AND l.campaign_id = $${params.length} AND lcg.campaign_id = $${params.length}`; }
                if (subcampaign_id) { params.push(parseInt(subcampaign_id)); sql += ` AND l.subcampaign_id = $${params.length}`; }
                if (sellerId) { params.push(sellerId); sql += ` AND l.seller_id = $${params.length}`; }
                const res = await supabase._pool.query(sql, params);
                return { count: parseInt(res.rows[0].count, 10) };
            })(),

            // Out group - Raw SQL optimization
            (async () => {
                let sql = `SELECT COUNT(DISTINCT l.id) as count FROM leads l WHERE NOT EXISTS (SELECT 1 FROM lead_campaign_groups lcg WHERE lcg.lead_id = l.id AND lcg.in_group = true`;
                if (campaign_id) { sql += ` AND lcg.campaign_id = ${parseInt(campaign_id)}`; }
                sql += `)`;
                const params = [];
                if (campaign_id) { params.push(parseInt(campaign_id)); sql += ` AND l.campaign_id = $${params.length}`; }
                if (subcampaign_id) { params.push(parseInt(subcampaign_id)); sql += ` AND l.subcampaign_id = $${params.length}`; }
                if (sellerId) { params.push(sellerId); sql += ` AND l.seller_id = $${params.length}`; }
                const res = await supabase._pool.query(sql, params);
                return { count: parseInt(res.rows[0].count, 10) };
            })(),

            // Check-in completed
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('checking', true)),

            // Check-in pending (false or null)
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).or('checking.eq.false,checking.is.null')),

            // DAILY STATS -----------------------------------------------------------------------

            // In Group (Today) - Raw SQL optimization
            (async () => {
                let sql = `SELECT COUNT(DISTINCT l.id) as count FROM leads l INNER JOIN lead_campaign_groups lcg ON l.id = lcg.lead_id WHERE lcg.in_group = true`;
                const params = [];
                if (campaign_id) { params.push(parseInt(campaign_id)); sql += ` AND l.campaign_id = $${params.length} AND lcg.campaign_id = $${params.length}`; }
                if (subcampaign_id) { params.push(parseInt(subcampaign_id)); sql += ` AND l.subcampaign_id = $${params.length}`; }
                if (sellerId) { params.push(sellerId); sql += ` AND l.seller_id = $${params.length}`; }
                params.push(todayStart); sql += ` AND l.created_at >= $${params.length}`;
                const res = await supabase._pool.query(sql, params);
                return { count: parseInt(res.rows[0].count, 10) };
            })(),

            // Check-in completed (Today)
            applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('checking', true).gte('created_at', todayStart)),

            // Removed explicit outGroupToday and checkInPendingToday queries

            // -----------------------------------------------------------------------------------

            // Recent leads - Raw SQL optimization
            (async () => {
                let sql = `
                    SELECT l.uuid, l.first_name, l.product_name, s.name as status_name, s.color as status_color 
                    FROM leads l 
                    LEFT JOIN lead_statuses s ON l.status_id = s.id 
                    WHERE 1=1
                `;
                const params = [];
                if (sellerId) { params.push(sellerId); sql += ` AND l.seller_id = $${params.length}`; }
                if (campaign_id) { params.push(parseInt(campaign_id)); sql += ` AND l.campaign_id = $${params.length}`; }
                if (subcampaign_id) { params.push(parseInt(subcampaign_id)); sql += ` AND l.subcampaign_id = $${params.length}`; }
                sql += ` ORDER BY l.created_at DESC LIMIT 5`;
                const res = await supabase._pool.query(sql, params);
                return { data: res.rows.map(r => ({
                    uuid: r.uuid,
                    first_name: r.first_name,
                    product_name: r.product_name,
                    lead_statuses: { name: r.status_name, color: r.status_color }
                }))};
            })(),

            // Sellers
            supabase.from('users').select('id, name').eq('role', 'seller').eq('is_active', true),

            // Count por status (paralelo)
            ...(statuses || []).map(status =>
                applyFilters(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status_id', status.id))
            )
        ]);

        const totalLeads = totalResult.count || 0;
        const todayLeads = todayResult.count || 0;
        const totalChecking = checkingResult.count || 0;
        const totalSales = salesResult.count || 0;
        const inGroup = inGroupResult.count || 0;
        const outGroup = outGroupResult.count || 0;
        const checkInCompleted = checkInCompletedResult.count || 0;
        const checkInPending = checkInPendingResult.count || 0;

        // New Daily Stats Variables (Calculated)
        const inGroupToday = inGroupTodayResult.count || 0;
        const checkInCompletedToday = checkInCompletedTodayResult.count || 0;

        // Calculate missing daily components to ensure sum matches todayLeads
        const outGroupToday = Math.max(0, todayLeads - inGroupToday);
        const checkInPendingToday = Math.max(0, todayLeads - checkInCompletedToday);



        const recentLeads = recentResult.data || [];
        const sellers = sellersResult.data || [];

        // Processar status counts + buscar leads com subcampanha que tinham esse status
        // APENAS quando não está filtrando por subcampanha específica
        let conversions = 0;
        let pendingLeads = 0;

        let statusExtraCounts = [];

        // Só busca previous_status_id se NÃO está filtrando por subcampanha específica
        if (!subcampaign_id) {
            const statusExtraCountsQueries = (statuses || []).map(async (status) => {
                let q = supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .not('subcampaign_id', 'is', null)
                    .eq('previous_status_id', status.id);

                if (sellerId) q = q.eq('seller_id', sellerId);
                if (campaign_id) q = q.eq('campaign_id', parseInt(campaign_id));

                const { count } = await q;
                return count || 0;
            });

            statusExtraCounts = await Promise.all(statusExtraCountsQueries);
        }

        const byStatus = (statuses || []).map((status, i) => {
            const baseCount = statusCounts[i]?.count || 0;
            const extraCount = statusExtraCounts[i] || 0;
            const totalCount = baseCount + extraCount;

            if (status.is_conversion) conversions += totalCount;
            if (status.name === 'Novo' || status.name === 'Em Contato' || status.name === 'novo') pendingLeads += totalCount;
            return { name: status.name, color: status.color, count: totalCount };
        });

        // conversionStatusIds usado abaixo
        const conversionStatusIds = (statuses || []).filter(s => s.is_conversion).map(s => s.id);

        // Format recent leads
        const recentLeadsFormatted = recentLeads.map(l => ({
            uuid: l.uuid,
            first_name: l.first_name,
            product_name: l.product_name,
            status_name: l.lead_statuses?.name,
            status_color: l.lead_statuses?.color
        }));

        // Buscar performance das vendedoras em paralelo
        // conversionStatusIds já foi declarado acima

        const sellerPerformance = await Promise.all(sellers.map(async (seller) => {
            // Apply campaign filters to seller performance queries
            let totalQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('seller_id', seller.id);
            let convQuery = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('seller_id', seller.id);

            // Apply campaign_id filter if present
            if (campaign_id) {
                totalQuery = totalQuery.eq('campaign_id', parseInt(campaign_id));
                convQuery = convQuery.eq('campaign_id', parseInt(campaign_id));
            }

            // Apply subcampaign_id filter if present
            if (subcampaign_id) {
                totalQuery = totalQuery.eq('subcampaign_id', parseInt(subcampaign_id));
                convQuery = convQuery.eq('subcampaign_id', parseInt(subcampaign_id));
            }

            const [totalRes, convRes] = await Promise.all([
                totalQuery,
                conversionStatusIds.length > 0
                    ? convQuery.in('status_id', conversionStatusIds)
                    : Promise.resolve({ count: 0 })
            ]);
            return {
                id: seller.id,
                name: seller.name,
                total_leads: totalRes.count || 0,
                conversions: convRes.count || 0
            };
        }));

        const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : '0';

        res.json({
            summary: {
                totalLeads,
                today: todayLeads,
                totalConversions: conversions,
                conversions,
                pendingLeads,
                conversionRate,
                totalChecking,
                totalSales,
                inGroup,
                outGroup,
                checkInCompleted,
                checkInPending,
                // Add daily stats to response
                inGroupToday,
                outGroupToday,
                checkInCompletedToday,
                checkInPendingToday
            },
            byStatus,
            recentLeads: recentLeadsFormatted,
            sellerPerformance
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
});

export default router;
