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
        
        // 1. Cari Tenant
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);

        if (!$tenant) {
             $linked = get_user_meta($user_id, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }

        if (!$tenant) return new WP_Error("no_tenant", "Tenant not found", ["status" => 404]);

        // 2. Cari Subscription Terakhir
        $sub = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}saas_subscriptions WHERE tenant_id=%d ORDER BY id DESC LIMIT 1",
            $tenant->id
        ));

        // Fallback jika data subscription hilang/belum ada
        if (!$sub) {
            $sub = (object) [
                'status' => 'trial',
                'plan_id' => $tenant->plan_id, // Ambil dari master tenant
                'expires_at' => date('Y-m-d H:i:s', strtotime('+14 days', strtotime($tenant->created_at)))
            ];
        }

        // 3. Cari Detail Plan yang sedang aktif
        $plan_id = $sub->plan_id ? $sub->plan_id : $tenant->plan_id;
        $plan = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_plans WHERE id=%d", $plan_id));

        // Fallback jika ID Plan tidak ketemu di DB
        if (!$plan) {
            $plan = (object) [
                'id' => $plan_id,
                'name' => 'Unknown Plan',
                'price_month' => 0,
                'features' => json_encode(['multi_outlet' => 1, 'multi_user' => 1])
            ];
        }

        // 4. Ambil History Invoice
        $invoices = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}saas_invoices WHERE tenant_id=%d ORDER BY id DESC LIMIT 20",
            $tenant->id
        ));

        return [
            "subscription" => $sub,
            "plan" => $plan,
            "invoices" => $invoices
        ];
    }
}
new TEKRAERPOS_SaaS_REST_Billing();