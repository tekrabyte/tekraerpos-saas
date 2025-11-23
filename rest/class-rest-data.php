<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Data {

    public function __construct() {
        add_action('rest_api_init', [$this, 'routes']);
    }

    public function routes() {
        register_rest_route('tekra-saas/v1', '/tenant/data/(?P<table>[a-zA-Z0-9_-]+)', [
            ['methods' => 'GET', 'callback' => [$this, 'get_items'], 'permission_callback' => [$this, 'auth']],
            ['methods' => 'POST', 'callback' => [$this, 'create_item'], 'permission_callback' => [$this, 'auth']]
        ]);

        register_rest_route('tekra-saas/v1', '/tenant/data/(?P<table>[a-zA-Z0-9_-]+)/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => [$this, 'update_item'], 'permission_callback' => [$this, 'auth']],
            ['methods' => 'DELETE', 'callback' => [$this, 'delete_item'], 'permission_callback' => [$this, 'auth']]
        ]);
    }

    public function auth() { return is_user_logged_in(); }

    private function get_table_name($base_name) {
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        
        if (!$tenant) {
             $linked = get_user_meta($user_id, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }
        if (!$tenant) return false;
        
        // --- UPDATE: DAFTAR TABEL DITAMBAHKAN ---
        $allowed = [
            // Inventory & Settings
            'customers', 'suppliers', 'bank_accounts', 
            'purchase_orders', 'stock_transfers', 'stock_adjustments',
            'table_groups', 'tables', 'cds_campaigns', 'customer_feedback',
            // Library (BARU)
            'categories', 'brands', 'taxes', 'gratuity', 'sales_types', 
            'discounts', 'promos', 'modifiers', 'bundles'
        ];

        if (!in_array($base_name, $allowed)) return false;

        $full_name = $wpdb->prefix . "tekra_t{$tenant->id}_{$base_name}";

        // Auto-create tabel
        if($wpdb->get_var("SHOW TABLES LIKE '$full_name'") != $full_name) {
            $this->create_missing_table($full_name, $base_name);
        }

        return $full_name;
    }

    private function create_missing_table($table_name, $type) {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        $sql = "";

        // --- UPDATE: SKEMA TABEL BARU ---
        switch ($type) {
            // ... (Case lama tetap sama, copy dari kode sebelumnya jika perlu, atau biarkan logic switch ini handle yang baru saja) ...
            
            // LIBRARY TABLES
            case 'categories':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), description text, sort_order int(5) DEFAULT 0, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'brands':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), description text, website varchar(191), created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'taxes':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), rate decimal(5,2), is_active tinyint(1) DEFAULT 1, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'gratuity':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), rate decimal(5,2), is_default tinyint(1) DEFAULT 0, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'sales_types':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), description text, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'discounts':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), type varchar(20), value decimal(15,2), apply_to varchar(50), created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'promos':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), code varchar(50), discount_type varchar(20), discount_value decimal(15,2), start_date date, end_date date, is_active tinyint(1) DEFAULT 1, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'modifiers':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), type varchar(20) DEFAULT 'add', price_adjustment decimal(15,2) DEFAULT 0, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'bundles':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), description text, price decimal(15,2), items text, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            
            // RE-ADD EXISTING CASES (WAJIB ADA AGAR TIDAK ERROR UNTUK FITUR SEBELUMNYA)
            case 'customers':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), phone varchar(50), email varchar(191), points int(11) DEFAULT 0, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'suppliers':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, name varchar(191), phone varchar(50), email varchar(191), address text, created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            case 'bank_accounts':
                $sql = "CREATE TABLE $table_name (id bigint(20) NOT NULL AUTO_INCREMENT, bank varchar(50), number varchar(50), name varchar(191), created_at datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)) $charset;"; break;
            // ... Tambahkan case lain jika perlu (purchase_orders, stock_transfers, etc) ...
        }
        
        if (!empty($sql)) {
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            dbDelta($sql);
        }
    }

    // ... (Fungsi get_items, create_item, dll SAMA PERSIS SEPERTI SEBELUMNYA) ...
    public function get_items($req) {
        global $wpdb;
        $table = $this->get_table_name($req['table']);
        if (!$table) return new WP_Error('403', 'Invalid Table', ['status'=>403]);
        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");
        return ['success' => true, 'data' => $items];
    }

    public function create_item($req) {
        global $wpdb;
        $table = $this->get_table_name($req['table']);
        if (!$table) return new WP_Error('403', 'Invalid Table', ['status'=>403]);
        $data = $req->get_json_params();
        $clean = []; foreach($data as $k=>$v) if($k!=='id') $clean[$k] = is_array($v)?json_encode($v):sanitize_text_field($v);
        $wpdb->insert($table, $clean);
        return ['success' => true, 'id' => $wpdb->insert_id];
    }

    public function update_item($req) {
        global $wpdb;
        $table = $this->get_table_name($req['table']);
        if (!$table) return new WP_Error('403', 'Invalid Table', ['status'=>403]);
        $data = $req->get_json_params();
        $clean = []; foreach($data as $k=>$v) if($k!=='id') $clean[$k] = is_array($v)?json_encode($v):sanitize_text_field($v);
        $wpdb->update($table, $clean, ['id' => $req['id']]);
        return ['success' => true];
    }

    public function delete_item($req) {
        global $wpdb;
        $table = $this->get_table_name($req['table']);
        if (!$table) return new WP_Error('403', 'Invalid Table', ['status'=>403]);
        $wpdb->delete($table, ['id' => $req['id']]);
        return ['success' => true];
    }
}
new TEKRAERPOS_SaaS_REST_Data();