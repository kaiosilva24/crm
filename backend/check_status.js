async function checkStatus() {
    try {
        const loginRes = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@crm.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        const eventsRes = await fetch('http://localhost:3001/api/cart-abandonment/events?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const eventsData = await eventsRes.json();
        const latestEvent = eventsData.events[0];

        console.log('Latest Event Status:', latestEvent.status);
        console.log('Error Message:', latestEvent.error_message);
        console.log('First Message Sent:', latestEvent.first_message_sent);
        console.log('Contact:', latestEvent.contact_phone);
    } catch (e) {
        console.error('Error:', e);
    }
}
checkStatus();
