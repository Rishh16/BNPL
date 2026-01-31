# 🚀 SPLIT BNPL - Buy Now Pay Later Platform

A comprehensive Buy Now Pay Later (BNPL) fintech solution built for hackathon demonstration, featuring advanced risk assessment, KYC verification, installment management, and admin dashboard.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Demo Credentials](#demo-credentials)

---

## 🎯 Overview

SPLIT BNPL is a full-stack fintech application that enables users to purchase products and pay in installments. The platform includes sophisticated risk assessment algorithms, KYC verification, loyalty programs, and comprehensive admin controls.

**Built for**: Hackathon Prototype  
**Purpose**: Demonstrate a complete BNPL ecosystem with real-world features

---

## ✨ Features

### User Features
- 🔐 **User Authentication** - Secure registration and login
- 📱 **KYC Verification** - Aadhaar-based identity verification with enrollment ID
- 🛍️ **Product Catalog** - 70+ products across 7 categories
- 💳 **Flexible Payments** - Split purchases into 3, 6, or 12 installments
- 🎁 **Loyalty Program** - Earn points and get credit boosts
- 📊 **User Dashboard** - Track orders, installments, and credit limit
- ⚡ **Real-time Risk Assessment** - Dynamic credit evaluation

### Admin Features
- 📈 **Analytics Dashboard** - Real-time statistics and insights
- 👥 **User Management** - View, block, flag users
- ✅ **KYC Approval** - Review and approve/reject KYC submissions
- 💰 **Order Monitoring** - Track all transactions
- 🚨 **Risk Management** - Identify overdue payments and high-risk users
- 📤 **CSV Export** - Download reports for analysis

### Risk Assessment Engine
- Credit history analysis
- Payment behavior tracking
- Overdue payment detection
- Dynamic credit limit adjustment
- Risk level categorization (LOW, MEDIUM, HIGH)

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3 (lightweight, file-based)
- **Session Management**: express-session
- **Architecture**: RESTful API

### Why These Technologies?

#### **Node.js + Express.js**
- ✅ Fast development and prototyping
- ✅ Asynchronous I/O for handling multiple requests
- ✅ Large ecosystem of packages (npm)
- ✅ JavaScript everywhere (frontend + backend)
- ✅ Perfect for hackathon rapid development

#### **SQLite**
- ✅ Zero configuration - no separate database server needed
- ✅ Portable - entire database in a single file
- ✅ Perfect for prototypes and demos
- ✅ ACID compliant (reliable transactions)
- ✅ Easy to share and deploy
- ✅ Can be easily migrated to PostgreSQL/MySQL for production

#### **Express-session**
- ✅ Secure session management
- ✅ User authentication state
- ✅ Admin access control

---

## 🏗️ Architecture

```
bnpl-hackathon/
├── server.js                 # Main application entry point
├── db.js                     # Database connection wrapper
├── routes/                   # API route handlers
│   ├── auth.js              # User registration & login
│   ├── kyc.js               # KYC verification
│   ├── products.js          # Product catalog
│   ├── order.js             # Order creation & management
│   ├── split-bnpl.js        # Installment logic
│   ├── risk.js              # Risk assessment
│   └── admin.js             # Admin dashboard APIs
├── public/                   # Frontend HTML/CSS/JS
│   ├── index.html           # Landing page
│   ├── login.html           # User login
│   ├── signup.html          # User registration
│   ├── kyc.html             # KYC form
│   ├── dashboard.html       # User dashboard
│   ├── products.html        # Product catalog
│   ├── checkout.html        # Checkout page
│   ├── admin-login.html     # Admin login
│   └── admin-dashboard.html # Admin panel
└── setup-sqlite.js          # Database initialization
```

### Database Schema

**Tables**:
- `users` - User accounts and credit information
- `user_kyc` - KYC verification data
- `products` - Product catalog
- `orders` - Purchase orders
- `installments` - Payment installments
- `user_groups` - Group buying feature
- `loyalty_points` - Rewards tracking

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/bnpl-hackathon.git
cd bnpl-hackathon
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize the database**
```bash
node setup-sqlite.js
```

4. **Start the server**
```bash
node server.js
```

5. **Access the application**
- Open browser: `http://localhost:5001`
- Admin panel: `http://localhost:5001/admin-login`

---

## 🎮 Usage

### For Users
1. **Register** - Create an account at `/signup.html`
2. **Complete KYC** - Submit Aadhaar and enrollment details at `/kyc`
3. **Browse Products** - View catalog at `/products.html`
4. **Make Purchase** - Select product, choose installment plan
5. **Track Orders** - Monitor payments in dashboard

### For Admins
1. **Login** - Access admin panel at `/admin-login`
2. **Review KYC** - Approve/reject pending verifications
3. **Monitor Users** - View all users and their status
4. **Manage Risk** - Track overdue payments
5. **Export Data** - Download CSV reports

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - User login
- `GET /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### KYC
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/status` - Check KYC status

### Products
- `GET /products/all` - Get all products
- `GET /products/category/:category` - Filter by category

### Orders
- `POST /order/create` - Create new order
- `GET /order/user/:userId` - Get user orders
- `GET /order/:orderId/installments` - Get installment schedule

### Admin
- `POST /admin/login` - Admin authentication
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/users` - List all users
- `POST /admin/kyc/:id/resolve` - Approve/reject KYC
- `GET /admin/installments/overdue` - Overdue payments
- `GET /admin/reports/export` - Export CSV

### Risk Assessment
- `POST /risk/assess` - Calculate risk score
- `GET /risk/user/:userId` - Get user risk profile

---

## 🔑 Demo Credentials

### Test Users (Pre-loaded)
| Email | Password | Credit Limit |
|-------|----------|--------------|
| a@test.com | password | ₹5,000 |
| b@test.com | password | ₹5,000 |
| c@test.com | password | ₹5,000 |

### Admin Access
- **Username**: `admin`
- **Password**: `admin123`

---

## 🎨 Key Features Explained

### 1. Risk Assessment Algorithm
The platform calculates risk scores based on:
- Credit utilization ratio
- Payment history
- Overdue installments
- Account age
- KYC verification status

### 2. Dynamic Credit Limits
- Initial credit: ₹5,000
- Increases with good payment behavior
- Decreases with missed payments
- Loyalty boosts for consistent users

### 3. Installment Plans
- **3 months** - Lower interest
- **6 months** - Medium interest
- **12 months** - Higher interest but smaller EMIs

### 4. KYC Verification
- Aadhaar number validation
- Enrollment type (Student/Employee)
- Enrollment ID verification
- Admin manual review

---

## 🚀 Deployment

### For Production
1. Replace SQLite with PostgreSQL/MySQL
2. Add environment variables for secrets
3. Implement proper password hashing (bcrypt)
4. Add rate limiting and security headers
5. Set up HTTPS/SSL
6. Use production session store (Redis)

---

## 📝 License

MIT License - Free to use for educational and commercial purposes

---

## 👨‍💻 Developer

Built with ❤️ for hackathon demonstration

---

## 🙏 Acknowledgments

- Product images from various sources
- Inspired by real-world BNPL platforms like Klarna, Afterpay
- Built for learning and demonstration purposes

---

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

**⭐ If you find this project useful, please give it a star!**
