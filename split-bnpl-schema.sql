-- ============================================================
-- SPLIT-BNPL DATABASE SCHEMA
-- Group Buy BNPL Feature for Hackathon
-- ============================================================

-- 1. GROUP PURCHASES TABLE
-- Main table storing co-signed group purchase details
CREATE TABLE IF NOT EXISTS group_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100),
    purchase_date DATE NOT NULL,
    months INT NOT NULL DEFAULT 3,
    status ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'DEFAULT') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. GROUP PURCHASE PARTICIPANTS TABLE
-- Individual users enrolled in a group purchase
CREATE TABLE IF NOT EXISTS group_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    individual_share DECIMAL(10, 2) NOT NULL,
    individual_emi DECIMAL(10, 2) NOT NULL,
    status ENUM('INVITED', 'ACCEPTED', 'REJECTED', 'ACTIVE', 'COMPLETED') DEFAULT 'INVITED',
    individual_order_id INT,
    kyc_verified BOOLEAN DEFAULT FALSE,
    credit_available DECIMAL(10, 2),
    risk_score_at_join INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (individual_order_id) REFERENCES orders(id),
    UNIQUE KEY unique_participant (group_id, user_id)
);

-- 3. GROUP PURCHASE INSTALLMENTS TABLE
-- Tracks individual installments for each participant
CREATE TABLE IF NOT EXISTS group_installments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    status ENUM('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED') DEFAULT 'PENDING',
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES group_participants(id),
    UNIQUE KEY unique_installment (participant_id, installment_number)
);

-- 4. GROUP INCENTIVES TABLE
-- Track rewards/incentives for successful group purchases
CREATE TABLE IF NOT EXISTS group_incentives (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    incentive_type ENUM('CASH_DISCOUNT', 'CREDIT_BONUS', 'REFERRAL_BONUS', 'ON_TIME_BONUS') DEFAULT 'CREDIT_BONUS',
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('EARNED', 'CLAIMED', 'EXPIRED') DEFAULT 'EARNED',
    earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. GROUP RISK ASSESSMENT TABLE
-- Store combined risk metrics for group purchases
CREATE TABLE IF NOT EXISTS group_risk_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    avg_risk_score DECIMAL(5, 2),
    combined_default_probability DECIMAL(5, 2),
    network_strength_score DECIMAL(5, 2),
    correlation_score DECIMAL(5, 2),
    joint_approval_decision ENUM('APPROVED', 'REJECTED', 'NEEDS_REVIEW') DEFAULT 'NEEDS_REVIEW',
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id)
);

-- 6. GROUP NOTIFICATIONS TABLE
-- Track group-related notifications
CREATE TABLE IF NOT EXISTS group_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    notification_type ENUM('INVITE', 'JOINED', 'REJECTED', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'INCENTIVE_EARNED', 'GROUP_COMPLETED') DEFAULT 'INVITE',
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES group_purchases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- ALTER EXISTING TABLES TO SUPPORT SPLIT-BNPL
-- ============================================================

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS group_purchase_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_group_payments_made DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS network_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS co_signer_trustworthiness DECIMAL(5, 2) DEFAULT 50;

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_split_bnpl BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS group_id INT,
ADD COLUMN IF NOT EXISTS individual_share DECIMAL(10, 2),
ADD FOREIGN KEY (group_id) REFERENCES group_purchases(id);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_group_purchases_status ON group_purchases(status);
CREATE INDEX idx_group_purchases_created_by ON group_purchases(created_by);
CREATE INDEX idx_group_participants_group_id ON group_participants(group_id);
CREATE INDEX idx_group_participants_user_id ON group_participants(user_id);
CREATE INDEX idx_group_participants_status ON group_participants(status);
CREATE INDEX idx_group_installments_participant_id ON group_installments(participant_id);
CREATE INDEX idx_group_installments_status ON group_installments(status);
CREATE INDEX idx_group_notifications_user_id ON group_notifications(user_id);
CREATE INDEX idx_group_notifications_group_id ON group_notifications(group_id);
