/**
 * Journey Routes - Jornada do Lead
 * Endpoints para consultar e registrar eventos da trajetória de um lead
 */

import { Router } from 'express';
import { db, supabase } from '../database/supabase.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/journey/lead/:leadId
 * Retorna toda a jornada de um lead pelo seu ID interno
 */
router.get('/lead/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;

        // Buscar o lead para obter telefone e email
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, phone, email, first_name')
            .eq('id', parseInt(leadId))
            .single();

        if (leadError || !lead) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        // Buscar eventos da jornada unificados (por telefone OU por lead_id)
        let events = [];

        if (lead.phone && lead.phone.length >= 8) {
            // Buscar por telefone (normalizar para últimos 8 dígitos)
            const phoneEnd = lead.phone.replace(/\D/g, '').slice(-8);

            const { data, error } = await supabase
                .from('lead_journey_events')
                .select('*')
                .or(`lead_id.eq.${lead.id},lead_phone.ilike.%${phoneEnd}`)
                .order('created_at', { ascending: true });

            if (!error) events = data || [];
        } else {
            // Fallback: buscar só por lead_id
            const { data, error } = await supabase
                .from('lead_journey_events')
                .select('*')
                .eq('lead_id', lead.id)
                .order('created_at', { ascending: true });

            if (!error) events = data || [];
        }

        // Remover duplicatas por ID
        const seen = new Set();
        const uniqueEvents = events.filter(e => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });

        res.json({
            lead_id: lead.id,
            lead_name: lead.first_name,
            total_events: uniqueEvents.length,
            events: uniqueEvents
        });
    } catch (error) {
        console.error('Journey GET error:', error);
        res.status(500).json({ error: 'Erro ao buscar jornada do lead' });
    }
});

/**
 * GET /api/journey/phone/:phone
 * Retorna jornada completa por telefone (cross-lead)
 */
router.get('/phone/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const phoneEnd = phone.replace(/\D/g, '').slice(-8);

        const { data, error } = await supabase
            .from('lead_journey_events')
            .select('*')
            .ilike('lead_phone', `%${phoneEnd}`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.json({
            phone,
            total_events: (data || []).length,
            events: data || []
        });
    } catch (error) {
        console.error('Journey phone GET error:', error);
        res.status(500).json({ error: 'Erro ao buscar jornada por telefone' });
    }
});

/**
 * POST /api/journey/event
 * Cria um evento manual na jornada de um lead (ex: nota, contato manual)
 * Restrito a admin
 */
router.post('/event', authorize('admin'), async (req, res) => {
    try {
        const {
            lead_id,
            event_type,
            event_label,
            campaign_id,
            seller_id,
            status_id,
            metadata
        } = req.body;

        if (!lead_id || !event_type) {
            return res.status(400).json({ error: 'lead_id e event_type são obrigatórios' });
        }

        // Buscar dados do lead
        const { data: lead } = await supabase
            .from('leads')
            .select('id, phone, email, first_name')
            .eq('id', parseInt(lead_id))
            .single();

        if (!lead) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        const event = await db.createJourneyEvent({
            lead_id: lead.id,
            lead_phone: lead.phone,
            lead_email: lead.email,
            event_type,
            event_label: event_label || `Evento manual: ${event_type}`,
            campaign_id: campaign_id || null,
            seller_id: seller_id || null,
            status_id: status_id || null,
            metadata: metadata || null
        });

        res.json({ success: true, event });
    } catch (error) {
        console.error('Journey POST event error:', error);
        res.status(500).json({ error: 'Erro ao criar evento de jornada' });
    }
});

export default router;
