<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Billing {

    public function __construct() {
        add_action('rest_api_init', function() {
            register_rest_route('tekra-saas/v1', '/billing/info', [
                'methods' => 'GET',
                'callback' => [$this, 'billing_info'],
                'permission_callback' => [$this, 'check_auth']
            ]);
        });
    }

    public function check_auth() {
        return is_user_logged_in();
    }

    public function billing_info($req) {
        global $wpdb;
        
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);

        if (!$tenant) {
             $linked = get_user_meta($user_id, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }

        if (!$tenant) return new WP_Error("no_tenant", "Tenant not found", ["status" => 404]);

        // 1. Subscription Info
        $sub_table = $wpdb->prefix . 'saas_subscriptions';
        $sub = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $sub_table WHERE tenant_id=%d ORDER BY id DESC LIMIT 1",
            $tenant->id
        ));

        if (!$sub) {
            $sub = (object) [
                'status' => 'trial',
                'plan_id' => $tenant->plan_id,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+14 days', strtotime($tenant->created_at)))
            ];
        }

        // 2. Current Plan Info
        $plan_id = $sub->plan_id ? $sub->plan_id : $tenant->plan_id;
        $plan_table = $wpdb->prefix . 'saas_plans';
        
        $plan = $wpdb->get_row($wpdb->prepare("SELECT * FROM $plan_table WHERE id=%d", $plan_id));

        if (!$plan) {
            $plan = (object) [
                'id' => $plan_id,
                'name' => 'Unknown Plan',
                'price_month' => 0,
                'features' => json_encode(['multi_outlet' => 1, 'multi_user' => 1])
            ];
        }

        // 3. Invoices History
        $inv_table = $wpdb->prefix . 'saas_invoices';
        $invoices = [];
        if($wpdb->get_var("SHOW TABLES LIKE '$inv_table'") == $inv_table) {
            $invoices = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $inv_table WHERE tenant_id=%d ORDER BY id DESC LIMIT 20",
                $tenant->id
            ));
        }

        // 4. PERBAIKAN: Ambil Semua Available Plans (Pengganti class-rest-plan.php)
        $all_plans = $wpdb->get_results("SELECT * FROM $plan_table ORDER BY price_month ASC");

        return [
            "success" => true,
            "tenant" => $tenant,
            "subscription" => $sub,
            "plan" => $plan,
            "invoices" => $invoices,
            "available_plans" => $all_plans // <--- Data baru dikirim di sini
        ];
    }
}

new TEKRAERPOS_SaaS_REST_Billing();