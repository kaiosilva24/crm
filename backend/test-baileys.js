import { initializeWhatsAppConnection, getActiveConnection } from './src/services/whatsappService.js';
import { supabase } from './src/database/supabase.js';

(async () => {
    try {
        console.log('Restoring connection manually...');
        const { data: conn } = await supabase
            .from('whatsapp_connections')
            .select('id, name')
            .eq('status', 'connected')
            .single();

        if (conn) {
            console.log(`Found connected session in DB: ${conn.name} (${conn.id})`);
            
            try {
                const sock = await initializeWhatsAppConnection(conn.id);
                console.log('Initialize success?', !!sock);

                setTimeout(() => {
                    const activeSock = getActiveConnection(conn.id);
                    console.log('Is it in activeConnections?', !!activeSock);
                    process.exit(0);
                }, 5000);
            } catch (err) {
                console.error('FAILED TO INITIALIZE:', err);
                process.exit(1);
            }
        } else {
            console.log('No connected session found in DB.');
            process.exit(0);
        }
    } catch(err) {
        console.error('Err:', err);
        process.exit(1);
    }
})();
