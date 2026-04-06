const express = require("express");
const router = express.Router();
const db = require("../db");

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) next();
    else res.status(401).json({ error: "Unauthorized" });
};

router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin123") {
        req.session.isAdmin = true;
        res.json({ ok: true });
    } else res.status(401).json({ ok: false });
});

router.get("/logout", (req, res) => {
    req.session.isAdmin = false;
    res.json({ ok: true });
});

router.get("/stats", requireAdmin, async (req, res) => {
    try {
        const stats = {
            totalUsers: 0,
            kyc: { APPROVED: 0, PENDING: 0, REJECTED: 0 },
            totalOrders: 0,
            totalDisbursed: 0,
            overdueCount: 0,
            totalOutstanding: 0,
            pendingKyc: 0,
            nearLimit: 0
        };

        const runQuery = (sql) => new Promise((resolve, reject) => {
            db.query(sql, (err, rows) => err ? reject(err) : resolve(rows));
        });

        const [r1, r2, r3, r4, r5, r6] = await Promise.all([
            runQuery("SELECT COUNT(*) as u FROM users"),
            runQuery("SELECT kyc_status as s, COUNT(*) as c FROM user_kyc GROUP BY kyc_status"),
            runQuery("SELECT COUNT(*) as o, SUM(total_amount) as d FROM orders"),
            runQuery("SELECT SUM(CASE WHEN due_date < DATE('now') AND status != 'PAID' THEN 1 ELSE 0 END) as ov, SUM(CASE WHEN status != 'PAID' THEN amount ELSE 0 END) as ot FROM installments"),
            runQuery("SELECT COUNT(*) as p FROM user_kyc WHERE kyc_status='PENDING'"),
            runQuery("SELECT COUNT(*) as l FROM users WHERE available_credit < 500")
        ]);

        stats.totalUsers = r1[0].u || 0;
        r2.forEach(r => { if (stats.kyc[r.s] !== undefined) stats.kyc[r.s] = r.c; });
        stats.totalOrders = r3[0].o || 0;
        stats.totalDisbursed = r3[0].d || 0;
        stats.overdueCount = r4[0].ov || 0;
        stats.totalOutstanding = r4[0].ot || 0;
        stats.pendingKyc = r5[0].p || 0;
        stats.nearLimit = r6[0].l || 0;

        res.json({ ok: true, stats });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/users", requireAdmin, (req, res) => {
    db.query("SELECT u.*, k.kyc_status FROM users u LEFT JOIN user_kyc k ON u.id = k.user_id", (e, rows) => {
        res.json({ ok: true, users: rows });
    });
});

router.post("/user/:id/update", requireAdmin, (req, res) => {
    const { available_credit, risk_level, is_blocked, is_flagged, flag_reason } = req.body;
    db.query("UPDATE users SET available_credit=?, risk_level=?, is_blocked=?, is_flagged=?, flag_reason=? WHERE id=?",
        [available_credit, risk_level, is_blocked, is_flagged, flag_reason, req.params.id], (e) => res.json({ ok: true }));
});

router.get("/kyc/pending", requireAdmin, (req, res) => {
    db.query("SELECT * FROM user_kyc WHERE kyc_status='PENDING'", (e, rows) => res.json({ ok: true, pending: rows }));
});

router.post("/kyc/:id/resolve", requireAdmin, (req, res) => {
    const { status, remarks } = req.body;
    db.query("UPDATE user_kyc SET kyc_status=?, remarks=?, verified_by='admin', verified_at=CURRENT_TIMESTAMP WHERE id=?",
        [status, remarks, req.params.id], (e) => res.json({ ok: true }));
});

router.get("/orders", requireAdmin, (req, res) => {
    db.query("SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY created_at DESC", (e, rows) => res.json({ ok: true, orders: rows }));
});

router.post("/installment/:id/pay", requireAdmin, (req, res) => {
    db.query("UPDATE installments SET status='PAID' WHERE id=?", [req.params.id], (e) => res.json({ ok: true }));
});

router.get("/installments/overdue", requireAdmin, (req, res) => {
    db.query("SELECT i.*, u.name as user_name, u.phone, o.product_name FROM installments i JOIN orders o ON i.order_id = o.id JOIN users u ON o.user_id = u.id WHERE i.due_date < DATE('now') AND i.status != 'PAID'",
        (e, rows) => res.json({ ok: true, overdue: rows }));
});

router.get("/reports/export", requireAdmin, (req, res) => {
    db.query("SELECT o.id, u.name, o.total_amount, o.product_name, o.status, o.created_at FROM orders o JOIN users u ON o.user_id = u.id", (e, rows) => {
        if (rows.length === 0) return res.status(404).send();
        const headers = Object.keys(rows[0]).join(",");
        const csv = rows.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=report.csv");
        res.send(headers + "\n" + csv);
    });
});

module.exports = router;
