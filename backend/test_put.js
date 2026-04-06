const http = require('http');

const data = JSON.stringify({
    webhook_config_id: "",
    manychat_api_token: "test_token",
    manychat_tag_name: "test_tag",
    is_enabled: true,
    campaign_id: 191, // just some number
    prepend_number: "55",
    custom_name: "test name"
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/manychat/settings',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test' // Auth might fail. Wait, it needs a valid token.
    }
}, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
