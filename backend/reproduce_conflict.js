import { db } from './src/database/supabase.js';

async function run() {
    console.log('Fetching leads...');
    const leadsData = await db.getLeads({ limit: 2 });
    const leads = leadsData.leads;

    if (leads.length < 2) {
        console.error('Not enough leads to test conflict.');
        process.exit(1);
    }

    const lead1 = leads[0];
    const lead2 = leads[1]; // Target email source

    console.log(`Lead 1: ${lead1.uuid} (${lead1.email})`);
    console.log(`Lead 2: ${lead2.uuid} (${lead2.email})`);

    console.log(`Attempting to update Lead 1 with Lead 2's email...`);

    try {
        await db.updateLead(lead1.uuid, { email: lead2.email });
        console.log('Update Success (Unexpected!)');
    } catch (error) {
        console.error('Update Failed (Expected)!');
        console.error('Error Code:', error.code);
        console.error('Error Details:', error.details);
        console.error('Error Hint:', error.hint);
        if (error.code === '23505') {
            console.log('CONFIRMED: Unique Violation');
        }
    }
    process.exit(0);
}

run();
