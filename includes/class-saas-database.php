<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Database {

    public static function create_global_tables() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();

        // Tabel Global (SaaS Management - Tidak berubah banyak)
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
        
        // Prefix unik per tenant
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        $p = "tekra_t{$tenant_id}_";
        $sqls = [
            // --- MASTER DATA (LIBRARY) ---
               "CREATE TABLE {$wpdb->prefix}{$p}products (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                parent_id bigint(20) DEFAULT 0,
                name varchar(191) NOT NULL,
                sku varchar(191),
                barcode varchar(191),
                category_id bigint(20) DEFAULT 0,
                brand_id bigint(20) DEFAULT 0,
                type varchar(20) DEFAULT 'simple',
                description longtext,
                image_url text,
                price decimal(15,2) DEFAULT 0,
                cost_price decimal(15,2) DEFAULT 0,
                stock int(11) DEFAULT 0,
                manage_stock tinyint(1) DEFAULT 1,
                stock_alert int(11) DEFAULT 5,
                is_ecommerce tinyint(1) DEFAULT 0,
                condition_type varchar(20) DEFAULT 'New',
                weight decimal(10,2) DEFAULT 0,
                length decimal(10,2) DEFAULT 0,
                width decimal(10,2) DEFAULT 0,
                height decimal(10,2) DEFAULT 0,
                is_preorder tinyint(1) DEFAULT 0,
                online_image_url text,
                status varchar(20) DEFAULT 'active',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 1. CATEGORIES
            "CREATE TABLE {$wpdb->prefix}{$p}categories (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                description text,
                sort_order int(11) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 2. BRANDS
            "CREATE TABLE {$wpdb->prefix}{$p}brands (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                description text,
                website varchar(255),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 3. TAXES (Pajak)
            "CREATE TABLE {$wpdb->prefix}{$p}taxes (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                rate decimal(5,2) NOT NULL DEFAULT 0, -- Persentase
                is_active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 4. GRATUITY (Service Charge)
            "CREATE TABLE {$wpdb->prefix}{$p}gratuity (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                rate decimal(5,2) NOT NULL DEFAULT 0,
                is_default tinyint(1) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 5. SALES TYPES (Dine In, Takeaway, GoFood, dll)
            "CREATE TABLE {$wpdb->prefix}{$p}sales_types (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                description text,
                is_active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 6. MODIFIERS (Topping, Sugar Level, dll)
            "CREATE TABLE {$wpdb->prefix}{$p}modifiers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                type varchar(20) DEFAULT 'add', -- add (tambah harga) / sub (kurang harga) / info (catatan aja)
                price_adjustment decimal(15,2) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

             // 7. DISCOUNTS
             "CREATE TABLE {$wpdb->prefix}{$p}discounts (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                type varchar(20) DEFAULT 'percentage', -- percentage / fixed
                value decimal(15,2) DEFAULT 0,
                apply_to varchar(50) DEFAULT 'all', -- all / specific
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 8. PROMOS
            "CREATE TABLE {$wpdb->prefix}{$p}promos (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                code varchar(50),
                discount_type varchar(20),
                discount_value decimal(15,2),
                start_date date,
                end_date date,
                is_active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // --- CORE PRODUCTS ---

            // 9. PRODUCTS (Revisi Lengkap ala WooCommerce)
            "CREATE TABLE {$wpdb->prefix}{$p}products (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                sku varchar(191),
                barcode varchar(191),
                category_id bigint(20) DEFAULT 0,
                brand_id bigint(20) DEFAULT 0,
                
                -- Relasi Parent-Child untuk Varian
                parent_id bigint(20) DEFAULT 0, 

                type varchar(50) DEFAULT 'simple', -- simple, variable, variation, bundle
                description longtext,
                image_url text,
                
                -- Pricing
                price decimal(15,2) DEFAULT 0,      -- Harga Jual
                cost_price decimal(15,2) DEFAULT 0, -- HPP
                
                -- Inventory
                stock int(11) DEFAULT 0,
                manage_stock tinyint(1) DEFAULT 1,
                stock_alert int(11) DEFAULT 5,
                
                -- Configuration
                tax_status varchar(20) DEFAULT 'taxable', -- taxable, none
                is_favorite tinyint(1) DEFAULT 0,         -- Untuk Quick Access di POS
                status varchar(20) DEFAULT 'active',      -- active, draft, archived

                -- Online Channel / E-commerce
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
                KEY parent_id (parent_id)
            ) $charset;",

            // 10. PRODUCT MODIFIERS (Many-to-Many: Produk mana punya Modifier apa)
            "CREATE TABLE {$wpdb->prefix}{$p}product_modifiers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                product_id bigint(20) NOT NULL,
                modifier_id bigint(20) NOT NULL,
                sort_order int(11) DEFAULT 0,
                PRIMARY KEY (id),
                KEY product_id (product_id)
            ) $charset;",

            // 11. BUNDLES (Paket Produk)
            "CREATE TABLE {$wpdb->prefix}{$p}bundles (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                sku varchar(191),
                description text,
                price decimal(15,2) DEFAULT 0,
                items_json longtext, -- Simpan list ID produk dan qty dalam JSON: [{id:1, qty:2}, {id:5, qty:1}]
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // --- TRANSACTION & STAKEHOLDERS ---

            // 12. CUSTOMERS
            "CREATE TABLE {$wpdb->prefix}{$p}customers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                phone varchar(50),
                email varchar(191),
                address text,
                points int(11) DEFAULT 0,
                total_spent decimal(15,2) DEFAULT 0,
                last_visit datetime,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 13. SUPPLIERS
            "CREATE TABLE {$wpdb->prefix}{$p}suppliers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                contact_person varchar(191),
                phone varchar(50),
                email varchar(191),
                address text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 14. ORDERS (Transaksi Header)
            "CREATE TABLE {$wpdb->prefix}{$p}orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_number varchar(191) NOT NULL,
                outlet_id bigint(20) NOT NULL,
                customer_id bigint(20) DEFAULT 0,
                sales_type_id bigint(20) DEFAULT 0, -- Dine In, Takeaway
                
                -- Amounts
                subtotal decimal(15,2) DEFAULT 0,
                discount_amount decimal(15,2) DEFAULT 0,
                tax_amount decimal(15,2) DEFAULT 0,
                gratuity_amount decimal(15,2) DEFAULT 0,
                total decimal(15,2) DEFAULT 0,
                
                -- Payment
                payment_method varchar(50) DEFAULT 'cash',
                amount_paid decimal(15,2) DEFAULT 0,
                change_return decimal(15,2) DEFAULT 0,
                
                status varchar(20) DEFAULT 'completed',
                notes text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                created_by bigint(20) DEFAULT 0, -- User ID / Cashier
                PRIMARY KEY (id),
                UNIQUE KEY order_number (order_number)
            ) $charset;",

            // 15. ORDER ITEMS (Transaksi Detail)
            "CREATE TABLE {$wpdb->prefix}{$p}order_items (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20) NOT NULL,
                product_id bigint(20) NOT NULL,
                product_name varchar(255), -- Snapshot nama
                sku varchar(191),
                
                qty int(11) NOT NULL,
                price decimal(15,2) NOT NULL,     -- Harga jual saat itu
                cost_price decimal(15,2) DEFAULT 0, -- HPP saat itu (PENTING untuk laporan laba)
                
                discount_amount decimal(15,2) DEFAULT 0,
                tax_amount decimal(15,2) DEFAULT 0,
                subtotal decimal(15,2) NOT NULL, -- (qty * price) - discount
                
                meta_data longtext, -- JSON untuk menyimpan varian/modifiers yang dipilih: {modifiers: [{name: 'Extra Cheese', price: 5000}]}
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
            
            // 17. STOCK LOGS (Mutasi Stok)
            "CREATE TABLE {$wpdb->prefix}{$p}stock_logs (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                product_id bigint(20) NOT NULL,
                outlet_id bigint(20) DEFAULT 0,
                type varchar(50) DEFAULT 'sale', -- sale, restock, adjustment, transfer_in, transfer_out, void
                qty_change int(11) NOT NULL,
                stock_after int(11) NOT NULL,
                reference_id varchar(191), -- No Order / No PO
                note varchar(255),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                created_by bigint(20) DEFAULT 0,
                PRIMARY KEY (id)
            ) $charset;",
            
            // 18. BANK ACCOUNTS
            "CREATE TABLE {$wpdb->prefix}{$p}bank_accounts (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                bank varchar(50) NOT NULL,
                number varchar(50) NOT NULL,
                name varchar(191) NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 19. PURCHASE ORDERS
            "CREATE TABLE {$wpdb->prefix}{$p}purchase_orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                supplier_id bigint(20),
                date date,
                status varchar(20) DEFAULT 'pending',
                total decimal(15,2) DEFAULT 0,
                notes text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 20. STOCK TRANSFERS
            "CREATE TABLE {$wpdb->prefix}{$p}stock_transfers (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                date date,
                from_loc varchar(191),
                to_loc varchar(191),
                status varchar(20) DEFAULT 'pending',
                items_count int(11) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 21. STOCK ADJUSTMENTS
            "CREATE TABLE {$wpdb->prefix}{$p}stock_adjustments (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                date date,
                reason varchar(191),
                product_id bigint(20),
                qty int(11),
                user varchar(50),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 22. TABLE GROUPS
            "CREATE TABLE {$wpdb->prefix}{$p}table_groups (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191) NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 23. TABLES
            "CREATE TABLE {$wpdb->prefix}{$p}tables (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(50) NOT NULL,
                group_id bigint(20),
                status varchar(20) DEFAULT 'available',
                x int(11) DEFAULT 0,
                y int(11) DEFAULT 0,
                type varchar(20) DEFAULT 'standard',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 24. CDS CAMPAIGNS
            "CREATE TABLE {$wpdb->prefix}{$p}cds_campaigns (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                image_url text NOT NULL,
                active tinyint(1) DEFAULT 1,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 25. CUSTOMER FEEDBACK
            "CREATE TABLE {$wpdb->prefix}{$p}customer_feedback (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                customer_name varchar(191),
                rating int(1) DEFAULT 5,
                comment text,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            // 26. OPTIONS (Key-Value Settings)
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

        // --- INITIAL SEEDING ---
        self::seed_initial_data($wpdb, $p);
    }

    private static function seed_initial_data($wpdb, $p) {
        // 1. Outlet
        $outlet_table = $wpdb->prefix . $p . 'outlets';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $outlet_table") == 0) {
            $wpdb->insert($outlet_table, ['name' => 'Main Outlet', 'address' => 'Pusat', 'status' => 'active']);
        }

        // 2. Customer Default
        $cust_table = $wpdb->prefix . $p . 'customers';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $cust_table") == 0) {
            $wpdb->insert($cust_table, ['name' => 'Walk-in Customer', 'phone' => '-', 'email' => '-']);
        }

        // 3. Sales Types Default
        $st_table = $wpdb->prefix . $p . 'sales_types';
        if ($wpdb->get_var("SELECT COUNT(*) FROM $st_table") == 0) {
            $wpdb->insert($st_table, ['name' => 'Dine In', 'description' => 'Makan di tempat']);
            $wpdb->insert($st_table, ['name' => 'Takeaway', 'description' => 'Bungkus']);
            $wpdb->insert($st_table, ['name' => 'Delivery', 'description' => 'Pengiriman kurir']);
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