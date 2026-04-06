// routes/order.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Must match auth.js / kyc.js session key
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireNotBlocked(req, res, next) {
  const userId = req.session.user_id;
  db.query("SELECT is_blocked FROM users WHERE id=?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length > 0 && rows[0].is_blocked) {
      return res.status(403).json({ error: "Access denied. Your account is blocked." });
    }
    next();
  });
}

// ✅ Block BNPL until KYC approved
function requireKycApproved(req, res, next) {
  const userId = req.session.user_id;

  db.query(
    "SELECT kyc_status FROM user_kyc WHERE user_id=?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) return res.status(403).json({ error: "Submit KYC first" });

      if (rows[0].kyc_status !== "APPROVED") {
        return res.status(403).json({ error: `KYC not approved (${rows[0].kyc_status})` });
      }
      next();
    }
  );
}

// ✅ Risk Gate: HIGH risk => block BNPL
function requireRiskAllowed(req, res, next) {
  const userId = req.session.user_id;

  db.query(
    "SELECT risk_level, risk_score FROM users WHERE id=?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "User not found" });

      const level = (rows[0].risk_level || "MEDIUM").toUpperCase();
      const score = Number(rows[0].risk_score ?? 0);

      // Policy
      if (level === "HIGH") {
        return res.status(403).json({
          error: `BNPL blocked due to HIGH risk (score: ${score}).`
        });
      }

      next();
    }
  );
}

function addMonths(date, m) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + m);
  return d;
}

/**
 * ✅ CREATE BNPL ORDER
 * POST /order/create
 * body: { amount, months, product_name }
 */
router.post("/create", requireLogin, requireNotBlocked, requireKycApproved, requireRiskAllowed, (req, res) => {
  const userId = req.session.user_id;

  // ✅ YOUR DB uses total_amount, but frontend sends amount
  const totalAmount = parseInt(req.body.total_amount ?? req.body.amount, 10);
  const months = parseInt(req.body.months, 10);

  const productName = (req.body.product_name || req.body.productName || "").toString().trim();
  const finalProductName = productName.length ? productName : "BNPL Purchase";
  const purchaseDate = new Date().toISOString().slice(0, 10);

  if (!totalAmount || totalAmount <= 0) return res.status(400).json({ error: "Invalid amount" });
  if (![3, 6, 12].includes(months)) return res.status(400).json({ error: "Invalid months" });

  const emi = Math.ceil(totalAmount / months);

  // 1) check credit
  db.query("SELECT available_credit FROM users WHERE id=?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!rows.length) return res.status(404).json({ error: "User not found" });

    const credit = Number(rows[0].available_credit ?? 0);
    if (credit < totalAmount) return res.status(400).json({ error: "Credit limit exceeded" });

    // 2) insert order ✅ use total_amount + months + monthly_emi
    db.query(
      `INSERT INTO orders (user_id, total_amount, months, monthly_emi, status, product_name, purchase_date)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [userId, totalAmount, months, emi, finalProductName, purchaseDate],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const orderId = result.insertId;

        // 3) generate installments (1st of next month)
        const today = new Date();
        const base = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const values = [];
        for (let i = 1; i <= months; i++) {
          const due = addMonths(base, i - 1).toISOString().slice(0, 10);
          // installments columns: order_id, installment_no, amount, due_date, status
          values.push([orderId, i, emi, due, "PENDING"]);
        }

        // Fix for SQLite: Explicit placeholders for bulk insert
        const placeholders = values.map(() => "(?, ?, ?, ?, ?)").join(", ");
        const flatValues = values.flat();

        db.query(
          `INSERT INTO installments (order_id, installment_no, amount, due_date, status) VALUES ${placeholders}`,
          flatValues,
          (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });

            // 4) reduce credit
            db.query(
              "UPDATE users SET available_credit = available_credit - ? WHERE id=?",
              [totalAmount, userId],
              (err4) => {
                if (err4) return res.status(500).json({ error: err4.message });

                return res.json({
                  ok: true,
                  orderId,
                  product_name: finalProductName,
                  purchase_date: purchaseDate,
                  emi,
                  message: "BNPL order created",
                });
              }
            );
          }
        );
      }
    );
  });
});

/**
 * ✅ ORDER HISTORY (per user)
 * GET /order/history
 */
router.get("/history", requireLogin, (req, res) => {
  const userId = req.session.user_id;

  db.query(
    `SELECT id, product_name, purchase_date, total_amount, months, monthly_emi, status, created_at, is_split_bnpl
     FROM orders
     WHERE user_id=?
     ORDER BY id DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, orders: rows });
    }
  );
});

/**
 * ✅ INSTALLMENTS FOR AN ORDER
 * GET /order/:id/installments
 */
router.get("/:id/installments", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const orderId = parseInt(req.params.id, 10);

  db.query(
    "SELECT id FROM orders WHERE id=? AND user_id=?",
    [orderId, userId],
    (err, chk) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!chk.length) return res.status(404).json({ error: "Order not found" });

      db.query(
        "SELECT id, installment_no, due_date, amount, status FROM installments WHERE order_id=? ORDER BY installment_no",
        [orderId],
        (err2, inst) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ ok: true, installments: inst });
        }
      );
    }
  );
});

/**
 * ✅ PAY INSTALLMENT
 * POST /order/pay-installment
 * body: { installmentId }
 */
router.post("/pay-installment", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const { installmentId } = req.body;

  if (!installmentId) return res.status(400).json({ error: "Installment ID required" });

  // 1) Find installment and check ownership
  db.query(
    `SELECT i.id, i.amount, i.status, o.user_id, o.id as order_id, o.total_amount
     FROM installments i
     JOIN orders o ON i.order_id = o.id
     WHERE i.id = ?`,
    [installmentId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "Installment not found" });

      const inst = rows[0];
      if (inst.user_id !== userId) return res.status(403).json({ error: "Unauthorized access" });
      if (inst.status === "PAID") return res.status(400).json({ error: "Installment already paid" });

      // 2) Update installment status
      db.query(
        "UPDATE installments SET status = 'PAID' WHERE id = ?",
        [installmentId],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          // 3) Restore credit
          db.query(
            "UPDATE users SET available_credit = available_credit + ? WHERE id = ?",
            [inst.amount, userId],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });

              // 4) Check if order is fully paid
              db.query(
                "SELECT COUNT(*) as unpaid FROM installments WHERE order_id = ? AND status != 'PAID'",
                [inst.order_id],
                (err4, countRow) => {
                  if (err4) return res.status(500).json({ error: err4.message });

                  if (countRow[0].unpaid === 0) {
                    db.query("UPDATE orders SET status = 'PAID' WHERE id = ?", [inst.order_id], () => { });
                  }

                  res.json({ ok: true, message: "Installment paid and credit restored!" });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
