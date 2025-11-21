<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Database {
    public static function create_global_tables() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();

        // Tabel Global
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
        $p = "tekra_t{$tenant_id}_";

        $sqls = [
            "CREATE TABLE {$wpdb->prefix}{$p}products (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191),
                sku varchar(191),
                price decimal(10,2),
                stock int(11) DEFAULT 0,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            "CREATE TABLE {$wpdb->prefix}{$p}orders (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_number varchar(191),
                outlet_id bigint(20),
                total decimal(10,2),
                status varchar(20) DEFAULT 'completed',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",

            "CREATE TABLE {$wpdb->prefix}{$p}order_items (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                order_id bigint(20),
                product_id bigint(20),
                qty int(11),
                price decimal(10,2),
                subtotal decimal(10,2),
                PRIMARY KEY (id)
            ) $charset;",

            "CREATE TABLE {$wpdb->prefix}{$p}outlets (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                name varchar(191),
                address text,
                status varchar(20) DEFAULT 'active',
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;",
            
            "CREATE TABLE {$wpdb->prefix}{$p}stock_logs (
                id bigint(20) NOT NULL AUTO_INCREMENT,
                product_id bigint(20),
                qty_change int(11),
                note varchar(255),
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) $charset;"
        ];

        foreach ($sqls as $sql) dbDelta($sql);

        // Default Outlet
        $wpdb->insert("{$wpdb->prefix}{$p}outlets", ['name'=>'Main Outlet', 'address'=>'Headquarters']);
    }
}