// ================== IMPORTS ==================
const express = require("express");
const session = require("express-session");
const path = require("path");

const db = require("./db");

// ROUTES
const kycRoutes = require("./routes/kyc");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/order");
const productRoutes = require("./routes/products");
const riskRoutes = require("./routes/risk");
const splitBnplRoutes = require("./routes/split-bnpl");
const adminRoutes = require("./routes/admin");

// ================== APP INIT ==================
const app = express();
const PORT = 5001;

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ================== SESSION (MUST BE BEFORE ROUTES) ==================
app.use(
  session({
    secret: "bnpl_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);

// ================== ROUTES ==================

// health check
app.get("/", (req, res) => {
  res.send("✅ BNPL Backend Running");
});

// Serve KYC page directly for clean URL
app.get("/kyc", (req, res) => {
  res.sendFile(path.join(__dirname, "public/kyc.html"));
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin-login.html"));
});

// DB test
app.get("/whichdb", (req, res) => {
  db.query(
    "SELECT DATABASE() AS dbname, USER() AS user, @@port AS port",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows[0]);
    }
  );
});

// API routes
app.use("/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/order", orderRoutes);
app.use("/products", productRoutes);
app.use("/risk", riskRoutes);
app.use("/split-bnpl", splitBnplRoutes);
app.use("/admin", adminRoutes);

// ================== ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});