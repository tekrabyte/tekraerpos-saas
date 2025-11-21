CREATE TABLE wp_saas_tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE,
    owner_user_id BIGINT DEFAULT 0,
    plan_id BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'trial',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE wp_saas_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE,
    price_month DECIMAL(10,2),
    price_year DECIMAL(10,2),
    trial_days INT DEFAULT 14,
    features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wp_saas_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    status VARCHAR(50),
    started_at DATETIME,
    expires_at DATETIME,
    xendit_invoice_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
