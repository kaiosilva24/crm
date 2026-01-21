import axios from 'axios';
import { supabase } from './src/database/supabase.js';
import fs from 'fs';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function checkTags() {
    console.log('Checking "abandono" tags...\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    try {
        const response = await axios.get(`${MANYCHAT_API_BASE}/fb/page/getTags`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tags = response.data.data;
        let output = '';
        if (tags) {
            const filtered = tags.filter(t => t.name.toLowerCase().includes('abandono'));
            if (filtered.length > 0) {
                filtered.forEach(t => {
                    output += `- ID: ${t.id} | Name: "${t.name}"\n`;
                });
            } else {
                output = 'No tags found with name "abandono"';
            }
        }
        fs.writeFileSync('tags_output.txt', output);
        console.log('Done. Check tags_output.txt');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTags();
