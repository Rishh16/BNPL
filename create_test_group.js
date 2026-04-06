const db = require('./db');

const groupId = 'SBP_TEST_DRIVE_001';

db.query(
    "INSERT INTO group_purchases (group_id, total_amount, product_name, product_category, purchase_date, months, created_by, status) VALUES (?, 12000, 'Smart TV 32 inch', 'Electronics', DATE('now'), 3, 1, 'PENDING')",
    [groupId],
    (err, result) => {
        if (err) {
            console.error('Error creating group:', err.message);
            process.exit(1);
        }

        const groupPurchaseId = result.insertId;
        console.log('✅ Group Created Successfully:', groupId);

        db.query(
            "INSERT INTO group_participants (group_id, user_id, individual_share, individual_emi, status, kyc_verified, credit_available) VALUES (?, 1, 4000, 1334, 'ACCEPTED', 1, 100000)",
            [groupPurchaseId],
            (err2) => {
                if (err2) {
                    console.error('Error adding creator:', err2.message);
                    process.exit(1);
                }
                console.log('✅ Creator (User A) added to group.');
                process.exit(0);
            }
        );
    }
);
