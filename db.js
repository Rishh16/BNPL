const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite file
const dbPath = path.resolve(__dirname, 'bnpl_db.sqlite');
const dbConnection = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite Connection Error:', err.message);
  } else {
    console.log('✅ SQLite Database Connected');
    // Enable Foreign Keys
    dbConnection.run("PRAGMA foreign_keys = ON");
  }
});

// Wrapper to mimic mysql2 pool.query interface: query(sql, params, callback)
const db = {
  query: function (sql, params, callback) {
    // Handle optional params
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    if (typeof callback !== 'function') {
      callback = () => { };
    }

    // Convert '?' to '$n' or just handle array params properly for sqlite3
    // sqlite3 supports '?' placeholders, so we just need to pass params array.

    // Determine if it's a SELECT (all rows) or INSERT/UPDATE (run)
    const method = sql.trim().toUpperCase().startsWith('SELECT') ? 'all' : 'run';

    if (method === 'all') {
      dbConnection.all(sql, params, function (err, rows) {
        if (err) {
          console.error("❌ SQL ERROR (all):", err.message);
          console.error("📄 QUERY:", sql);
          console.error("📦 PARAMS:", JSON.stringify(params));
          return callback(err, null);
        }
        callback(null, rows);
      });
    } else {
      dbConnection.run(sql, params, function (err) {
        if (err) {
          console.error("❌ SQL ERROR (run):", err.message);
          console.error("📄 QUERY:", sql);
          console.error("📦 PARAMS:", JSON.stringify(params));
          return callback(err, null);
        }
        // mimic mysql2 result object
        const result = {
          insertId: this.lastID,
          affectedRows: this.changes
        };
        callback(null, result);
      });
    }
  },
  // Mock other pool methods if needed
  getConnection: (cb) => cb(null, dbConnection),
  end: () => dbConnection.close()
};

module.exports = db;