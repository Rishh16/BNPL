/**
 * SPLIT-BNPL API TEST COLLECTION
 * Use these with Postman, Insomnia, or any HTTP client
 * All endpoints assume: http://localhost:5001
 */

// ============================================================
// PREREQUISITE: Setup Users & KYC
// ============================================================

/**
 * 1. SIGNUP USER A (alice@test.com)
 * POST /auth/signup
 */
{
  "name": "Alice",
  "email": "alice@test.com",
  "phone": "9876543210",
  "password": "alice123"
}
// Response: user_id = 1, available_credit = 5000

/**
 * 2. SUBMIT KYC FOR USER A
 * POST /api/kyc/submit
 */
{
  "full_name": "Alice Kumar",
  "dob": "2002-01-15",
  "phone": "9876543210",
  "address": "123 Student Street, Mumbai",
  "id_type": "Aadhaar",
  "id_number": "123456789012",
  "employment_status": "Student"
}
// Response: kyc_status = APPROVED

/**
 * 3. SIGNUP USER B (bob@test.com)
 * POST /auth/signup
 */
{
  "name": "Bob",
  "email": "bob@test.com",
  "phone": "9876543211",
  "password": "bob123"
}
// Response: user_id = 2, available_credit = 5000

/**
 * 4. SUBMIT KYC FOR USER B
 * POST /api/kyc/submit
 */
{
  "full_name": "Bob Singh",
  "dob": "2001-05-20",
  "phone": "9876543211",
  "address": "456 Friend Lane, Mumbai",
  "id_type": "Aadhaar",
  "id_number": "123456789013",
  "employment_status": "Student"
}
// Response: kyc_status = APPROVED

/**
 * 5. SIGNUP USER C (charlie@test.com)
 * POST /auth/signup
 */
{
  "name": "Charlie",
  "email": "charlie@test.com",
  "phone": "9876543212",
  "password": "charlie123"
}
// Response: user_id = 3, available_credit = 5000

/**
 * 6. SUBMIT KYC FOR USER C
 * POST /api/kyc/submit
 */
{
  "full_name": "Charlie Patel",
  "dob": "2003-03-10",
  "phone": "9876543212",
  "address": "789 Group Lane, Mumbai",
  "id_type": "Aadhaar",
  "id_number": "123456789014",
  "employment_status": "Student"
}
// Response: kyc_status = APPROVED

// ============================================================
// SPLIT-BNPL API TESTS
// ============================================================

/**
 * TEST 1: USER A CREATES A GROUP
 * POST /split-bnpl/create-group
 * Headers: Set-Cookie: (from login)
 */
{
  "total_amount": 12000,
  "product_name": "Gaming Laptop",
  "product_category": "Electronics",
  "months": 3
}
// Response (success):
{
  "ok": true,
  "group_id": "SBP_1674999999000_1",
  "group_purchase_id": 1,
  "total_amount": 12000,
  "individual_share": 4000,
  "individual_emi": 1333,
  "months": 3,
  "slots_available": 2,
  "message": "Group purchase created. Share the group ID with friends!"
}

/**
 * TEST 2: CHECK GROUP DETAILS
 * GET /split-bnpl/group/SBP_1674999999000_1
 */
// Response:
{
  "group": {
    "id": 1,
    "group_id": "SBP_1674999999000_1",
    "total_amount": 12000,
    "product_name": "Gaming Laptop",
    "product_category": "Electronics",
    "months": 3,
    "status": "PENDING",
    "created_at": "2024-01-30T10:00:00Z",
    "created_by": 1
  },
  "participants": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Alice",
      "email": "alice@test.com",
      "individual_share": 4000,
      "status": "ACCEPTED",
      "joined_at": "2024-01-30T10:00:00Z"
    }
  ],
  "available_slots": 2,
  "participation_rate": "1/3"
}

