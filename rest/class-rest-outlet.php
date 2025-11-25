<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Outlet {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $namespace = 'tekra-saas/v1';
        $base      = 'tenant/outlets';

        // GET: List Outlets
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_items'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // POST: Create Outlet (Auto-Seed ALL Library Data)
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'POST',
            'callback'            => [$this, 'create_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // PUT: Update Outlet
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'update_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // DELETE: Delete Outlet
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'delete_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    private function get_tenant_info() {
        $user_id = get_current_user_id();
        return TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
    }

    public function get_items($request) {
        global $wpdb;
        $tenant = $this->get_tenant_info();
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        $table = $wpdb->prefix . "tekra_t{$tenant->id}_outlets";
        
        if($wpdb->get_var("SHOW TABLES LIKE '$table'") != $table) {
            return rest_ensure_response(['outlets' => []]);
        }

        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");

        return rest_ensure_response(['outlets' => $items]);
    }

    public function create_item($request) {
        global $wpdb;
        $tenant = $this->get_tenant_info();
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        // 1. Cek Limit Plan
        $limits = TEKRAERPOS_SaaS_Tenant::get_plan_limits($tenant->id);
        $table_outlet = $wpdb->prefix . "tekra_t{$tenant->id}_outlets";
        $current_count = (int) $wpdb->get_var("SELECT COUNT(*) FROM $table_outlet");

        if ($current_count >= $limits['multi_outlet']) {
            return new WP_Error('limit_reached', 'Outlet limit reached. Please upgrade your plan.', ['status' => 403]);
        }

        // 2. Insert Outlet Baru
        $data = [
            'name'       => sanitize_text_field($request['name']),
            'address'    => sanitize_textarea_field($request['address']),
            'status'     => 'active',
            'created_at' => current_time('mysql')
        ];

        $inserted = $wpdb->insert($table_outlet, $data);

        if ($inserted === false) {
            return new WP_Error('db_error', 'Gagal menyimpan outlet.', ['status' => 500]);
        }

        $new_outlet_id = $wpdb->insert_id;

        // 3. AUTO-SEED ALL LIBRARY DATA
        // Membuatkan data default untuk semua tabel library agar outlet mandiri
        $this->seed_all_library_data($tenant->id, $new_outlet_id);

        return rest_ensure_response(['success' => true, 'id' => $new_outlet_id]);
    }

    /**
     * FUNGSI BARU: Seed Data untuk SEMUA Tabel Library
     */
    private function seed_all_library_data($tenant_id, $outlet_id) {
        global $wpdb;
        $p = $wpdb->prefix . "tekra_t{$tenant_id}_";
        $now = current_time('mysql');

        // 1. SALES TYPES (Dine In, Takeaway, etc)
        if ($this->table_exists($p . 'sales_types')) {
            $types = [
                ['name' => 'Dine In', 'description' => 'Makan di tempat'],
                ['name' => 'Takeaway', 'description' => 'Bungkus bawa pulang'],
                ['name' => 'Delivery', 'description' => 'Pengiriman kurir'],
                ['name' => 'Gofood', 'description' => 'Online Order']
            ];
            foreach ($types as $t) {
                $wpdb->insert($p . 'sales_types', array_merge($t, ['outlet_id' => $outlet_id, 'is_active' => 1, 'created_at' => $now]));
            }
        }

        // 2. CATEGORIES (Default Categories)
        if ($this->table_exists($p . 'categories')) {
            $cats = [['name' => 'Makanan', 'description' => 'Menu Utama'], ['name' => 'Minuman', 'description' => 'Aneka Minuman']];
            foreach ($cats as $c) {
                $wpdb->insert($p . 'categories', array_merge($c, ['outlet_id' => $outlet_id, 'created_at' => $now]));
            }
        }

        // 3. TAXES (Default Tax - Opsional)
        if ($this->table_exists($p . 'taxes')) {
            $wpdb->insert($p . 'taxes', [
                'outlet_id' => $outlet_id, 'name' => 'PB1 (Pajak Resto)', 'rate' => 10, 'is_active' => 1, 'created_at' => $now
            ]);
        }

        // 4. GRATUITY (Service Charge - Default 0/Nonaktif)
        if ($this->table_exists($p . 'gratuity')) {
            $wpdb->insert($p . 'gratuity', [
                'outlet_id' => $outlet_id, 'name' => 'Service Charge', 'rate' => 5, 'is_default' => 0, 'created_at' => $now
            ]);
        }

        // 5. BRANDS (Kosongkan atau isi default)
        // Biasanya brand tidak perlu di-seed default, biarkan user isi sendiri.
        // Tapi jika mau, bisa uncomment di bawah:
        /*
        if ($this->table_exists($p . 'brands')) {
            $wpdb->insert($p . 'brands', ['outlet_id' => $outlet_id, 'name' => 'General', 'created_at' => $now]);
        }
        */

        // CATATAN: 
        // Produk (Products), Modifiers, Discounts, Promos, Bundles 
        // biasanya DIBIARKAN KOSONG untuk outlet baru agar user bisa input sendiri 
        // atau melakukan "Import/Clone" dari outlet lain (fitur clone butuh logic terpisah).
        // Jadi kode di atas hanya mengisi data "Master Konfigurasi" yang esensial saja.
    }

    private function table_exists($table_name) {
        global $wpdb;
        return $wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name;
    }

    public function update_item($request) {
        global $wpdb;
        $tenant = $this->get_tenant_info();
        $table  = $wpdb->prefix . "tekra_t{$tenant->id}_outlets";
        $id     = intval($request['id']);

        $data = [
            'name'    => sanitize_text_field($request['name']),
            'address' => sanitize_textarea_field($request['address'])
        ];

        $wpdb->update($table, $data, ['id' => $id]);
        return rest_ensure_response(['success' => true]);
    }

    public function delete_item($request) {
        global $wpdb;
        $tenant = $this->get_tenant_info();
        $table  = $wpdb->prefix . "tekra_t{$tenant->id}_outlets";
        $id     = intval($request['id']);

        if ($id === 1) {
            return new WP_Error('forbidden', 'Cannot delete main outlet', ['status' => 403]);
        }
        
        $wpdb->delete($table, ['id' => $id]);
        
        // Hapus data library terkait (Opsional: Bersihkan sampah data)
        $tables_to_clean = ['sales_types', 'categories', 'taxes', 'gratuity', 'products', 'brands', 'modifiers', 'discounts', 'promos', 'bundles'];
        foreach ($tables_to_clean as $tbl) {
            $t = $wpdb->prefix . "tekra_t{$tenant->id}_{$tbl}";
            if ($this->table_exists($t)) {
                $wpdb->delete($t, ['outlet_id' => $id]);
            }
        }

        return rest_ensure_response(['success' => true]);
    }
}

new TEKRAERPOS_SaaS_REST_Outlet();