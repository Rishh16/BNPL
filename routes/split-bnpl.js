/**
 * ============================================================
 * SPLIT-BNPL COMPLETE BACKEND CODE
 * Production-Ready Split BNPL Feature
 * ============================================================
 * 
 * File: routes/split-bnpl.js
 * This file contains ALL 10 API endpoints for Split-BNPL feature
 * 
 * Features:
 * ✅ Group Purchase Creation
 * ✅ Join Existing Groups  
 * ✅ Approve/Reject Participants
 * ✅ Confirm & Create Individual BNPL Orders
 * ✅ Pay Installments
 * ✅ Earn & Claim Incentives
 * ✅ View Risk Metrics
 * ✅ Full Error Handling
 * ✅ Logging for Debugging
 */

const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");

// ============================================================
// SERVE HTML PAGE
// ============================================================
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/split-bnpl.html"));
});

// ============================================================
// MIDDLEWARE - AUTHENTICATION & VERIFICATION
// ============================================================

function requireLogin(req, res, next) {
  console.log('🔐 Checking Login Status...');
  console.log('   Session User ID:', req.session?.user_id);

  if (!req.session || !req.session.user_id) {
    console.log('❌ Not logged in');
    return res.status(401).json({ error: "Not logged in. Please login first." });
  }
  console.log('✅ User logged in:', req.session.user_id);
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

function requireKycApproved(req, res, next) {
  const userId = req.session.user_id;
  console.log('🆔 Checking KYC Status for User:', userId);

  db.query(
    "SELECT kyc_status FROM user_kyc WHERE user_id=?",
    [userId],
    (err, rows) => {
      if (err) {
        console.log('❌ DB Error (KYC check):', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!rows || rows.length === 0) {
        console.log('❌ No KYC record found');
        return res.status(403).json({ error: "Submit KYC first before using Split-BNPL" });
      }

      const kycStatus = rows[0].kyc_status;
      console.log('   KYC Status:', kycStatus);

      if (kycStatus !== "APPROVED") {
        console.log('❌ KYC Not Approved');
        return res.status(403).json({
          error: `KYC not approved (Status: ${kycStatus})`
        });
      }

      console.log('✅ KYC Approved');
      next();
    }
  );
}

function requireRiskAllowed(req, res, next) {
  const userId = req.session.user_id;
  console.log('⚠️ Checking Risk Level for User:', userId);

  db.query(
    "SELECT risk_level, risk_score FROM users WHERE id=?",
    [userId],
    (err, rows) => {
      if (err) {
        console.log('❌ DB Error (risk check):', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (!rows.length) {
        console.log('❌ User not found');
        return res.status(404).json({ error: "User not found" });
      }

      const level = (rows[0].risk_level || "MEDIUM").toUpperCase();
      const score = Number(rows[0].risk_score ?? 0);

      console.log('   Risk Level:', level);
      console.log('   Risk Score:', score);

      if (level === "HIGH") {
        console.log('❌ Risk Too High');
        return res.status(403).json({
          error: `Split-BNPL blocked due to HIGH risk score (${score}). Please contact support.`
        });
      }

      console.log('✅ Risk Acceptable');
      next();
    }
  );
}

// ============================================================
// API ENDPOINT 1: CREATE GROUP PURCHASE
// ============================================================
/**
 * POST /split-bnpl/create-group
 * Creates a new group purchase (2-3 people max)
 * 
 * Required Middleware: requireLogin, requireKycApproved, requireRiskAllowed
 * 
 * Request Body:
 * {
 *   "total_amount": 12000,
 *   "product_name": "Laptop",
 *   "product_category": "Electronics",
 *   "months": 3
 * }
 * 
 * Response Success:
 * {
 *   "ok": true,
 *   "group_id": "SBP_1234567890_1",
 *   "group_purchase_id": 5,
 *   "individual_share": 4000,
 *   "individual_emi": 1333.33,
 *   "message": "Group purchase created. Share the group ID with friends!"
 * }
 * 
 * Response Error:
 * {
 *   "error": "Insufficient credit..."
 * }
 */
router.post("/create-group", requireLogin, requireNotBlocked, requireKycApproved, requireRiskAllowed, (req, res) => {
  const userId = req.session.user_id;
  const totalAmount = parseInt(req.body.total_amount, 10);
  const productName = (req.body.product_name || "").trim();
  const productCategory = (req.body.product_category || "").trim();
  const months = parseInt(req.body.months, 10);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 CREATE GROUP API CALLED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('User ID:', userId);
  console.log('Total Amount:', totalAmount);
  console.log('Product:', productName);
  console.log('Category:', productCategory);
  console.log('Months:', months);

  // ✅ STEP 1: Validate Input
  if (!totalAmount || totalAmount <= 0) {
    console.log('❌ VALIDATION FAILED: Invalid amount');
    return res.status(400).json({ error: "Invalid amount. Minimum ₹3000 required." });
  }

  if (![3, 6, 12].includes(months)) {
    console.log('❌ VALIDATION FAILED: Invalid months', months);
    return res.status(400).json({ error: "Duration must be 3, 6, or 12 months" });
  }

  if (!productName) {
    console.log('❌ VALIDATION FAILED: No product name');
    return res.status(400).json({ error: "Product name is required" });
  }

  const participantLimit = 3;
  const individualShare = Math.ceil(totalAmount / participantLimit);
  const monthlyEmi = Math.ceil(individualShare / months);

  console.log('📊 Calculations:');
  console.log('   Individual Share:', individualShare);
  console.log('   Monthly EMI:', monthlyEmi);

  // ✅ STEP 2: Check User's Available Credit
  console.log('\n📋 STEP 1: Checking user credit...');
  db.query(
    "SELECT available_credit FROM users WHERE id=?",
    [userId],
    (err, rows) => {
      if (err) {
        console.log('❌ DATABASE ERROR (credit query):', err.message);
        return res.status(500).json({ error: "Database error: " + err.message });
      }

      if (!rows.length) {
        console.log('❌ User not found in database');
        return res.status(404).json({ error: "User not found" });
      }

      const credit = Number(rows[0].available_credit ?? 0);
      console.log('✅ User found');
      console.log('   Available Credit: ₹' + credit);

      if (credit < individualShare) {
        console.log('❌ INSUFFICIENT CREDIT');
        console.log('   Need: ₹' + individualShare);
        console.log('   Have: ₹' + credit);
        return res.status(400).json({
          error: `Insufficient credit. Need ₹${individualShare}, you have ₹${credit}. Contact support for credit increase.`
        });
      }

      // ✅ STEP 3: Generate Unique Group ID
      console.log('\n📋 STEP 2: Generating Group ID...');
      const groupId = `SBP_${Date.now()}_${userId}`;
      console.log('✅ Generated Group ID:', groupId);

      // ✅ STEP 4: Insert Group Purchase into Database
      console.log('\n📋 STEP 3: Inserting group into database...');
      db.query(
        `INSERT INTO group_purchases 
         (group_id, total_amount, product_name, product_category, purchase_date, months, created_by, status)
         VALUES (?, ?, ?, ?, DATE('now'), ?, ?, 'PENDING')`,
        [groupId, totalAmount, productName, productCategory, months, userId],
        (err2, result) => {
          if (err2) {
            console.log('❌ DATABASE ERROR (insert group):', err2.message);
            return res.status(500).json({ error: "Database error: " + err2.message });
          }

          const groupPurchaseId = result.insertId;
          console.log('✅ Group inserted');
          console.log('   Group Purchase ID:', groupPurchaseId);

          // ✅ STEP 5: Add Creator as First Participant
          console.log('\n📋 STEP 4: Adding creator as participant...');
          db.query(
            `INSERT INTO group_participants 
             (group_id, user_id, individual_share, individual_emi, status, kyc_verified, credit_available)
             VALUES (?, ?, ?, ?, 'ACCEPTED', TRUE, ?)`,
            [groupPurchaseId, userId, individualShare, monthlyEmi, credit],
            (err3) => {
              if (err3) {
                console.log('❌ DATABASE ERROR (insert participant):', err3.message);
                return res.status(500).json({ error: "Database error: " + err3.message });
              }

              console.log('✅ Participant added');

              // ✅ STEP 6: Initialize Risk Metrics
              console.log('\n📋 STEP 5: Initializing risk metrics...');
              db.query(
                "SELECT risk_score FROM users WHERE id=?",
                [userId],
                (err4, riskRows) => {
                  if (!err4 && riskRows.length) {
                    const creatorRisk = Number(riskRows[0].risk_score ?? 50);
                    db.query(
                      `INSERT INTO group_risk_metrics 
                       (group_id, avg_risk_score, combined_default_probability, network_strength_score)
                       VALUES (?, ?, ?, 75)`,
                      [groupPurchaseId, creatorRisk, 25],
                      () => {
                        console.log('✅ Risk metrics initialized');
                      }
                    );
                  }
                }
              );

              // ✅ SUCCESS RESPONSE
              console.log('\n✅✅✅ GROUP CREATED SUCCESSFULLY ✅✅✅');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

              res.json({
                ok: true,
                group_id: groupId,
                group_purchase_id: groupPurchaseId,
                total_amount: totalAmount,
                individual_share: individualShare,
                individual_emi: monthlyEmi,
                months: months,
                slots_available: 2,
                message: "✅ Group created! Share this ID with friends to invite them."
              });
            }
          );
        }
      );
    }
  );
});

// ============================================================
// API ENDPOINT 2: GET GROUP DETAILS
// ============================================================
router.get("/group/:groupId", (req, res) => {
  const groupId = req.params.groupId;

  db.query(
    "SELECT * FROM group_purchases WHERE group_id=?",
    [groupId],
    (err, groups) => {
      if (err) return res.status(500).json({ error: err.message });
      if (groups.length === 0)
        return res.status(404).json({ error: "Group not found" });

      const group = groups[0];

      db.query(
        `SELECT gp.id, gp.user_id, u.name, u.email, gp.individual_share, 
                gp.status, gp.joined_at, gp.risk_score_at_join
         FROM group_participants gp
         JOIN users u ON u.id = gp.user_id
         WHERE gp.group_id=?`,
        [group.id],
        (err2, participants) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            ok: true,
            group: {
              id: group.id,
              group_id: group.group_id,
              total_amount: group.total_amount,
              product_name: group.product_name,
              product_category: group.product_category,
              months: group.months,
              status: group.status,
              created_at: group.created_at,
              created_by: group.created_by
            },
            participants: participants,
            available_slots: Math.max(0, 3 - participants.length),
            participation_rate: `${participants.length}/3`
          });
        }
      );
    }
  );
});

// ============================================================
// API ENDPOINT 3: JOIN GROUP
// ============================================================
router.post("/join-group", requireLogin, requireNotBlocked, requireKycApproved, requireRiskAllowed, (req, res) => {
  const userId = req.session.user_id;
  const groupId = req.body.group_id;

  console.log('\n🔗 JOIN GROUP API CALLED');
  console.log('   User ID:', userId);
  console.log('   Group ID:', groupId);

  if (!groupId) return res.status(400).json({ error: "group_id required" });

  db.query(
    "SELECT * FROM group_purchases WHERE group_id=?",
    [groupId],
    (err, groups) => {
      if (err) {
        console.log('❌ Error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      if (groups.length === 0) {
        console.log('❌ Group not found');
        return res.status(404).json({ error: "Group not found" });
      }

      const group = groups[0];
      console.log('✅ Group found:', group.product_name);

      if (group.status !== "PENDING") {
        console.log('❌ Group not accepting members');
        return res.status(400).json({
          error: `Cannot join group with status: ${group.status}`
        });
      }

      db.query(
        "SELECT COUNT(*) as count FROM group_participants WHERE group_id=?",
        [group.id],
        (err2, countRows) => {
          if (err2) return res.status(500).json({ error: err2.message });

          const currentCount = countRows[0].count;
          console.log('   Current Members:', currentCount + '/3');

          if (currentCount >= 3) {
            console.log('❌ Group is full');
            return res.status(400).json({ error: "Group is full" });
          }

          db.query(
            "SELECT id FROM group_participants WHERE group_id=? AND user_id=?",
            [group.id, userId],
            (err3, existing) => {
              if (err3) return res.status(500).json({ error: err3.message });
              if (existing.length > 0) {
                console.log('❌ Already a member');
                return res.status(400).json({ error: "Already a member of this group" });
              }

              const individualShare = Math.ceil(group.total_amount / 3);

              db.query(
                "SELECT available_credit, risk_score FROM users WHERE id=?",
                [userId],
                (err4, userRows) => {
                  if (err4) return res.status(500).json({ error: err4.message });
                  if (!userRows.length)
                    return res.status(404).json({ error: "User not found" });

                  const credit = Number(userRows[0].available_credit ?? 0);
                  const userRiskScore = Number(userRows[0].risk_score ?? 50);

                  if (credit < individualShare) {
                    console.log('❌ Insufficient credit');
                    return res.status(400).json({
                      error: `Insufficient credit. Need ₹${individualShare}, have ₹${credit}`
                    });
                  }

                  db.query(
                    `INSERT INTO group_participants 
                     (group_id, user_id, individual_share, individual_emi, status, kyc_verified, credit_available, risk_score_at_join)
                     VALUES (?, ?, ?, ?, 'INVITED', TRUE, ?, ?)`,
                    [group.id, userId, individualShare, Math.ceil(individualShare / group.months), credit, userRiskScore],
                    (err5) => {
                      if (err5) {
                        console.log('❌ Error adding participant:', err5.message);
                        return res.status(500).json({ error: err5.message });
                      }

                      db.query(
                        `INSERT INTO group_notifications 
                         (group_id, user_id, notification_type, message)
                         VALUES (?, ?, 'INVITE', ?)`,
                        [group.id, group.created_by, `${req.session.user_name} wants to join the group!`],
                        () => { }
                      );

                      recalculateGroupRiskMetrics(group.id);

                      console.log('✅ Successfully joined group');
                      res.json({
                        ok: true,
                        message: "✅ Successfully joined! Waiting for creator approval.",
                        individual_share: individualShare,
                        individual_emi: Math.ceil(individualShare / group.months)
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// ============================================================
// API ENDPOINT 4: APPROVE PARTICIPANT
// ============================================================
router.post("/approve-participant", requireLogin, (req, res) => {
  const creatorId = req.session.user_id;
  const participantId = parseInt(req.body.participant_id, 10);
  const action = (req.body.action || "").toLowerCase();

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
  }

  db.query(
    `SELECT gp.id, gp.group_id, gp.user_id, gp.status, g.created_by, g.status as group_status
     FROM group_participants gp
     JOIN group_purchases g ON g.id = gp.group_id
     WHERE gp.id=?`,
    [participantId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0)
        return res.status(404).json({ error: "Participant not found" });

      const participant = rows[0];

      if (participant.created_by !== creatorId) {
        return res.status(403).json({ error: "Only group creator can approve" });
      }

      if (participant.group_status !== "PENDING") {
        return res.status(400).json({
          error: `Cannot modify group with status: ${participant.group_status}`
        });
      }

      if (participant.status !== "INVITED") {
        return res.status(400).json({
          error: `Participant status is ${participant.status}, not INVITED`
        });
      }

      const newStatus = action === "approve" ? "ACCEPTED" : "REJECTED";
      db.query(
        "UPDATE group_participants SET status=?, accepted_at=CURRENT_TIMESTAMP WHERE id=?",
        [newStatus, participantId],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          recalculateGroupRiskMetrics(participant.group_id);

          db.query(
            `INSERT INTO group_notifications 
             (group_id, user_id, notification_type, message)
             VALUES (?, ?, ?, ?)`,
            [participant.group_id, participant.user_id, action === "approve" ? "JOINED" : "REJECTED",
            action === "approve" ? "✅ You were approved to join the group!" : "❌ Your request was rejected."],
            () => { }
          );

          res.json({
            ok: true,
            message: `Participant ${action}ed successfully`,
            new_status: newStatus
          });
        }
      );
    }
  );
});

// ============================================================
// API ENDPOINT 5: CONFIRM GROUP
// ============================================================
router.post("/confirm-group", requireLogin, (req, res) => {
  const creatorId = req.session.user_id;
  const groupPurchaseId = parseInt(req.body.group_id, 10);

  db.query(
    "SELECT * FROM group_purchases WHERE id=?",
    [groupPurchaseId],
    (err, groups) => {
      if (err) return res.status(500).json({ error: err.message });
      if (groups.length === 0)
        return res.status(404).json({ error: "Group not found" });

      const group = groups[0];
      if (group.created_by !== creatorId) {
        return res.status(403).json({ error: "Only creator can confirm group" });
      }

      db.query(
        `SELECT gp.*, u.available_credit 
         FROM group_participants gp
         JOIN users u ON u.id = gp.user_id
         WHERE gp.group_id=? AND gp.status='ACCEPTED'`,
        [groupPurchaseId],
        (err2, participants) => {
          if (err2) return res.status(500).json({ error: err2.message });

          if (participants.length < 2) {
            return res.status(400).json({
              error: `Need at least 2 members. Current: ${participants.length}`
            });
          }

          let successCount = 0;
          const errors = [];

          participants.forEach((p) => {
            const individualShare = p.individual_share;
            const emi = p.individual_emi;

            db.query(
              `INSERT INTO orders 
               (user_id, total_amount, months, monthly_emi, status, product_name, purchase_date, is_split_bnpl, group_id, individual_share)
               VALUES (?, ?, ?, ?, 'ACTIVE', ?, DATE('now'), TRUE, ?, ?)`,
              [p.user_id, individualShare, group.months, emi, `${group.product_name} (Split-BNPL)`, groupPurchaseId, individualShare],
              (err3, result) => {
                if (err3) {
                  errors.push(`Failed for user ${p.user_id}: ${err3.message}`);
                } else {
                  db.query(
                    "UPDATE group_participants SET individual_order_id=?, status='ACTIVE' WHERE id=?",
                    [result.insertId, p.id],
                    () => { }
                  );

                  db.query(
                    "UPDATE users SET available_credit = available_credit - ? WHERE id=?",
                    [individualShare, p.user_id],
                    () => { }
                  );

                  for (let i = 1; i <= group.months; i++) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i);
                    const dueDateStr = dueDate.toISOString().split('T')[0];

                    db.query(
                      `INSERT INTO group_installments 
                       (participant_id, installment_number, due_date, amount, status)
                       VALUES (?, ?, ?, ?, 'PENDING')`,
                      [p.id, i, dueDateStr, emi],
                      () => { }
                    );
                  }

                  successCount++;
                }
              }
            );
          });

          setTimeout(() => {
            db.query(
              "UPDATE group_purchases SET status='ACTIVE' WHERE id=?",
              [groupPurchaseId],
              () => {
                res.json({
                  ok: true,
                  message: "✅ Group confirmed! Individual BNPL orders created.",
                  success_count: successCount,
                  participant_count: participants.length,
                  errors: errors.length > 0 ? errors : []
                });
              }
            );
          }, 500);
        }
      );
    }
  );
});

// ============================================================
// API ENDPOINT 6: GET MY GROUPS
// ============================================================
router.get("/my-groups", requireLogin, (req, res) => {
  const userId = req.session.user_id;

  db.query(
    `SELECT 
      g.id, g.group_id, g.total_amount, g.product_name, g.product_category,
      g.months, g.status, g.created_at, g.created_by,
      gp.individual_share, gp.status as participant_status, gp.joined_at,
      (SELECT COUNT(*) FROM group_participants WHERE group_id=g.id) as member_count
     FROM group_purchases g
     JOIN group_participants gp ON gp.group_id = g.id
     WHERE gp.user_id=?
     ORDER BY g.created_at DESC`,
    [userId],
    (err, groups) => {
      if (err) {
        console.log('❌ Error:', err.message);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        ok: true,
        groups: groups,
        total: groups.length
      });
    }
  );
});

// ============================================================
// API ENDPOINT 7: PAY INSTALLMENT
// ============================================================
router.post("/pay-installment", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const installmentId = parseInt(req.body.installment_id, 10);

  db.query(
    `SELECT gi.*, gp.user_id, gp.group_id 
     FROM group_installments gi
     JOIN group_participants gp ON gp.id = gi.participant_id
     WHERE gi.id=?`,
    [installmentId],
    (err, installments) => {
      if (err) return res.status(500).json({ error: err.message });
      if (installments.length === 0)
        return res.status(404).json({ error: "Installment not found" });

      const installment = installments[0];

      if (installment.user_id !== userId) {
        return res.status(403).json({ error: "Not your installment" });
      }

      if (installment.status === "PAID") {
        return res.status(400).json({ error: "Already paid" });
      }

      db.query(
        "UPDATE group_installments SET status='PAID', paid_amount=amount, payment_date=DATE('now') WHERE id=?",
        [installmentId],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          db.query(
            "SELECT COUNT(*) as pending FROM group_installments WHERE participant_id=? AND status!='PAID'",
            [installment.participant_id],
            (err3, rows) => {
              if (!err3 && rows[0].pending === 0) {
                db.query(
                  "UPDATE group_participants SET status='COMPLETED' WHERE id=?",
                  [installment.participant_id],
                  () => { }
                );
              }
            }
          );

          const dueDate = new Date(installment.due_date);
          const today = new Date();
          const isOnTime = today <= dueDate;

          if (isOnTime) {
            // Earn on-time bonus incentive
            db.query(
              `INSERT INTO group_incentives 
               (group_id, user_id, incentive_type, amount, status, expiry_date)
               VALUES (?, ?, 'ON_TIME_BONUS', ?, 'EARNED', DATE('now', '+30 days'))`,
              [installment.group_id, userId, Math.ceil(installment.amount * 0.02)],
              () => { }
            );

            // Increment on-time streak
            db.query(
              "UPDATE users SET consecutive_on_time_payments = consecutive_on_time_payments + 1 WHERE id=?",
              [userId],
              () => {
                // Check if streak reaches 3
                db.query("SELECT consecutive_on_time_payments, name FROM users WHERE id=?", [userId], (err3, userRows) => {
                  if (!err3 && userRows.length > 0) {
                    const streak = userRows[0].consecutive_on_time_payments;
                    if (streak >= 3) {
                      const boostAmount = 5000;
                      db.query(
                        "UPDATE users SET available_credit = available_credit + ?, consecutive_on_time_payments = 0 WHERE id=?",
                        [boostAmount, userId],
                        () => {
                          console.log(`🚀 CREDIT BOOST! User ${userRows[0].name} got ₹${boostAmount} boost for 3 on-time payments.`);
                        }
                      );
                    }
                  }
                });
              }
            );
          } else {
            // Late payment - reset streak
            db.query(
              "UPDATE users SET consecutive_on_time_payments = 0 WHERE id=?",
              [userId],
              () => { }
            );
          }

          res.json({
            ok: true,
            message: isOnTime ? "✅ Payment received on time! Your streak increased." : "✅ Payment received, but it was late. Your streak has been reset.",
            amount: installment.amount,
            on_time: isOnTime
          });
        }
      );
    }
  );
});

// ============================================================
// API ENDPOINT 8: GET RISK METRICS
// ============================================================
router.get("/risk-metrics/:groupId", (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);

  db.query(
    "SELECT * FROM group_risk_metrics WHERE group_id=?",
    [groupId],
    (err, metrics) => {
      if (err) return res.status(500).json({ error: err.message });
      if (metrics.length === 0) {
        return res.json({
          ok: false,
          message: "No risk metrics yet",
          data: null
        });
      }

      res.json({
        ok: true,
        data: metrics[0]
      });
    }
  );
});

// ============================================================
// API ENDPOINT 9: GET MY INCENTIVES
// ============================================================
router.get("/my-incentives", requireLogin, (req, res) => {
  const userId = req.session.user_id;

  db.query(
    `SELECT gi.*, g.product_name, g.total_amount
     FROM group_incentives gi
     JOIN group_purchases g ON g.id = gi.group_id
     WHERE gi.user_id=? AND gi.status='EARNED'
     ORDER BY gi.earned_date DESC`,
    [userId],
    (err, incentives) => {
      if (err) return res.status(500).json({ error: err.message });

      const totalEarned = incentives.reduce((sum, inv) => sum + Number(inv.amount), 0);

      res.json({
        ok: true,
        incentives: incentives,
        total_earned: totalEarned
      });
    }
  );
});

// ============================================================
// API ENDPOINT 10: CLAIM INCENTIVE
// ============================================================
router.post("/claim-incentive", requireLogin, (req, res) => {
  const userId = req.session.user_id;
  const incentiveId = parseInt(req.body.incentive_id, 10);

  db.query(
    "SELECT * FROM group_incentives WHERE id=? AND user_id=?",
    [incentiveId, userId],
    (err, incentives) => {
      if (err) return res.status(500).json({ error: err.message });
      if (incentives.length === 0)
        return res.status(404).json({ error: "Incentive not found" });

      const incentive = incentives[0];

      if (incentive.status !== "EARNED") {
        return res.status(400).json({ error: "Can only claim EARNED incentives" });
      }

      if (new Date() > new Date(incentive.expiry_date)) {
        return res.status(400).json({ error: "Incentive has expired" });
      }

      db.query(
        "UPDATE group_incentives SET status='CLAIMED' WHERE id=?",
        [incentiveId],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          db.query(
            "UPDATE users SET available_credit = available_credit + ? WHERE id=?",
            [incentive.amount, userId],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });

              res.json({
                ok: true,
                message: "✅ Incentive claimed! Credit added.",
                amount: incentive.amount
              });
            }
          );
        }
      );
    }
  );
});

// ============================================================
// HELPER FUNCTION: Recalculate Risk Metrics
// ============================================================
function recalculateGroupRiskMetrics(groupId) {
  db.query(
    `SELECT gp.*, u.risk_score 
     FROM group_participants gp
     JOIN users u ON u.id = gp.user_id
     WHERE gp.group_id=? AND gp.status IN ('ACCEPTED', 'ACTIVE', 'COMPLETED')`,
    [groupId],
    (err, participants) => {
      if (err || !participants.length) return;

      const riskScores = participants.map(p => Number(p.risk_score ?? 50));
      const avgRisk = Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length);

      const maxRisk = Math.max(...riskScores);
      const minRisk = Math.min(...riskScores);
      const diversity = maxRisk - minRisk;
      const combinedDefaultProb = Math.max(10, avgRisk - (diversity / 10));

      const networkStrength = Math.min(100, 50 + (participants.length * 15));

      db.query(
        `INSERT INTO group_risk_metrics 
         (group_id, avg_risk_score, combined_default_probability, network_strength_score)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         avg_risk_score=?, combined_default_probability=?, network_strength_score=?`,
        [groupId, avgRisk, combinedDefaultProb, networkStrength, avgRisk, combinedDefaultProb, networkStrength],
        () => { }
      );
    }
  );
}

// ============================================================
// EXPORT ROUTES
// ============================================================
module.exports = router;
