const express = require("express");
const router = express.Router();
const db = require("../db");

/* ===========================
   SIGNUP API
   New users start with ₹5000 credit
=========================== */
router.post("/signup", (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    db.query(
      "INSERT INTO users (name, email, phone, password, available_credit) VALUES (?, ?, ?, ?, 5000)",
      [name, email, phone, password],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // auto login after signup
        req.session.user_id = result.insertId;
        req.session.user_name = name;

        console.log(`✅ [SESSION] User ${result.insertId} (${name}) logged in via SIGNUP`);

        req.session.save((err) => {
          if (err) console.error("❌ Session Save Error:", err);
          res.json({
            ok: true,
            message: "Signup successful",
            user_id: result.insertId,
            name,
            available_credit: 5000
          });
        });
      }
    );
  });
});

/* ===========================
   LOGIN API
=========================== */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  db.query(
    "SELECT id, name, password, available_credit, is_blocked FROM users WHERE email = ?",
    [email],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = rows[0];
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid password" });
      }

      if (user.is_blocked) {
        return res.status(403).json({ error: "Your account is blocked. Please contact support." });
      }

      req.session.user_id = user.id;
      req.session.user_name = user.name;

      console.log(`✅ [SESSION] User ${user.id} (${user.name}) logged in via LOGIN`);

      req.session.save((err) => {
        if (err) console.error("❌ Session Save Error:", err);
        res.json({
          ok: true,
          message: "Login success",
          user_id: user.id,
          name: user.name,
          available_credit: user.available_credit
        });
      });
    }
  );
});

/* ===========================
   LOGOUT API
=========================== */
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true, message: "Logged out" });
  });
});

/* ===========================
   GET LOGGED-IN USER
   ✅ THIS FIXES ₹undefined
=========================== */
router.get("/me", (req, res) => {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: "Not logged in" });
  }

  db.query(
    "SELECT id, name, available_credit, consecutive_on_time_payments FROM users WHERE id = ?",
    [req.session.user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "User not found" });

      const u = rows[0];
      res.json({
        ok: true,
        id: u.id,
        name: u.name,
        available_credit: Number(u.available_credit ?? 5000),
        streak: Number(u.consecutive_on_time_payments ?? 0),
        isAdmin: !!req.session.isAdmin
      });
    }
  );
});

module.exports = router;
