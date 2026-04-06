const fetch = require('node-fetch');

async function testKYC() {
    const API_BASE = 'http://localhost:5001';

    // 1. Login first to get session
    console.log('Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@test.com', password: 'password' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    // Get cookies
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Login successful. Cookies:', cookies);

    // 2. Submit KYC
    console.log('Submitting KYC...');
    const kycData = {
        full_name: 'Test User',
        dob: '1990-01-01',
        phone: '1234567890',
        address: '123 Test St',
        id_type: 'PAN',
        id_number: 'ABCDE1234F',
        enrollment_type: 'EMPLOYED',
        remarks: 'Automated Test'
    };

    const kycRes = await fetch(`${API_BASE}/api/kyc/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify(kycData)
    });

    const data = await kycRes.json();
    console.log('KYC Response Status:', kycRes.status);
    console.log('KYC Response Data:', data);
}

testKYC().catch(console.error);
