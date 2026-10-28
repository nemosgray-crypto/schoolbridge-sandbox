-- ====================================================================
-- OFFLINE ARCHIVE SCHEMA REFERENCE
-- Note: This database structure file is disconnected from active logic.
-- It remains perfectly preserved here as a structural blueprint reference.
-- ====================================================================

CREATE TYPE account_status_type AS ENUM ('active', 'pending_review', 'suspended_system_abuse', 'lapsed');
CREATE TYPE verification_status_type AS ENUM ('pending', 'approved', 'rejected', 'grace_period', 'lapsed');
CREATE TYPE badge_style_type AS ENUM ('blue_star', 'gold_store', 'green_verified', 'none');
CREATE TYPE appeal_status_type AS ENUM ('none', 'pending', 'approved', 'final_rejection');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    role VARCHAR(20) DEFAULT 'student',
    account_status account_status_type DEFAULT 'active',
    root_owner_flag BOOLEAN DEFAULT FALSE,
    standard_points INT DEFAULT 0,
    enterprise_points INT DEFAULT 0,
    hardware_device_id VARCHAR(255),
    browser_fingerprint VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status verification_status_type DEFAULT 'pending',
    badge_style badge_style_type DEFAULT 'none',
    amount_paid NUMERIC(6,2) DEFAULT 0.00,
    mpesa_receipt_code VARCHAR(50) UNIQUE,
    next_billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_payment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_appeals (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INT NOT NULL,
    appeal_text TEXT,
    status appeal_status_type DEFAULT 'none',
    appeal_count_24h INT DEFAULT 0,
    last_attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_root_owner_flag ON users(root_owner_flag);
CREATE INDEX idx_billing_renewals ON verification_profiles(next_billing_date, status);
CREATE INDEX idx_appeals_rate_limit ON user_appeals(user_id, last_attempt_timestamp);
