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

        // POST: Create Outlet (Cek Limit Plan)
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
        global $wpdb;
        $user_id = get_current_user_id();
        return TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
    }

    public function get_items($request) {
        global $wpdb;
        $tenant = $this->get_tenant_info();
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        $table = $wpdb->prefix . "tekra_t{$tenant->id}_outlets";
        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");

        return rest_ensure_response(['outlets' => $items]);
    }

    public function create_item($request) {
        global $wpdb;
        $tenant = $this->get_tenant_info();
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        // --- CEK LIMIT PLAN ---
        $limits = TEKRAERPOS_SaaS_Tenant::get_plan_limits($tenant->id);
        $table  = $wpdb->prefix . "tekra_t{$tenant->id}_outlets";
        
        $current_count = $wpdb->get_var("SELECT COUNT(*) FROM $table");

        if ($current_count >= $limits['multi_outlet']) {
            return new WP_Error('limit_reached', 'Outlet limit reached. Please upgrade your plan.', ['status' => 403]);
        }
        // ---------------------

        $data = [
            'name'       => sanitize_text_field($request['name']),
            'address'    => sanitize_textarea_field($request['address']),
            'status'     => 'active',
            'created_at' => current_time('mysql')
        ];

        $wpdb->insert($table, $data);

        return rest_ensure_response(['success' => true, 'id' => $wpdb->insert_id]);
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

        // Jangan hapus Main Outlet (ID 1 biasanya default)
        // Opsional: Tambahkan logika ini jika perlu
        
        $wpdb->delete($table, ['id' => $id]);
        return rest_ensure_response(['success' => true]);
    }
}

new TEKRAERPOS_SaaS_REST_Outlet();