import { db } from './src/database/supabase.js';

async function run() {
    console.log('Fetching leads...');
    const leadsData = await db.getLeads({ limit: 2 });
    const leads = leadsData.leads;

    if (leads.length < 2) {
        console.error('Not enough leads.');
        process.exit(1);
    }

    const lead1 = leads[0];
    const lead2 = leads[1];

    console.log(`Lead 1: ${lead1.phone}`);
    console.log(`Lead 2: ${lead2.phone}`);

    // Ensure lead2 has a phone
    if (!lead2.phone) {
        console.error('Lead 2 has no phone.');
        process.exit(0);
    }

    console.log(`Updating Lead 1 with Lead 2's phone...`);

    try {
        await db.updateLead(lead1.uuid, { phone: lead2.phone });
        console.log('Update Success (No Constraint)');
    } catch (error) {
        console.error('Update Failed (Constraint Exists)');
        console.error(error);
        if (error.code === '23505') {
            console.log('CONFIRMED: Unique Violation for Phone');
        }
    }
    process.exit(0);
}

run();