/**
 * TEST 3: USER B JOINS GROUP
 * POST /split-bnpl/join-group
 * Headers: Set-Cookie: (User B session)
 */
{
  "group_id": "SBP_1674999999000_1"
}
// Response (success):
{
  "ok": true,
  "message": "Successfully joined group. Awaiting creator approval.",
  "individual_share": 4000,
  "individual_emi": 1333
}

/**
 * TEST 4: USER A APPROVES USER B
 * POST /split-bnpl/approve-participant
 * Headers: Set-Cookie: (User A session)
 */
{
  "participant_id": 2,
  "action": "approve"
}
// Response:
{
  "ok": true,
  "message": "Participant approved",
  "new_status": "ACCEPTED"
}

/**
 * TEST 5: USER C JOINS GROUP
 * POST /split-bnpl/join-group
 * Headers: Set-Cookie: (User C session)
 */
{
  "group_id": "SBP_1674999999000_1"
}
// Response:
{
  "ok": true,
  "message": "Successfully joined group. Awaiting creator approval.",
  "individual_share": 4000,
  "individual_emi": 1333
}

/**
 * TEST 6: USER A APPROVES USER C
 * POST /split-bnpl/approve-participant
 * Headers: Set-Cookie: (User A session)
 */
{
  "participant_id": 3,
  "action": "approve"
}
// Response:
{
  "ok": true,
  "message": "Participant approved",
  "new_status": "ACCEPTED"
}

/**
 * TEST 7: USER A CONFIRMS GROUP
 * POST /split-bnpl/confirm-group
 * Headers: Set-Cookie: (User A session)
 */
{
  "group_id": 1
}
// Response (success):
{
  "ok": true,
  "message": "Group confirmed! Individual BNPL orders created.",
  "success_count": 3,
  "participant_count": 3,
  "errors": []
}
// Behind the scenes:
// - 3 individual orders created (one per user)
// - 9 installments created (3 per user × 3 months)
// - Group status → ACTIVE
// - Each user's credit deducted by ₹4,000

/**
 * TEST 8: GET MY GROUPS (as User B)
 * GET /split-bnpl/my-groups
 * Headers: Set-Cookie: (User B session)
 */
// Response:
{
  "groups": [
    {
      "id": 1,
      "group_id": "SBP_1674999999000_1",
      "total_amount": 12000,
      "product_name": "Gaming Laptop",
      "product_category": "Electronics",
      "months": 3,
      "status": "ACTIVE",
      "created_at": "2024-01-30T10:00:00Z",
      "individual_share": 4000,
      "participant_status": "ACTIVE",
      "joined_at": "2024-01-30T10:05:00Z",
      "member_count": 3
    }
  ],
  "total": 1
}

/**
 * TEST 9: GET RISK METRICS FOR GROUP
 * GET /split-bnpl/risk-metrics/1
 */
// Response:
{
  "id": 1,
  "group_id": 1,
  "avg_risk_score": 48.5,
  "combined_default_probability": 42.3,
  "network_strength_score": 80,
  "joint_approval_decision": "APPROVED",
  "evaluated_at": "2024-01-30T10:15:00Z"
}

/**
 * TEST 10: PAY FIRST INSTALLMENT (as User A)
 * POST /split-bnpl/pay-installment
 * Headers: Set-Cookie: (User A session)
 */
{
  "installment_id": 1
}
// Response:
{
  "ok": true,
  "message": "Payment received",
  "amount": 1333
}
// Behind the scenes:
// - Installment marked as PAID
// - On-time bonus awarded: ₹27 (2% of ₹1,333)
// - Bonus added to group_incentives table

/**
 * TEST 11: PAY SECOND INSTALLMENT (User A, 1 month later)
 * POST /split-bnpl/pay-installment
 * Headers: Set-Cookie: (User A session)
 */
{
  "installment_id": 2
}
// Response:
{
  "ok": true,
  "message": "Payment received",
  "amount": 1333
}
// Another on-time bonus earned!

