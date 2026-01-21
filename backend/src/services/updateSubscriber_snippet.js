/**
 * Update a subscriber
 */
export async function updateSubscriber(subscriberId, data, apiToken) {
    try {
        console.log(`🆙 Updating subscriber ${subscriberId}:`, JSON.stringify(data));
        const response = await axios.post(`${MANYCHAT_API_BASE}/fb/subscriber/updateSubscriber`, {
            subscriber_id: subscriberId,
            ...data
        }, {
            headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' }
        });

        if (response.data && response.data.data) {
            console.log(`✅ Subscriber updated successfully`);
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error('❌ Error updating subscriber:', error.response ? error.response.data : error.message);
        throw error;
    }
}
