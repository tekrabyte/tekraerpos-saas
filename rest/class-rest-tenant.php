<?php
if (!defined('ABSPATH')) exit;
$allowed = apply_filters("tekraerpos/check_feature", true, $tenant_id, "add_outlet");

if (!$allowed) {
    return new WP_REST_Response([
        "error" => "feature_locked",
        "message" => "Your current plan does not support this feature",
        "upgrade_url" => $allowed["upgrade_url"]
    ], 403);
}
class TEKRAERPOS_REST_Tenant {

    public function __construct() {
        add_action('rest_api_init', [$this, 'routes']);
    }

    public function routes() {

        register_rest_route('tekra-saas/v1', '/tenant/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get']
        ]);
    }

    public function get($req) {
        global $wpdb;

        $id = intval($req['id']);

        $table = $wpdb->prefix . 'saas_tenants';
        $tenant = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE id=%d", $id),
            ARRAY_A
        );

        if (!$tenant) return new WP_Error(404, 'Tenant not found', ['status'=>404]);

        return ['success'=>true, 'tenant'=>$tenant];
    }
}

new TEKRAERPOS_REST_Tenant();
