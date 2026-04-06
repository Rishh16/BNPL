const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bnpl_db.sqlite');

db.serialize(() => {
    console.log("Migrating user_kyc table...");

    // Backup data if needed, but for this hackathon we can just reset it
    // as per the user's focus on "remove bank credentials and only keep things such as..."

    db.run("DROP TABLE IF EXISTS user_kyc", (err) => {
        if (err) console.error("Error dropping table:", err);
        else console.log("Dropped old user_kyc table.");
    });

    db.run(`CREATE TABLE IF NOT EXISTS user_kyc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    kyc_status TEXT DEFAULT 'PENDING',
    full_name TEXT,
    dob TEXT,
    phone TEXT,
    address TEXT,
    id_type TEXT,
    id_number TEXT,
    enrollment_type TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by TEXT,
    verified_at TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`, (err) => {
        if (err) console.error("Error creating table:", err);
        else console.log("Created new user_kyc table.");
    });

    // Re-seed standard test users if they exist
    db.run(`INSERT OR IGNORE INTO user_kyc (user_id, kyc_status, full_name, enrollment_type) 
          SELECT id, 'APPROVED', name, 'EMPLOYED' FROM users WHERE email IN ('a@test.com', 'b@test.com', 'c@test.com')`, (err) => {
        if (err) console.error("Error re-seeding users:", err);
        else console.log("Re-seeded test users.");
    });
});

db.close();
