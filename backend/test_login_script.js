async function testLogin() {
    try {
        const res = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@crm.com', password: 'admin123' })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', data);
    } catch (e) {
        console.error('Error:', e);
    }
}
testLogin();
