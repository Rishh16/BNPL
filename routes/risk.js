// routes/risk.js
const express = require("express");
const router = express.Router();
const db = require("../db");

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function getRiskLevel(score) {
  if (score >= 70) return "LOW";
  if (score >= 40) return "MEDIUM";
  return "HIGH";
}

// ✅ Recalculate + store risk score for logged-in user
router.get("/recalc", requireLogin, (req, res) => {
  const userId = req.session.user_id;

  // KYC
  db.query("SELECT kyc_status FROM user_kyc WHERE user_id=?", [userId], (e1, kycRows) => {
    if (e1) return res.status(500).json({ error: e1.message });

    const kycStatus = (kycRows[0]?.kyc_status || "PENDING").toUpperCase();

    // Overdue installments
    db.query(
      "SELECT COUNT(*) AS overdue_cnt FROM installments i JOIN orders o ON o.id=i.order_id WHERE o.user_id=? AND i.status='OVERDUE'",
      [userId],
      (e2, overRows) => {
        if (e2) return res.status(500).json({ error: e2.message });
        const overdueCnt = Number(overRows[0]?.overdue_cnt || 0);

        // Active orders
        db.query(
          "SELECT COUNT(*) AS active_cnt FROM orders WHERE user_id=? AND status='ACTIVE'",
          [userId],
          (e3, actRows) => {
            if (e3) return res.status(500).json({ error: e3.message });
            const activeCnt = Number(actRows[0]?.active_cnt || 0);

            // Paid vs pending installments
            db.query(
              "SELECT SUM(CASE WHEN i.status='PAID' THEN 1 ELSE 0 END) AS paid_cnt, COUNT(*) AS total_cnt FROM installments i JOIN orders o ON o.id=i.order_id WHERE o.user_id=?",
              [userId],
              (e4, payRows) => {
                if (e4) return res.status(500).json({ error: e4.message });

                const paidCnt = Number(payRows[0]?.paid_cnt || 0);
                const totalCnt = Number(payRows[0]?.total_cnt || 0);

                // =========================
                // ✅ Simple scoring (0..100)
                // =========================
                let score = 50; // start neutral

                // KYC
                if (kycStatus === "APPROVED") score += 25;
                else score -= 20;

                // Overdues are heavy penalty
                score -= overdueCnt * 25;

                // Too many active orders = risk
                score -= Math.max(0, activeCnt - 2) * 10;

                // Payment history bonus
                if (totalCnt > 0) {
                  const ratio = paidCnt / totalCnt; // 0..1
                  score += Math.round(ratio * 20);  // up to +20
                }

                // clamp
                score = Math.max(0, Math.min(100, score));
                const level = getRiskLevel(score);

                // store in users
                db.query(
                  "UPDATE users SET risk_score=?, risk_level=? WHERE id=?",
                  [score, level, userId],
                  (e5) => {
                    if (e5) return res.status(500).json({ error: e5.message });
                    return res.json({ ok: true, risk_score: score, risk_level: level });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
