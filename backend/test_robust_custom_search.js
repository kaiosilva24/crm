import axios from 'axios';
import { supabase } from './src/database/supabase.js';

const MANYCHAT_API_BASE = 'https://api.manychat.com';

async function testCustomFieldSearch() {
    console.log('=== TESTING CUSTOM FIELD SEARCH (UPDATED API) ===\n');
    const { data: settings } = await supabase.from('cart_abandonment_settings').select('*').single();
    const token = settings.manychat_api_token;

    const phoneFieldId = 12655372; // Custom Field "phone"

    // Test different formats
    const formats = [
        '5567981720357',
        '+5567981720357',
        '67981720357'
    ];

    for (const phone of formats) {
        console.log(`\nTrying Custom Field search with: "${phone}"`);
        try {
            const response = await axios.get(`${MANYCHAT_API_BASE}/fb/subscriber/findByCustomField`, {
                params: {
                    field_id: phoneFieldId,
                    field_value: phone
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.data) {
                console.log('✅ FOUND!');
                const sub = response.data.data;
                if (sub.id) {
                    console.log(`  Subscriber ID: ${sub.id}`);
                    console.log(`  Name: ${sub.first_name} ${sub.last_name}`);

                    // Now try to apply tag
                    console.log('\n  Testing tag application...');
                    try {
                        await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/addTag`, {
                            subscriber_id: sub.id,
                            tag_id: 13968648 // Get actual tag ID first
                        }, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        console.log('  ✅ Tag applied successfully!');
                    } catch (tagError) {
                        console.log(`  ❌ Tag failed: ${tagError.response?.data?.message || tagError.message}`);
                    }

                    return; // Found it, stop searching
                }
            } else {
                console.log('❌ Not found');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.response?.status || error.message}`);
            if (error.response?.data) {
                console.log(`   Details: ${JSON.stringify(error.response.data)}`);
            }
        }
    }
}

testCustomFieldSearch();
