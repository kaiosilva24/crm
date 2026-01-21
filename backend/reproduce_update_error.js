import { db } from './src/database/supabase.js';

const UUID = '10249796-2e97-44ed-8d12-1229db2c7220';

async function run() {
    console.log(`Attempting to update lead ${UUID}...`);
    try {
        const result = await db.updateLead(UUID, { first_name: 'Teste Debug Error' });
        console.log('Update Success:', result);
    } catch (error) {
        console.error('Update Failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    }
    process.exit(0);
}

run();
