public static function check_limit($tenant_id, $feature) {
    $plan = self::get_plan_info_by_tenant($tenant_id);
    return intval($plan->features[$feature] ?? 0);
}


-- outlets
CREATE TABLE {prefix}_outlets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- products
CREATE TABLE {prefix}_products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(191),
    name VARCHAR(255),
    price DECIMAL(10,2),
    stock INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- orders
CREATE TABLE {prefix}_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(191),
    customer_name VARCHAR(191),
    total DECIMAL(10,2),
    status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- order items
CREATE TABLE {prefix}_order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    product_id BIGINT,
    qty INT,
    price DECIMAL(10,2),
    subtotal DECIMAL(10,2)
);
