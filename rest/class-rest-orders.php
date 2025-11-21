<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Orders {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $namespace = 'tekra-saas/v1';
        $base      = 'tenant/orders';

        // GET: Riwayat Order (Untuk Dashboard & POS History)
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_orders'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // POST: Buat Order Baru (Dari POS)
        register_rest_route($namespace, '/' . $base . '/create', [
            'methods'             => 'POST',
            'callback'            => [$this, 'create_order'],
            'permission_callback' => [$this, 'check_permission']
        ]);
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    private function get_prefix($tenant_id) {
        global $wpdb;
        return $wpdb->prefix . "tekra_t{$tenant_id}_";
    }

    public function get_orders($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant  = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        $p = $this->get_prefix($tenant->id);
        
        // Pagination sederhana
        $limit  = 20;
        $offset = ($request->get_param('page') ? intval($request['page']) - 1 : 0) * $limit;

        $orders = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$p}orders ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $limit, $offset
        ));

        return rest_ensure_response(['orders' => $orders]);
    }

    public function create_order($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant  = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);

        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        $p = $this->get_prefix($tenant->id);
        
        $items     = $request['items']; // Array produk dari cart
        $outlet_id = intval($request['outlet_id']);
        $total     = floatval($request['total']);
        $payment   = sanitize_text_field($request['payment_method'] ?? 'cash');

        if (empty($items)) return new WP_Error('empty_cart', 'Cart is empty', ['status' => 400]);

        // 1. Simpan Order Header
        $order_data = [
            'order_number' => 'ORD-' . time() . '-' . rand(100,999),
            'outlet_id'    => $outlet_id,
            'total'        => $total,
            'status'       => 'completed', // Langsung completed untuk POS
            'created_at'   => current_time('mysql')
        ];

        $wpdb->insert("{$p}orders", $order_data);
        $order_id = $wpdb->insert_id;

        // 2. Simpan Order Items & Potong Stok
        foreach ($items as $item) {
            $prod_id = intval($item['id']);
            $qty     = intval($item['qty']);
            $price   = floatval($item['price']);
            $subtotal= $qty * $price;

            // Insert Item
            $wpdb->insert("{$p}order_items", [
                'order_id'   => $order_id,
                'product_id' => $prod_id,
                'qty'        => $qty,
                'price'      => $price,
                'subtotal'   => $subtotal
            ]);

            // Update Stok Produk
            $wpdb->query($wpdb->prepare(
                "UPDATE {$p}products SET stock = stock - %d WHERE id = %d",
                $qty, $prod_id
            ));

            // Log Perubahan Stok
            $wpdb->insert("{$p}stock_logs", [
                'product_id' => $prod_id,
                'qty_change' => -$qty,
                'note'       => "Order #$order_id",
                'created_at' => current_time('mysql')
            ]);
        }

        return rest_ensure_response([
            'success'      => true, 
            'order_id'     => $order_id,
            'order_number' => $order_data['order_number']
        ]);
    }
}

new TEKRAERPOS_SaaS_REST_Orders();