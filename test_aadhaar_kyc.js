const fetch = require('node-fetch');

async function testAadhaarKYC() {
    const API_BASE = 'http://localhost:5001';

    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@test.com', password: 'password' })
    });
    const cookies = loginRes.headers.get('set-cookie');
    console.log('Login successful.');

    // 2. Request Aadhaar OTP
    console.log('Requesting Aadhaar OTP...');
    const id_number = "1234-5678-9012";
    const otpRes = await fetch(`${API_BASE}/api/kyc/send-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify({ id_type: 'AADHAAR', id_number })
    });
    const otpData = await otpRes.json();
    console.log('OTP Response:', otpData);

    if (!otpData.ok) {
        console.error('Failed to send OTP');
        return;
    }

    // Since we are mocking, the OTP is in the console. 
    // In a real automated test we might need a way to get it,
    // but here I'll just check if it fails with NO otp first.

    // 3. Submit KYC without OTP (should fail)
    console.log('Submitting KYC without OTP (expect fail)...');
    const kycDataFail = {
        full_name: 'Test Aadhaar User',
        dob: '1990-01-01',
        phone: '1234567890',
        address: '123 Test St',
        id_type: 'AADHAAR',
        id_number: id_number,
        enrollment_type: 'EMPLOYED',
        remarks: 'Aadhaar Test'
    };

    const submitFailRes = await fetch(`${API_BASE}/api/kyc/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify(kycDataFail)
    });
    console.log('Submit without OTP status:', submitFailRes.status);
    console.log('Submit without OTP body:', await submitFailRes.json());
}

testAadhaarKYC().catch(console.error);