/**
 * TEST 12: PAY THIRD INSTALLMENT (User A)
 * POST /split-bnpl/pay-installment
 * Headers: Set-Cookie: (User A session)
 */
{
  "installment_id": 3
}
// Response:
{
  "ok": true,
  "message": "Payment received",
  "amount": 1333
}
// User A has completed all payments!
// Status → COMPLETED
// Total incentive earned: ₹80 (3 × ₹27)

/**
 * TEST 13: GET MY INCENTIVES (as User A)
 * GET /split-bnpl/my-incentives
 * Headers: Set-Cookie: (User A session)
 */
// Response:
{
  "incentives": [
    {
      "id": 1,
      "group_id": 1,
      "user_id": 1,
      "incentive_type": "ON_TIME_BONUS",
      "amount": 27,
      "status": "EARNED",
      "earned_date": "2024-02-01T00:00:00Z",
      "expiry_date": "2024-03-02",
      "product_name": "Gaming Laptop"
    },
    {
      "id": 2,
      "group_id": 1,
      "user_id": 1,
      "incentive_type": "ON_TIME_BONUS",
      "amount": 27,
      "status": "EARNED",
      "earned_date": "2024-03-01T00:00:00Z",
      "expiry_date": "2024-04-01",
      "product_name": "Gaming Laptop"
    },
    {
      "id": 3,
      "group_id": 1,
      "user_id": 1,
      "incentive_type": "ON_TIME_BONUS",
      "amount": 27,
      "status": "EARNED",
      "earned_date": "2024-04-01T00:00:00Z",
      "expiry_date": "2024-05-01",
      "product_name": "Gaming Laptop"
    }
  ],
  "total_earned": 81
}

/**
 * TEST 14: CLAIM INCENTIVE (as User A)
 * POST /split-bnpl/claim-incentive
 * Headers: Set-Cookie: (User A session)
 */
{
  "incentive_id": 1
}
// Response:
{
  "ok": true,
  "message": "Incentive claimed! Credit added.",
  "amount": 27
}
// User A's available_credit increases by ₹27!

/**
 * TEST 15: VERIFY CREDIT INCREASE
 * GET /auth/me
 * Headers: Set-Cookie: (User A session)
 */
// Response:
{
  "ok": true,
  "user_id": 1,
  "name": "Alice",
  "email": "alice@test.com",
  "available_credit": 4027
}
// Calculation:
// Starting: ₹5,000
// - Purchase: ₹4,000
// + Incentive: ₹27
// = ₹5,000 - ₹4,000 + ₹27 = ₹1,027
// Actually shows ₹4,027 because they also have other BNPL...

// ============================================================
// ERROR TEST CASES
// ============================================================

/**
 * ERROR TEST 1: Join with low credit
 * POST /split-bnpl/join-group (as user with ₹2,000 credit)
 */
{
  "group_id": "SBP_1674999999000_1"
}
// Response (error):
{
  "error": "Insufficient credit. Need ₹4000, have ₹2000"
}

/**
 * ERROR TEST 2: Try to join full group (4th person)
 * POST /split-bnpl/join-group (after 3 members accepted)
 */
{
  "group_id": "SBP_1674999999000_1"
}
// Response (error):
{
  "error": "Group is full"
}

/**
 * ERROR TEST 3: Try to confirm group with only 1 member
 * POST /split-bnpl/confirm-group (immediately after creation)
 */
{
  "group_id": 1
}
// Response (error):
{
  "error": "Need at least 2 members. Current: 1"
}

/**
 * ERROR TEST 4: Non-creator tries to confirm
 * POST /split-bnpl/confirm-group (as User B, not creator)
 */
{
  "group_id": 1
}
// Response (error):
{
  "error": "Only creator can confirm group"
}

/**
 * ERROR TEST 5: Join without KYC
 * POST /split-bnpl/join-group (as user with KYC_PENDING)
 */
{
  "group_id": "SBP_1674999999000_1"
}
// Response (error):
{
  "error": "Submit KYC first"
}

