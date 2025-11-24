<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Products {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $namespace = 'tekra-saas/v1';
        $base      = 'tenant/products';

        // GET: List Produk
        register_rest_route($namespace, '/' . $base, [
            'methods' => 'GET',
            'callback' => [$this, 'get_items'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // POST: Create
        register_rest_route($namespace, '/' . $base, [
            'methods' => 'POST',
            'callback' => [$this, 'create_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // PUT: Update
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // DELETE: Delete
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_item'],
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
        
        if (!$tenant) {
             $linked = get_user_meta($user_id, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }

        if (!$tenant) return false;
        return $wpdb->prefix . "tekra_t{$tenant->id}_products";
    }

    public function get_items($request) {
        global $wpdb;
        $table = $this->get_table();
        if (!$table) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        // Cek apakah tabel ada
        if($wpdb->get_var("SHOW TABLES LIKE '$table'") != $table) {
            return rest_ensure_response(['products' => []]); // Return kosong jika tabel blm ada
        }

        // Hanya ambil produk INDUK
        $items = $wpdb->get_results("SELECT * FROM $table WHERE parent_id = 0 ORDER BY id DESC");
        
        return rest_ensure_response(['products' => $items]);
    }

    public function create_item($request) {
        global $wpdb;
        $table = $this->get_table();
        if (!$table) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);
        
        $variants = $request['variants'] ?? [];
        $type = count($variants) > 0 ? 'variable' : 'simple';

        // Data Induk
        $data = [
            'parent_id'        => 0,
            'name'             => sanitize_text_field($request['name']),
            'sku'              => sanitize_text_field($request['sku']),
            'category_id'      => intval($request['category_id']),
            'brand_id'         => intval($request['brand_id']),
            'description'      => sanitize_textarea_field($request['description']),
            'image_url'        => esc_url_raw($request['image_url']),
            'price'            => floatval($request['price']),
            'cost_price'       => floatval($request['cost_price']),
            'stock'            => intval($request['stock']),
            'manage_stock'     => intval($request['manage_stock']),
            'stock_alert'      => intval($request['stock_alert']),
            'type'             => $type,
            'is_ecommerce'     => intval($request['is_ecommerce']),
            'condition_type'   => sanitize_text_field($request['condition']),
            'weight'           => floatval($request['weight']),
            'length'           => floatval($request['length']),
            'width'            => floatval($request['width']),
            'height'           => floatval($request['height']),
            'is_preorder'      => intval($request['is_preorder']),
            'online_image_url' => esc_url_raw($request['online_image_url']),
            'status'           => 'active',
            'created_at'       => current_time('mysql')
        ];

        // --- PERBAIKAN: Cek Error Database ---
        $inserted = $wpdb->insert($table, $data);
        
        if ($inserted === false) {
            return new WP_Error('db_insert_error', 'Gagal menyimpan ke database: ' . $wpdb->last_error, ['status' => 500]);
        }
        
        $parent_id = $wpdb->insert_id;

        // Simpan Varian
        if (!empty($variants)) {
            foreach ($variants as $var) {
                $var_data = [
                    'parent_id'      => $parent_id,
                    'name'           => sanitize_text_field($request['name']) . ' - ' . sanitize_text_field($var['name']),
                    'sku'            => sanitize_text_field($var['sku']),
                    'price'          => floatval($var['price']),
                    'stock'          => intval($var['stock']),
                    'manage_stock'   => 1,
                    'category_id'    => intval($request['category_id']),
                    'brand_id'       => intval($request['brand_id']),
                    'type'           => 'variation',
                    'status'         => 'active',
                    'created_at'     => current_time('mysql')
                ];
                $wpdb->insert($table, $var_data);
            }
        }

        return rest_ensure_response(['success' => true, 'id' => $parent_id]);
    }

    public function update_item($request) {
        global $wpdb;
        $table = $this->get_table();
        $id    = intval($request['id']);
        
        $variants = $request['variants'] ?? [];
        $type = count($variants) > 0 ? 'variable' : 'simple';

        $data = [
            'name'             => sanitize_text_field($request['name']),
            'sku'              => sanitize_text_field($request['sku']),
            'category_id'      => intval($request['category_id']),
            'brand_id'         => intval($request['brand_id']),
            'description'      => sanitize_textarea_field($request['description']),
            'image_url'        => esc_url_raw($request['image_url']),
            'price'            => floatval($request['price']),
            'cost_price'       => floatval($request['cost_price']),
            'stock'            => intval($request['stock']),
            'manage_stock'     => intval($request['manage_stock']),
            'stock_alert'      => intval($request['stock_alert']),
            'type'             => $type,
            'is_ecommerce'     => intval($request['is_ecommerce']),
            'condition_type'   => sanitize_text_field($request['condition']),
            'weight'           => floatval($request['weight']),
            'length'           => floatval($request['length']),
            'width'            => floatval($request['width']),
            'height'           => floatval($request['height']),
            'is_preorder'      => intval($request['is_preorder']),
            'online_image_url' => esc_url_raw($request['online_image_url']),
            'updated_at'       => current_time('mysql')
        ];

        // --- PERBAIKAN: Cek Error Update ---
        $updated = $wpdb->update($table, $data, ['id' => $id]);

        if ($updated === false) {
            return new WP_Error('db_update_error', 'Gagal update database: ' . $wpdb->last_error, ['status' => 500]);
        }

        // Handle Varian
        if (isset($request['variants'])) { 
            $wpdb->delete($table, ['parent_id' => $id]);
            if (!empty($variants)) {
                foreach ($variants as $var) {
                    $var_data = [
                        'parent_id'      => $id,
                        'name'           => sanitize_text_field($request['name']) . ' - ' . sanitize_text_field($var['name']),
                        'sku'            => sanitize_text_field($var['sku']),
                        'price'          => floatval($var['price']),
                        'stock'          => intval($var['stock']),
                        'manage_stock'   => 1,
                        'category_id'    => intval($request['category_id']),
                        'brand_id'       => intval($request['brand_id']),
                        'type'           => 'variation',
                        'status'         => 'active',
                        'created_at'     => current_time('mysql')
                    ];
                    $wpdb->insert($table, $var_data);
                }
            }
        }

        return rest_ensure_response(['success' => true]);
    }

    public function delete_item($request) {
        global $wpdb;
        $table = $this->get_table();
        $id    = intval($request['id']);

        $wpdb->query($wpdb->prepare("DELETE FROM $table WHERE id = %d OR parent_id = %d", $id, $id));
        
        return rest_ensure_response(['success' => true]);
    }
}

new TEKRAERPOS_SaaS_REST_Products();