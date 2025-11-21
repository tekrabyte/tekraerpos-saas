<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Public_API {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {

        register_rest_route('tekra-saas/v1', '/plans', [
            'methods' => 'GET',
            'callback' => [$this, 'get_plans']
        ]);

        register_rest_route('tekra-saas/v1', '/tenant/(?P<slug>[a-z0-9\-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_tenant_info']
        ]);
    }

    public function get_plans() {
        global $wpdb;

        $table = $wpdb->prefix . 'saas_plans';
        $plans = $wpdb->get_results("SELECT * FROM {$table}", ARRAY_A);

        return [
            'success' => true,
            'plans'   => $plans
        ];
    }
public static function check_access($tenant_id) {
    global $wpdb;

    $sub = $wpdb->get_row("
        SELECT * FROM {$wpdb->prefix}saas_subscriptions
        WHERE tenant_id=$tenant_id
        ORDER BY id DESC LIMIT 1
    ");

    if (!$sub || $sub->expires_at < current_time('mysql')) {
        wp_send_json_error(["reason" => "expired"], 403);
    }
}
    public function get_tenant_info($req) {
        global $wpdb;
        $slug = sanitize_text_field($req['slug']);

        $table = $wpdb->prefix . 'saas_tenants';
        $tenant = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE slug = %s", $slug),
            ARRAY_A
        );

        if (!$tenant) return new WP_Error('404', 'Tenant not found', ['status'=>404]);

        return ['success'=>true, 'tenant'=>$tenant];
    }
}

new TEKRAERPOS_Public_API();
