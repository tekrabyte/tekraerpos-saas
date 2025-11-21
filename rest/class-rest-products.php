<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Products {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $namespace = 'tekra-saas/v1';
        $base      = 'tenant/products';

        // GET: List Products
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_items'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // POST: Create Product
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'POST',
            'callback'            => [$this, 'create_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // PUT: Update Product
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [$this, 'update_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // DELETE: Delete Product
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'delete_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    private function get_table() {
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant  = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        
        if (!$tenant) return false;
        return $wpdb->prefix . "tekra_t{$tenant->id}_products";
    }

    public function get_items($request) {
        global $wpdb;
        $table = $this->get_table();
        if (!$table) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");
        return rest_ensure_response(['products' => $items]);
    }

    public function create_item($request) {
        global $wpdb;
        $table = $this->get_table();
        if (!$table) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        $data = [
            'name'       => sanitize_text_field($request['name']),
            'sku'        => sanitize_text_field($request['sku']),
            'price'      => floatval($request['price']),
            'stock'      => intval($request['stock']),
            'created_at' => current_time('mysql')
        ];

        $wpdb->insert($table, $data);

        return rest_ensure_response(['success' => true, 'id' => $wpdb->insert_id]);
    }

    public function update_item($request) {
        global $wpdb;
        $table = $this->get_table();
        $id    = intval($request['id']);

        $data = [
            'name'  => sanitize_text_field($request['name']),
            'sku'   => sanitize_text_field($request['sku']),
            'price' => floatval($request['price']),
            'stock' => intval($request['stock'])
        ];

        $wpdb->update($table, $data, ['id' => $id]);
        return rest_ensure_response(['success' => true]);
    }

    public function delete_item($request) {
        global $wpdb;
        $table = $this->get_table();
        $id    = intval($request['id']);

        $wpdb->delete($table, ['id' => $id]);
        return rest_ensure_response(['success' => true]);
    }
}

new TEKRAERPOS_SaaS_REST_Products();