<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Database {

    public static function create_global_tables() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();

        $sqls = [
           "CREATE TABLE {$wpdb->prefix}saas_tenants (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                slug varchar(191) NOT NULL,
                owner_user_id bigint(20) NOT NULL,
                plan_id bigint(20) NOT NULL,
                email varchar(191) NOT NULL,
                phone varchar(50), 
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
                price_month decimal(15,2) DEFAULT 0,
                price_year decimal(15,2) DEFAULT 0,
                trial_days int(11) DEFAULT 14,
                features longtext,
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
                amount decimal(15,2) DEFAULT 0,
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
        
        $p = "tekra_t{$tenant_id}_";
        
        $sqls = [
            // 1. CATEGORIES (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}categories (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                description text,
                sort_order int(11) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 2. BRANDS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}brands (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                description text,
                website varchar(255),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 3. TAXES (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}taxes (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                rate decimal(5,2) NOT NULL DEFAULT 0,
                is_active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 4. GRATUITY (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}gratuity (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                rate decimal(5,2) NOT NULL DEFAULT 0,
                is_default tinyint(1) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 5. SALES TYPES (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}sales_types (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                description text,
                is_active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 6. MODIFIERS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}modifiers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                type varchar(20) DEFAULT 'add',
                price_adjustment decimal(15,2) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

             // 7. DISCOUNTS (Added outlet_id)
             "CREATE TABLE {$wpdb->prefix}{$p}discounts (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                type varchar(20) DEFAULT 'percentage',
                value decimal(15,2) DEFAULT 0,
                apply_to varchar(50) DEFAULT 'all',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 8. PROMOS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}promos (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                code varchar(50),
                discount_type varchar(20),
                discount_value decimal(15,2),
                start_date date,
                end_date date,
                is_active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 9. PRODUCTS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}products (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                parent_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                sku varchar(191),
                barcode varchar(191),
                category_id bigint(20) DEFAULT 0,
                brand_id bigint(20) DEFAULT 0,
                type varchar(50) DEFAULT 'simple',
                description longtext,
                image_url text,
                price decimal(15,2) DEFAULT 0,
                cost_price decimal(15,2) DEFAULT 0,
                stock int(11) DEFAULT 0,
                manage_stock tinyint(1) DEFAULT 1,
                stock_alert int(11) DEFAULT 5,
                tax_status varchar(20) DEFAULT 'taxable',
                is_favorite tinyint(1) DEFAULT 0,
                status varchar(20) DEFAULT 'active',
                is_ecommerce tinyint(1) DEFAULT 0,
                condition_type varchar(20) DEFAULT 'New',
                weight decimal(10,2) DEFAULT 0,
                length decimal(10,2) DEFAULT 0,
                width decimal(10,2) DEFAULT 0,
                height decimal(10,2) DEFAULT 0,
                is_preorder tinyint(1) DEFAULT 0,
                online_image_url text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY sku (sku),
                KEY category_id (category_id),
                KEY parent_id (parent_id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 10. PRODUCT MODIFIERS
            "CREATE TABLE {$wpdb->prefix}{$p}product_modifiers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                product_id bigint(20) NOT NULL,
                modifier_id bigint(20) NOT NULL,
                sort_order int(11) DEFAULT 0,
                PRIMARY KEY (id),
                KEY product_id (product_id)
            ) $charset;",

            // 11. BUNDLES (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}bundles (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                sku varchar(191),
                description text,
                price decimal(15,2) DEFAULT 0,
                items_json longtext,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 12. CUSTOMERS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}customers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                phone varchar(50),
                email varchar(191),
                address text,
                points int(11) DEFAULT 0,
                total_spent decimal(15,2) DEFAULT 0,
                last_visit datetime,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 13. SUPPLIERS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}suppliers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                contact_person varchar(191),
                phone varchar(50),
                email varchar(191),
                address text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 14. ORDERS
            "CREATE TABLE {$wpdb->prefix}{$p}orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_number varchar(191) NOT NULL,
                outlet_id bigint(20) NOT NULL,
                customer_id bigint(20) DEFAULT 0,
                sales_type_id bigint(20) DEFAULT 0,
                subtotal decimal(15,2) DEFAULT 0,
                discount_amount decimal(15,2) DEFAULT 0,
                tax_amount decimal(15,2) DEFAULT 0,
                gratuity_amount decimal(15,2) DEFAULT 0,
                total decimal(15,2) DEFAULT 0,
                payment_method varchar(50) DEFAULT 'cash',
                amount_paid decimal(15,2) DEFAULT 0,
                change_return decimal(15,2) DEFAULT 0,
                status varchar(20) DEFAULT 'completed',
                notes text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                created_by bigint(20) DEFAULT 0,
                PRIMARY KEY (id),
                UNIQUE KEY order_number (order_number)
            ) $charset;",

            // 15. ORDER ITEMS
            "CREATE TABLE {$wpdb->prefix}{$p}order_items (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20) NOT NULL,
                product_id bigint(20) NOT NULL,
                product_name varchar(255),
                sku varchar(191),
                qty int(11) NOT NULL,
                price decimal(15,2) NOT NULL,
                cost_price decimal(15,2) DEFAULT 0,
                discount_amount decimal(15,2) DEFAULT 0,
                tax_amount decimal(15,2) DEFAULT 0,
                subtotal decimal(15,2) NOT NULL,
                meta_data longtext,
                note varchar(255),
                PRIMARY KEY (id),
                KEY order_id (order_id)
            ) $charset;",

            // 16. OUTLETS
            "CREATE TABLE {$wpdb->prefix}{$p}outlets (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                address text,
                phone varchar(50),
                status varchar(20) DEFAULT 'active',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",
            
            // 17. STOCK LOGS
          "CREATE TABLE {$wpdb->prefix}{$p}stock_logs (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                product_id bigint(20) NOT NULL,
                outlet_id bigint(20) DEFAULT 0,
                type varchar(50) DEFAULT 'sale',
                qty_change int(11) NOT NULL,
                stock_after int(11) NOT NULL,
                reference_id varchar(191),
                note varchar(255),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                created_by bigint(20) DEFAULT 0,
                PRIMARY KEY (id)
            ) $charset;",
            
            // 18. BANK ACCOUNTS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}bank_accounts (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                bank varchar(50) NOT NULL,
                number varchar(50) NOT NULL,
                name varchar(191) NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 19. PURCHASE ORDERS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}purchase_orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                supplier_id bigint(20),
                date date,
                status varchar(20) DEFAULT 'pending',
                total decimal(15,2) DEFAULT 0,
                notes text,
                items longtext, -- KOLOM BARU: Simpan JSON array item belanja
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 20. STOCK TRANSFERS
           "CREATE TABLE {$wpdb->prefix}{$p}stock_transfers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                date date,
                from_outlet bigint(20) DEFAULT 0, -- Ganti nama kolom agar jelas
                to_outlet bigint(20) DEFAULT 0,   -- Ganti nama kolom agar jelas
                status varchar(20) DEFAULT 'pending',
                items_count int(11) DEFAULT 0,
                items longtext, -- KOLOM BARU: Simpan JSON array item transfer
                notes text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 21. STOCK ADJUSTMENTS (Added outlet_id)
           "CREATE TABLE {$wpdb->prefix}{$p}stock_adjustments (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                date date,
                type varchar(20) DEFAULT 'opname', -- add/sub/opname
                reason varchar(191), -- atau notes
                product_id bigint(20),
                qty int(11),
                user varchar(50),
                notes text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 22. TABLE GROUPS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}table_groups (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 23. TABLES (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}tables (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                name varchar(50) NOT NULL,
                group_id bigint(20),
                status varchar(20) DEFAULT 'available',
                x int(11) DEFAULT 0,
                y int(11) DEFAULT 0,
                type varchar(20) DEFAULT 'standard',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 24. CDS CAMPAIGNS (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}cds_campaigns (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                image_url text NOT NULL,
                active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 25. CUSTOMER FEEDBACK (Added outlet_id)
            "CREATE TABLE {$wpdb->prefix}{$p}customer_feedback (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                outlet_id bigint(20) DEFAULT 0,
                customer_name varchar(191),
                rating int(1) DEFAULT 5,
                comment text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY outlet_id (outlet_id)
            ) $charset;",

            // 26. OPTIONS
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

        self::seed_initial_data($wpdb, $p);
    }

    private static function seed_initial_data($wpdb, $p) {
        // 1. Outlet
        $outlet_table = $wpdb->prefix . $p . 'outlets';
        $main_outlet_id = 1;

        if ($wpdb->get_var("SELECT COUNT(*) FROM $outlet_table") == 0) {
            $wpdb->insert($outlet_table, ['name' => 'Main Outlet', 'address' => 'Pusat', 'status' => 'active']);
            $main_outlet_id = $wpdb->insert_id;
        } else {
            // Ambil ID outlet pertama yang ada jika tabel tidak kosong
            $main_outlet_id = $wpdb->get_var("SELECT id FROM $outlet_table ORDER BY id ASC LIMIT 1");
        }

        // 2. Customer Default (Kaitkan ke Main Outlet)
        $cust_table = $wpdb->prefix . $p . 'customers';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $cust_table") == 0) {
            $wpdb->insert($cust_table, ['outlet_id' => $main_outlet_id, 'name' => 'Walk-in Customer', 'phone' => '-', 'email' => '-']);
        }

        // 3. Sales Types Default (Kaitkan ke Main Outlet)
        $st_table = $wpdb->prefix . $p . 'sales_types';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $st_table") == 0) {
            $wpdb->insert($st_table, ['outlet_id' => $main_outlet_id, 'name' => 'Dine In', 'description' => 'Makan di tempat']);
            $wpdb->insert($st_table, ['outlet_id' => $main_outlet_id, 'name' => 'Takeaway', 'description' => 'Bungkus']);
            $wpdb->insert($st_table, ['outlet_id' => $main_outlet_id, 'name' => 'Delivery', 'description' => 'Pengiriman kurir']);
        }

        // 4. Settings Default
        $opt_table = $wpdb->prefix . $p . 'options';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $opt_table") == 0) {
            $defaults = [
                'app_currency' => 'IDR',
                'enable_stock_warning' => 1,
                'stock_warning_limit' => 5,
                'receipt_header' => 'Welcome',
                'receipt_footer' => 'Thank You'
            ];
            foreach($defaults as $k => $v) {
                $wpdb->insert($opt_table, ['option_name' => $k, 'option_value' => $v]);
            }
        }
    }
}