/**
 * Sales Recovery CRM - Backend API
 * Versão Supabase (PostgreSQL na nuvem)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente - caminho relativo para backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Importar cliente Supabase e rotas
import { initializeDatabase } from './database/supabase.js';
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import leadsRoutes from './routes/leads.js';
import usersRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import campaignsRoutes from './routes/campaigns.js';
import subcampaignsRoutes from './routes/subcampaigns.js';
import schedulesRoutes from './routes/schedules.js';
import importsRoutes from './routes/imports.js';
import statusesRoutes from './routes/statuses.js';
import whatsappTemplatesRoutes from './routes/whatsappTemplates.js';
import whatsappGroupsRoutes from './routes/whatsappGroups.js';
import wappiRoutes from './routes/wappi.js';
import groupSyncRoutes from './routes/groupSync.js';
import hotmartRoutes from './routes/hotmart.js';
import exclusionLogsRoutes from './routes/exclusionLogs.js';
import cartAbandonmentRoutes from './routes/cartAbandonment.js';
import manychatRoutes from './routes/manychat.js';
import journeyRoutes from './routes/journey.js';
import analyticsRoutes from './routes/analytics.js';
import { restoreSessions } from './services/whatsappService.js';

const PORT = process.env.PORT || 8080;

// Log da porta fornecida pelo ambiente para debug no Discloud
console.log(`Porta fornecida via ENV: ${process.env.PORT || 'Nenhuma (usando 8080)'}`);

// Inicializar conexão com Supabase
initializeDatabase();

const app = express();

// Configurar CORS para permitir Vercel
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'https://crm-recovery.vercel.app',
    'https://crmsales-recovery-crm-api.onrender.com',
    'https://crm.discloud.app',
    'https://wpp-advanced.discloud.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Verificar se está na lista de origens permitidas
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Permitir qualquer subdomínio do Vercel e Discloud
        if (origin.endsWith('.vercel.app') || origin.endsWith('.discloud.app')) {
            return callback(null, true);
        }

        // Permitir IPs locais (192.168.x.x, 10.x.x.x, 172.x.x.x) para teste mobile
        if (origin.match(/^http:\/\/192\.168\./) || origin.match(/^http:\/\/10\./) || origin.match(/^http:\/\/172\./)) {
            return callback(null, true);
        }

        console.log('❌ CORS bloqueado para:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/ping', (req, res) => res.send('pong')); // Keep-alive endpoint
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/subcampaigns', subcampaignsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/statuses', statusesRoutes);
app.use('/api/whatsapp-templates', whatsappTemplatesRoutes);
app.use('/api/whatsapp-groups', whatsappGroupsRoutes);
app.use('/api/wappi', wappiRoutes);
app.use('/api/group-sync', groupSyncRoutes);
app.use('/api/hotmart', hotmartRoutes);
app.use('/api/exclusion-logs', exclusionLogsRoutes);
app.use('/api/cart-abandonment', cartAbandonmentRoutes);
app.use('/api/manychat', manychatRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/analytics', analyticsRoutes);

// ======== Front-End Integration ========
// Serve os arquivos estáticos do frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Rota de fallback para SPA (Single Page Applications)
// Todas as rotas não /api/ retornam para o index.html da UI
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Inicializar conexão com banco e subir servidor
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 CRM API running on port ${PORT}`);
        console.log(`📦 Database: PostgreSQL (Oracle)`);

        // Restaurar sessões do WhatsApp com delay (evita rate-limit no startup)
        console.log('⏰ Aguardando 10 segundos antes de restaurar sessões...');
        setTimeout(async () => {
            console.log('🔄 Iniciando restauração de sessões WhatsApp e sincronização automática...');
            restoreSessions();

            const { initAutoSync } = await import('./services/autoSyncService.js');
            initAutoSync();
        }, 10000);
    });
}).catch(err => {
    console.error('❌ Falha crítica na inicialização do banco:', err);
    process.exit(1);
});

