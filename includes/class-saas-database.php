<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Database {

    public static function create_global_tables() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();

        // Tabel Global (SaaS Management)
        $sqls = [
            "CREATE TABLE {$wpdb->prefix}saas_tenants (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                slug varchar(191) NOT NULL,
                owner_user_id bigint(20) NOT NULL,
                plan_id bigint(20) NOT NULL,
                email varchar(191) NOT NULL,
                status varchar(20) DEFAULT 'trial',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY slug (slug)
            ) $charset;",
            
            "CREATE TABLE {$wpdb->prefix}saas_plans (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                slug varchar(191) NOT NULL,
                price_month decimal(10,2) DEFAULT 0,
                price_year decimal(10,2) DEFAULT 0,
                trial_days int(11) DEFAULT 14,
                features text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            "CREATE TABLE {$wpdb->prefix}saas_subscriptions (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                tenant_id bigint(20) NOT NULL,
                plan_id bigint(20) NOT NULL,
                status varchar(20),
                started_at datetime,
                expires_at datetime,
                xendit_invoice_id varchar(255),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            "CREATE TABLE {$wpdb->prefix}saas_invoices (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                tenant_id bigint(20) NOT NULL,
                invoice_id varchar(255) NOT NULL,
                amount decimal(10,2) DEFAULT 0,
                status varchar(50),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;"
        ];

        foreach ($sqls as $sql) dbDelta($sql);
    }

    public static function create_tenant_schema($tenant_id) {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        
        // Prefix unik per tenant (misal: wp_tekra_t1_products)
        $p = "tekra_t{$tenant_id}_";

        $sqls = [
            // 1. CATEGORIES (Baru)
            "CREATE TABLE {$wpdb->prefix}{$p}categories (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                description text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 2. PRODUCTS (Diperlengkap ala WooCommerce)
            "CREATE TABLE {$wpdb->prefix}{$p}products (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                category_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                sku varchar(191),
                barcode varchar(191),
                description text,
                image_url text,
                price decimal(15,2) DEFAULT 0,      -- Harga Jual
                cost_price decimal(15,2) DEFAULT 0, -- HPP (Harga Modal)
                stock int(11) DEFAULT 0,
                manage_stock tinyint(1) DEFAULT 1,
                status varchar(20) DEFAULT 'active',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY sku (sku)
            ) $charset;",

            // 3. CUSTOMERS (Baru)
            "CREATE TABLE {$wpdb->prefix}{$p}customers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                phone varchar(50),
                email varchar(191),
                address text,
                points int(11) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 4. SUPPLIERS (Baru - Inventory)
            "CREATE TABLE {$wpdb->prefix}{$p}suppliers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                phone varchar(50),
                email varchar(191),
                address text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 5. ORDERS (Diperlengkap)
            "CREATE TABLE {$wpdb->prefix}{$p}orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_number varchar(191) NOT NULL,
                outlet_id bigint(20) NOT NULL,
                customer_id bigint(20) DEFAULT 0,
                payment_method varchar(50) DEFAULT 'cash',
                subtotal decimal(15,2) DEFAULT 0,
                tax_amount decimal(15,2) DEFAULT 0,
                discount_amount decimal(15,2) DEFAULT 0,
                total decimal(15,2) DEFAULT 0,
                amount_paid decimal(15,2) DEFAULT 0,
                change_return decimal(15,2) DEFAULT 0,
                status varchar(20) DEFAULT 'completed',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY order_number (order_number)
            ) $charset;",

            // 6. ORDER ITEMS
            "CREATE TABLE {$wpdb->prefix}{$p}order_items (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20) NOT NULL,
                product_id bigint(20) NOT NULL,
                product_name varchar(255), -- Snapshot nama saat beli
                qty int(11) NOT NULL,
                price decimal(15,2) NOT NULL, -- Harga satuan saat beli
                cost_price decimal(15,2) DEFAULT 0, -- HPP saat beli (untuk laporan laba)
                subtotal decimal(15,2) NOT NULL,
                note varchar(255),
                PRIMARY KEY (id)
            ) $charset;",

            // 7. OUTLETS
            "CREATE TABLE {$wpdb->prefix}{$p}outlets (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                address text,
                phone varchar(50),
                status varchar(20) DEFAULT 'active',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",
            
            // 8. STOCK LOGS (Inventory Movement)
            "CREATE TABLE {$wpdb->prefix}{$p}stock_logs (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                product_id bigint(20) NOT NULL,
                outlet_id bigint(20) DEFAULT 0,
                type varchar(50) DEFAULT 'sale', -- sale, restock, adjustment, transfer
                qty_change int(11) NOT NULL,
                stock_after int(11) NOT NULL,
                note varchar(255),
                reference_id varchar(191), -- Order ID atau PO Number
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 9. OPTIONS / SETTINGS (Baru - Key Value Store)
            // Untuk simpan setting struk, pajak, dll tanpa buat tabel baru terus
            "CREATE TABLE {$wpdb->prefix}{$p}options (
                option_name varchar(191) NOT NULL,
                option_value longtext,
                autoload varchar(20) DEFAULT 'yes',
                PRIMARY KEY (option_name)
            ) $charset;"
        ];

        foreach ($sqls as $sql) {
            dbDelta($sql);
        }

        // --- SEED INITIAL DATA (Jika Tabel Kosong) ---

        // 1. Default Outlet
        $outlet_table = $wpdb->prefix . $p . 'outlets';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $outlet_table") == 0) {
            $wpdb->insert($outlet_table, [
                'name' => 'Main Outlet',
                'address' => 'Pusat',
                'status' => 'active'
            ]);
        }

        // 2. Default Customer (Walk-in)
        $cust_table = $wpdb->prefix . $p . 'customers';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $cust_table") == 0) {
            $wpdb->insert($cust_table, [
                'name' => 'Walk-in Customer', // Pelanggan umum
                'phone' => '-',
                'email' => '-'
            ]);
        }

        // 3. Default Settings
        $opt_table = $wpdb->prefix . $p . 'options';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $opt_table") == 0) {
            $default_settings = [
                'app_name' => 'TekraERPOS',
                'tax_rate' => 0,
                'service_charge' => 0,
                'receipt_header' => 'Selamat Datang',
                'receipt_footer' => 'Terima Kasih'
            ];
            foreach($default_settings as $k => $v) {
                $wpdb->insert($opt_table, ['option_name' => $k, 'option_value' => $v]);
            }
        }
    }
}