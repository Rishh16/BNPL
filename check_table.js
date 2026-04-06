const db = require('./db');
db.query("SELECT * FROM pragma_table_info('user_kyc')", (err, rows) => {
    if (err) console.error(err);
    console.log(JSON.stringify(rows, null, 2));
    process.exit();
});
