# 💳 BNPL (Buy Now Pay Later) E-Commerce Platform

A full-stack Buy Now Pay Later (BNPL) web application that enables users to purchase products on EMI, monitor available credit, view payment history, and manage installments. The platform also includes risk assessment, split/group purchase functionality, and an admin dashboard.

> **Note:** This project was developed for educational purposes to demonstrate BNPL workflows and financial technology concepts.

---

## 🚀 Live Demo

https://bnpl-3.onrender.com/

---

## 📸 Preview

(Add screenshots of Login, Dashboard, Products, and Admin pages here.)

---

## ✨ Features

### 👤 User Module
- User Registration & Login
- Session-based Authentication
- Secure Logout
- Personalized Dashboard

### 💳 BNPL Features
- Available Credit Management
- EMI Calculation (3, 6 & 12 Months)
- Credit Eligibility Validation
- Installment Payment Tracking
- Order History

### 🛍️ Product Module
- Product Categories
- Product Listing
- Shopping Cart
- BNPL Purchase Flow

### 👥 Split BNPL
- Group Purchase Support
- Shared Payment Distribution
- Individual EMI Calculation

### 📊 Risk Assessment
- Risk Score Calculation
- Credit Risk Levels (Low, Medium, High)
- Dynamic Credit Evaluation

### 👨‍💼 Admin Module
- Admin Login
- User Management
- Product Management
- Order Monitoring

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- SQLite3

### Authentication
- Express Session

### Deployment
- Render

---

## 📂 Project Structure

```
BNPL/
│
├── public/
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── products.html
│   ├── cart.html
│   ├── admin.html
│   ├── admin-login.html
│   ├── split-bnpl.html
│   ├── style.css
│   └── img/
│
├── routes/
│   ├── auth.js
│   ├── admin.js
│   ├── products.js
│   ├── order.js
│   ├── risk.js
│   └── split-bnpl.js
│
├── server.js
├── db.js
├── setup-sqlite.js
├── package.json
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Rishh16/BNPL.git
```

Navigate to the project

```bash
cd BNPL
```

Install dependencies

```bash
npm install
```

Initialize the SQLite database

```bash
node setup-sqlite.js
```

Start the server

```bash
npm start
```

Open your browser

```
http://localhost:5001
```

---

## 🎯 Learning Outcomes

This project helped me learn:

- Full-Stack Web Development
- REST API Development
- Express.js Routing
- Session-Based Authentication
- SQLite Database Design
- EMI & Credit Limit Logic
- Risk Assessment Implementation
- Group Purchase Workflow
- CRUD Operations
- Responsive UI Design
- Deployment using Render
- Git & GitHub Version Control

---

## 🌐 Deployment

The application is deployed using **Render**.

---

## 📌 Future Enhancements

- OTP Verification
- Email Notifications
- Payment Gateway Integration (Razorpay/Stripe)
- Credit Card & UPI Payments
- AI-Based Credit Scoring
- Loan Approval Prediction
- Admin Analytics Dashboard
- User Profile Management
- Product Search & Filters
- Wishlist Functionality
- JWT Authentication
- Password Encryption using bcrypt

---

## 👩‍💻 Author

**Rishika Nakirtha**

GitHub: https://github.com/Rishh16

---

## 📄 License

This project is developed for educational and portfolio purposes only.