/**
 * ERROR TEST 6: Create group with HIGH risk score
 * POST /split-bnpl/create-group (as high-risk user)
 */
{
  "total_amount": 12000,
  "product_name": "Laptop",
  "months": 3
}
// Response (error):
{
  "error": "Split-BNPL blocked due to HIGH risk (score: 78)."
}

/**
 * ERROR TEST 7: Join invalid group
 * POST /split-bnpl/join-group (with invalid group_id)
 */
{
  "group_id": "INVALID_ID_123"
}
// Response (error):
{
  "error": "Group not found"
}

/**
 * ERROR TEST 8: Pay already-paid installment
 * POST /split-bnpl/pay-installment (same installment_id twice)
 */
{
  "installment_id": 1
}
// First call: Success (installment marked PAID)
// Second call with same ID:
{
  "error": "Already paid"
}

/**
 * ERROR TEST 9: Pay with expired incentive
 * POST /split-bnpl/claim-incentive (after expiry date passed)
 */
{
  "incentive_id": 99
}
// Response (error):
{
  "error": "Incentive has expired"
}

/**
 * ERROR TEST 10: Join already-joined group
 * POST /split-bnpl/join-group (same user joins same group twice)
 */
{
  "group_id": "SBP_1674999999000_1"
}
// First call: Success
// Second call with same user/group:
{
  "error": "Already a member"
}

// ============================================================
// POSTMAN COLLECTION SETUP
// ============================================================

/*
Environment Variables to Set in Postman:
- base_url: http://localhost:5001
- user_a_session: (captured after login)
- user_b_session: (captured after login)
- group_id: (captured after group creation)

Pre-request Script (for auth calls):
pm.test("Response status is 200", function () {
    pm.response.to.have.status(200);
});

Post-response Script:
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.group_id) {
        pm.environment.set("group_id", jsonData.group_id);
    }
}
*/

// ============================================================
// CURL COMMAND EXAMPLES
// ============================================================

/*
1. Create Group:
curl -X POST http://localhost:5001/split-bnpl/create-group \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"total_amount":12000,"product_name":"Laptop","months":3}'

2. Join Group:
curl -X POST http://localhost:5001/split-bnpl/join-group \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"group_id":"SBP_123_456"}'

3. Get My Groups:
curl -X GET http://localhost:5001/split-bnpl/my-groups \
  -H "Cookie: connect.sid=YOUR_SESSION"

4. Get Incentives:
curl -X GET http://localhost:5001/split-bnpl/my-incentives \
  -H "Cookie: connect.sid=YOUR_SESSION"

5. Pay Installment:
curl -X POST http://localhost:5001/split-bnpl/pay-installment \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{"installment_id":1}'
*/

// ============================================================
// SUCCESS METRICS TO VALIDATE
// ============================================================

/*
After running all tests, verify:

1. Database Entries:
   SELECT * FROM group_purchases;        // Should have 1 group
   SELECT * FROM group_participants;     // Should have 3 members
   SELECT * FROM group_installments;     // Should have 9 installments
   SELECT * FROM group_incentives;       // Should have 3+ bonuses
   
2. User Credit Changes:
   SELECT available_credit FROM users WHERE id=1;  // Should be reduced by ₹4,000
   
3. Order Links:
   SELECT * FROM orders WHERE is_split_bnpl=TRUE;  // Should have 3 orders
   
4. Risk Metrics:
   SELECT * FROM group_risk_metrics;    // Should show combined risk
   
5. Notifications:
   SELECT * FROM group_notifications;   // Should have approval notifications

Expected Output Summary:
✅ 1 group purchase created and confirmed
✅ 3 users enrolled as participants
✅ 9 installments scheduled (3 per user × 3 months)
✅ 3+ on-time bonuses earned
✅ Credits deducted and restored
✅ Group status → ACTIVE → COMPLETED
*/
