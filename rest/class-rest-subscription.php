<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Subscription {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route("tekra-saas/v1", "/billing/create-invoice", [
            "methods" => "POST",
            "callback" => [$this, "create_invoice"],
            "permission_callback" => [$this, "check_permission"]
        ]);

        register_rest_route("tekra-saas/v1", "/billing/check-status", [
            "methods" => "POST",
            "callback" => [$this, "check_invoice_status"],
            "permission_callback" => [$this, "check_permission"]
        ]);
        
        register_rest_route("tekra-saas/v1", "/billing/info", [
            "methods" => "GET",
            "callback" => [$this, "billing_info"],
            "permission_callback" => [$this, "check_permission"]
        ]);
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    public function create_invoice($req) {
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        
        if (!$tenant) return new WP_Error("no_tenant", "Tenant not found", ["status" => 404]);

        $plan_id = intval($req["plan_id"]);

        if (!class_exists('TEKRAERPOS_Xendit_Invoice')) {
            return new WP_Error("system_error", "Modul pembayaran belum dimuat.", ["status" => 500]);
        }

        // PERBAIKAN: Tangkap hasil return (bisa URL string atau WP_Error)
        $result = TEKRAERPOS_Xendit_Invoice::create_invoice($tenant->id, $plan_id);

        // Jika Error, kirim pesan aslinya ke Frontend
        if (is_wp_error($result)) {
            return new WP_Error($result->get_error_code(), $result->get_error_message(), ["status" => 400]);
        }

        return ["success" => true, "pay_url" => $result];
    }

    public function check_invoice_status($req) {
        // ... (Kode fungsi check_invoice_status SAMA SEPERTI SEBELUMNYA, tidak perlu diubah) ...
        // Copy paste fungsi check_invoice_status dari jawaban sebelumnya di sini
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        
        $sub = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}saas_subscriptions WHERE tenant_id=%d AND status='pending_payment' ORDER BY id DESC LIMIT 1",
            $tenant->id
        ));

        if (!$sub || empty($sub->xendit_invoice_id)) {
            return new WP_Error("no_pending", "Tidak ada tagihan yang pending.", ["status" => 404]);
        }

        $options = get_option('tekra_saas_xendit_options');
        $secret_key = $options['xendit_secret'] ?? '';

        $response = wp_remote_get("https://api.xendit.co/v2/invoices/" . $sub->xendit_invoice_id, [
            'headers' => ['Authorization' => 'Basic ' . base64_encode($secret_key . ':')]
        ]);

        if (is_wp_error($response)) {
            return new WP_Error("xendit_error", $response->get_error_message(), ["status" => 500]);
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $status = $body['status'] ?? 'PENDING';

        if ($status === 'PAID' || $status === 'SETTLED') {
            $expires = date("Y-m-d H:i:s", strtotime("+30 days"));
            
            $wpdb->update($wpdb->prefix . "saas_subscriptions", ["status" => "active", "expires_at" => $expires], ["id" => $sub->id]);
            $wpdb->update($wpdb->prefix . "saas_tenants", ["status" => "active", "plan_id" => $sub->plan_id], ["id" => $tenant->id]);

            // Cek duplikat invoice sebelum insert
            $exist = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$wpdb->prefix}saas_invoices WHERE invoice_id=%s", $sub->xendit_invoice_id));
            if (!$exist) {
                $wpdb->insert($wpdb->prefix . "saas_invoices", [
                    "tenant_id" => $tenant->id,
                    "invoice_id" => $sub->xendit_invoice_id,
                    "amount" => $body['amount'],
                    "status" => "paid",
                    "created_at" => current_time('mysql')
                ]);
            }

            return ["success" => true, "status" => "active", "message" => "Pembayaran berhasil dikonfirmasi!"];
        }

        return ["success" => true, "status" => "pending", "message" => "Status masih pending di Xendit."];
    }

    public function billing_info($req) {
        // ... (Kode fungsi billing_info SAMA SEPERTI SEBELUMNYA, tidak perlu diubah) ...
        // Copy paste fungsi billing_info yang sudah diperbaiki sebelumnya (yang ada available_plans)
        global $wpdb;
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);

        if (!$tenant) {
             $linked = get_user_meta($user_id, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }

        if (!$tenant) return new WP_Error("no_tenant", "Tenant not found", ["status" => 404]);

        $sub_table = $wpdb->prefix . 'saas_subscriptions';
        $sub = $wpdb->get_row($wpdb->prepare("SELECT * FROM $sub_table WHERE tenant_id=%d ORDER BY id DESC LIMIT 1", $tenant->id));

        if (!$sub) {
            $sub = (object) ['status' => 'trial', 'plan_id' => $tenant->plan_id, 'expires_at' => date('Y-m-d H:i:s', strtotime('+14 days', strtotime($tenant->created_at)))];
        }

        $plan_id = $sub->plan_id ? $sub->plan_id : $tenant->plan_id;
        $plan_table = $wpdb->prefix . 'saas_plans';
        $plan = $wpdb->get_row($wpdb->prepare("SELECT * FROM $plan_table WHERE id=%d", $plan_id));

        if (!$plan) {
            $plan = (object) ['id' => $plan_id, 'name' => 'Unknown Plan', 'price_month' => 0, 'features' => json_encode(['multi_outlet' => 1, 'multi_user' => 1])];
        }

        $inv_table = $wpdb->prefix . 'saas_invoices';
        $invoices = [];
        if($wpdb->get_var("SHOW TABLES LIKE '$inv_table'") == $inv_table) {
            $invoices = $wpdb->get_results($wpdb->prepare("SELECT * FROM $inv_table WHERE tenant_id=%d ORDER BY id DESC LIMIT 20", $tenant->id));
        }

        $all_plans = $wpdb->get_results("SELECT * FROM $plan_table ORDER BY price_month ASC");

        return [
            "success" => true,
            "tenant" => $tenant,
            "subscription" => $sub,
            "plan" => $plan,
            "invoices" => $invoices,
            "available_plans" => $all_plans
        ];
    }
}

new TEKRAERPOS_SaaS_REST_Subscription();