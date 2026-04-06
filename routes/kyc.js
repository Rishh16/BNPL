const express = require("express");
const router = express.Router();
const db = require("../db");

// ================== AUTH CHECK ==================
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user_id) {
    return res.status(401).json({ message: "Login required" });
  }
  next();
}

// ================== MOCK AADHAAR MAPPING ==================
const AADHAAR_LINKS = {
  "1234-5678-9012": "9876543210",
  "1111-2222-3333": "9000000001",
  "9999-8888-7777": "8888888888"
};

// ================== SEND OTP ==================
router.post("/send-otp", requireLogin, (req, res) => {
  const { id_type, id_number } = req.body;

  if (id_type !== "AADHAAR") {
    return res.status(400).json({ message: "OTP only supported for Aadhaar verification" });
  }
  if (!id_number) return res.status(400).json({ message: "Aadhaar number required" });

  // Mock lookup
  const linkedPhone = AADHAAR_LINKS[id_number] || "9123456789"; // Default mock
  const maskedPhone = "*******" + linkedPhone.slice(-3);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  req.session.kyc_otp = otp;
  req.session.kyc_id_number = id_number;
  req.session.kyc_linked_phone = linkedPhone;

  console.log("\n" + "=".repeat(50));
  console.log(`📱 AADHAAR OTP: ${otp}`);
  console.log(`📞 Sent to: ${linkedPhone}`);
  console.log("=".repeat(50) + "\n");

  res.json({
    ok: true,
    message: `OTP sent to Aadhaar-linked phone ending in ${linkedPhone.slice(-3)}`
  });
});

// ================== SUBMIT KYC (AUTO APPROVED, NO INCOME) ==================
router.post("/submit", requireLogin, (req, res) => {
  const userId = req.session.user_id;

  const {
    full_name,
    dob,
    phone,
    address,
    id_type,
    id_number,
    enrollment_type,
    remarks,
    otp
  } = req.body;

  if (
    !full_name ||
    !dob ||
    !phone ||
    !address ||
    !id_type ||
    !id_number ||
    !enrollment_type
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // ✅ AADHAAR OTP VERIFICATION
  if (id_type === "AADHAAR") {
    if (!otp) return res.status(400).json({ message: "Aadhaar OTP is required" });
    if (req.session.kyc_otp !== otp || req.session.kyc_id_number !== id_number) {
      return res.status(400).json({ ok: false, message: "Invalid or expired Aadhaar OTP" });
    }
    // Success - clear session otp
    delete req.session.kyc_otp;
    delete req.session.kyc_id_number;
  }



  // ✅ AGE VERIFICATION (18+)
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return res.status(400).json({
      ok: false,
      message: `Eligibility Criteria: You must be at least 18 years old. Current age: ${age}`
    });
  }

  const sql = `INSERT INTO user_kyc (user_id, full_name, dob, phone, address, id_type, id_number, enrollment_type, remarks, kyc_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
    ON CONFLICT(user_id) DO UPDATE SET
      full_name=excluded.full_name, dob=excluded.dob, phone=excluded.phone, address=excluded.address,
      id_type=excluded.id_type, id_number=excluded.id_number, enrollment_type=excluded.enrollment_type,
      remarks=excluded.remarks, kyc_status='APPROVED'`;
  const params = [userId, full_name, dob, phone, address, id_type, id_number, enrollment_type, remarks];

  db.query(sql, params, async (err) => {
    if (err) {
      console.error("KYC error:", err);
      return res.status(500).json({ error: err.message });
    }

    // ✅ Log KYC Approval (Mock email)
    console.log(`📧 Simulation: KYC Verification Approved for ${full_name} (${enrollment_type})`);

    // In a real app, you'd send an actual email here.
    // For this hackathon, we'll just log it.

    res.json({
      ok: true,
      message: "KYC Approved Successfully! A confirmation email has been sent."
    });
  });
});

// ================== CHECK KYC STATUS ==================
router.get("/status", requireLogin, (req, res) => {
  const userId = req.session.user_id;

  db.query(
    "SELECT kyc_status FROM user_kyc WHERE user_id=?",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!rows || rows.length === 0) {
        return res.json({ ok: true, kyc_status: "NOT_SUBMITTED" });
      }

      res.json({
        ok: true,
        kyc_status: rows[0].kyc_status
      });
    }
  );
});

module.exports = router;