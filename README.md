# Split BNPL Platform

A full-stack Buy Now, Pay Later (BNPL) fintech application that allows users to purchase products and split payments into flexible installments. The platform incorporates user authentication, KYC verification, risk assessment, order management, and an admin dashboard to simulate a real-world lending workflow.

## Features

* Secure User Registration & Login
* KYC Verification System
* Product Catalog Management
* Split Payment (BNPL) Functionality
* Risk Assessment & Eligibility Checks
* Order Tracking
* Admin Dashboard
* Session-Based Authentication
* SQLite Database Integration

## Tech Stack

**Frontend**

* HTML
* CSS
* JavaScript

**Backend**

* Node.js
* Express.js

**Database**

* SQLite

## System Workflow

1. User signs up and logs in.
2. User completes KYC verification.
3. Risk engine evaluates eligibility.
4. User selects products.
5. BNPL plan is generated.
6. Orders and repayment details are managed through the platform.
7. Admin can monitor users, orders, and approvals.

## Project Structure

```text
public/     -> Frontend pages
routes/     -> API endpoints
server.js   -> Express server
db.js       -> Database connection
```

## Installation

```bash
git clone <repository-url>
cd bnpl-hackathon
npm install
npm start
```

Open:

```text
http://localhost:5001
```

## Key Learning Outcomes

* Full-Stack Web Development
* REST API Design
* Authentication & Session Management
* Database Integration
* Fintech Workflow Simulation
* Backend Route Architecture

## Future Improvements

* Credit Score Integration
* Payment Gateway Integration
* Email & SMS Notifications
* EMI Calculator
* Advanced Analytics Dashboard

## Author

**Rishika Nakirtha**

B.Tech Student | Full-Stack Development | FinTech Projects
