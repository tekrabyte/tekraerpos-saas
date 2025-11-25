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

    private function get_table_name($base_name, $tenant_id) {
        global $wpdb;
        $allowed = [
            'customers', 'suppliers', 'bank_accounts', 'purchase_orders', 
            'stock_transfers', 'stock_adjustments', 'table_groups', 'tables', 
            'cds_campaigns', 'customer_feedback', 'categories', 'brands', 
            'taxes', 'gratuity', 'sales_types', 'discounts', 'promos', 
            'modifiers', 'bundles'
        ];

        if (!in_array($base_name, $allowed)) return false;
        return $wpdb->prefix . "tekra_t{$tenant_id}_{$base_name}";
    }

    private function get_tenant() {
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        if (!$tenant) {
             $linked = get_user_meta($user_id, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }
        return $tenant;
    }

    public function get_items($req) {
        global $wpdb;
        $tenant = $this->get_tenant();
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status'=>404]);

        $table = $this->get_table_name($req['table'], $tenant->id);
        if (!$table) return new WP_Error('403', 'Invalid Table', ['status'=>403]);

        $outlet_id = isset($req['outlet_id']) ? intval($req['outlet_id']) : 0;
        $sql = "SELECT * FROM $table";
        
        // Cek apakah tabel punya kolom outlet_id sebelum filter
        $cols = $wpdb->get_col("DESC $table", 0);
        if ($outlet_id > 0 && in_array('outlet_id', $cols)) {
            $sql .= $wpdb->prepare(" WHERE outlet_id = %d", $outlet_id);
        } else if ($outlet_id > 0 && $req['table'] === 'stock_transfers') {
             // Khusus Transfer, cek from/to
             $sql .= $wpdb->prepare(" WHERE from_outlet = %d OR to_outlet = %d", $outlet_id, $outlet_id);
        }

        $sql .= " ORDER BY id DESC";
        
        $items = $wpdb->get_results($sql);
        
        // Decode JSON columns automatically
        foreach ($items as $key => $item) {
            if (isset($item->items)) $items[$key]->items = json_decode($item->items);
            if (isset($item->items_json)) $items[$key]->items_json = json_decode($item->items_json);
        }

        return ['success' => true, 'data' => $items];
    }

    public function create_item($req) {
        global $wpdb;
        $tenant = $this->get_tenant();
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status'=>404]);

        $table_name = $req['table'];
        $table = $this->get_table_name($table_name, $tenant->id);
        if (!$table) return new WP_Error('403', 'Invalid Table', ['status'=>403]);
        
        $data = $req->get_json_params();
        $clean = []; 
        
        // Prepare Data
        foreach($data as $k=>$v) {
            if($k!=='id') {
                // Convert Array/Object to JSON string (untuk items PO/Transfer)
                $clean[$k] = (is_array($v) || is_object($v)) ? json_encode($v) : sanitize_text_field($v);
            }
        }
        
        $wpdb->insert($table, $clean);
        $insert_id = $wpdb->insert_id;

        // --- LOGIKA INVENTORY SIDE EFFECTS ---
        if ($table_name === 'stock_adjustments') {
            $this->handle_stock_adjustment($tenant->id, $clean, $insert_id);
        }

        return ['success' => true, 'id' => $insert_id];
    }

    public function update_item($req) {
        global $wpdb;
        $tenant = $this->get_tenant();
        $table = $this->get_table_name($req['table'], $tenant->id);
        
        $data = $req->get_json_params();
        $clean = []; 
        foreach($data as $k=>$v) {
            if($k!=='id') {
                $clean[$k] = (is_array($v) || is_object($v)) ? json_encode($v) : sanitize_text_field($v);
            }
        }
        
        $wpdb->update($table, $clean, ['id' => $req['id']]);
        return ['success' => true];
    }

    public function delete_item($req) {
        global $wpdb;
        $tenant = $this->get_tenant();
        $table = $this->get_table_name($req['table'], $tenant->id);
        $wpdb->delete($table, ['id' => $req['id']]);
        return ['success' => true];
    }

    // --- HELPER: Handle Perubahan Stok (Adjustment) ---
    private function handle_stock_adjustment($tenant_id, $data, $adj_id) {
        global $wpdb;
        $p = $wpdb->prefix . "tekra_t{$tenant_id}_";
        
        $product_id = intval($data['product_id']);
        $outlet_id  = intval($data['outlet_id']);
        $qty_input  = intval($data['qty']);
        $type       = $data['type']; // add, sub, opname
        
        // Ambil stok saat ini
        $current_stock = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT stock FROM {$p}products WHERE id=%d", $product_id
        ));

        $qty_change = 0;
        $new_stock = $current_stock;

        if ($type === 'add') {
            $qty_change = $qty_input;
            $new_stock  = $current_stock + $qty_input;
        } elseif ($type === 'sub') {
            $qty_change = -$qty_input;
            $new_stock  = $current_stock - $qty_input;
        } elseif ($type === 'opname') {
            $qty_change = $qty_input - $current_stock;
            $new_stock  = $qty_input;
        }

        // 1. Update Master Produk
        $wpdb->update("{$p}products", ['stock' => $new_stock], ['id' => $product_id]);

        // 2. Catat Log
        $wpdb->insert("{$p}stock_logs", [
            'product_id'   => $product_id,
            'outlet_id'    => $outlet_id,
            'type'         => 'adjustment',
            'qty_change'   => $qty_change,
            'stock_after'  => $new_stock,
            'reference_id' => "ADJ-$adj_id",
            'note'         => $data['notes'] ?? $data['reason'],
            'created_at'   => current_time('mysql'),
            'created_by'   => get_current_user_id()
        ]);
    }
}
new TEKRAERPOS_SaaS_REST_Data();