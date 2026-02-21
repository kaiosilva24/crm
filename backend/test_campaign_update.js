// Test script to reproduce campaign update error
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';
const campaignUuid = '2f439ae2-1901-4fd1-8980-e2ec0b24ff13';

// You'll need to get a valid token first by logging in
const token = 'YOUR_TOKEN_HERE'; // Replace with actual token

const testData = {
    name: 'ALUNOS AVANÇADO LP07',
    description: 'Notas sobre esta campanha...',
    mirror_campaign_id: null,
    mirror_sales_source_id: 3 // ID of LP-07 FEV26
};

async function testUpdate() {
    try {
        const response = await fetch(`${API_URL}/campaigns/${campaignUuid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error:', response.status, data);
        } else {
            console.log('Success:', data);
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
}

testUpdate();
