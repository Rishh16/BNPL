const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('bnpl_db.sqlite');

db.serialize(() => {
    db.all("PRAGMA table_info(user_kyc)", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Schema for user_kyc:', rows);
    });
});

db.close();
