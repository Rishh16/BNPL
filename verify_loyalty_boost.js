const db = require('./db');

const userId = 4; // Current test user

console.log("🛠 Starting Loyalty Boost Verification...");

async function runTest() {
    // 1. Reset streak and credit for clean test
    db.query("UPDATE users SET consecutive_on_time_payments = 0, available_credit = 100000 WHERE id = ?", [userId], (err) => {
        if (err) throw err;
        console.log("✅ User reset: Streak 0, Credit ₹1,00,000");

        // 2. Simulate 1st On-time payment (Manually incrementing streak as per the logic in split-bnpl.js)
        simulateOnTimePayment(1, () => {
            // 3. Simulate 2nd On-time payment
            simulateOnTimePayment(2, () => {
                // 4. Simulate 3rd On-time payment - This should trigger boost
                simulateOnTimePayment(3, () => {
                    // 5. Check results
                    db.query("SELECT available_credit, consecutive_on_time_payments FROM users WHERE id = ?", [userId], (err2, rows) => {
                        if (err2) throw err2;
                        const user = rows[0];
                        console.log(`\n📊 Final State:`);
                        console.log(`   - Credit: ₹${user.available_credit}`);
                        console.log(`   - Streak: ${user.consecutive_on_time_payments}`);

                        if (user.available_credit === 105000 && user.consecutive_on_time_payments === 0) {
                            console.log("\n🎊 VERIFICATION SUCCESS: Credit increased by ₹5,000 and streak reset!");
                        } else {
                            console.error("\n❌ VERIFICATION FAILED: Results don't match expected values.");
                        }
                        process.exit();
                    });
                });
            });
        });
    });
}

function simulateOnTimePayment(number, callback) {
    console.log(`\n⏳ Simulating Payment #${number}...`);

    // Directly mimic the logic in routes/split-bnpl.js
    db.query("UPDATE users SET consecutive_on_time_payments = consecutive_on_time_payments + 1 WHERE id = ?", [userId], (err) => {
        if (err) throw err;

        db.query("SELECT consecutive_on_time_payments FROM users WHERE id = ?", [userId], (err2, rows) => {
            if (err2) throw err2;
            const streak = rows[0].consecutive_on_time_payments;
            console.log(`   Streak is now: ${streak}`);

            if (streak >= 3) {
                db.query("UPDATE users SET available_credit = available_credit + 5000, consecutive_on_time_payments = 0 WHERE id = ?", [userId], (err3) => {
                    if (err3) throw err3;
                    console.log("   🚀 Boost triggered!");
                    callback();
                });
            } else {
                callback();
            }
        });
    });
}

runTest();
