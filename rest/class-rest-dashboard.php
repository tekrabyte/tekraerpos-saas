<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Dashboard {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('tekra-saas/v1', '/dashboard/sales', [
            'methods' => 'GET',
            'callback' => [$this, 'get_sales'],
            'permission_callback' => [$this, 'check_auth']
        ]);
    }

    public function check_auth() {
        return is_user_logged_in();
    }

    public function get_sales() {
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);

        if(!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status'=>404]);

        $p = "tekra_t{$tenant->id}_";
        $summary = ['revenue' => 0, 'orders' => 0];
        $daily = [];

        if($wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}{$p}orders'")) {
            $summary = $wpdb->get_row("SELECT COUNT(*) as orders, COALESCE(SUM(total),0) as revenue FROM {$wpdb->prefix}{$p}orders");
            $daily = $wpdb->get_results("SELECT DATE(created_at) as d, SUM(total) as t FROM {$wpdb->prefix}{$p}orders GROUP BY d ORDER BY d DESC LIMIT 7");
        }

        return ['summary' => $summary, 'daily' => $daily];
    }
}
new TEKRAERPOS_SaaS_REST_Dashboard();