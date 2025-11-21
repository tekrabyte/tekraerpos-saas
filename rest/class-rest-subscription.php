<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Subscription {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // Endpoint: Buat Invoice Upgrade/Perpanjang
        register_rest_route("tekra-saas/v1", "/billing/create-invoice", [
            "methods" => "POST",
            "callback" => [$this, "create_invoice"],
            "permission_callback" => [$this, "check_permission"]
        ]);

        // HAPUS endpoint billing/info dari sini karena sudah dihandle oleh class-rest-billing.php
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    public function create_invoice($req) {
        $user_id = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        
        if (!$tenant) return new WP_Error("no_tenant", "Tenant not found", ["status" => 404]);

        $plan_id = intval($req["plan_id"]);

        // Pastikan modul invoice siap
        if (!class_exists('TEKRAERPOS_Xendit_Invoice')) {
            return new WP_Error("system_error", "Modul pembayaran belum dimuat.", ["status" => 500]);
        }

        // Buat Invoice via Xendit
        $invoice_url = TEKRAERPOS_Xendit_Invoice::create_invoice($tenant->id, $plan_id);

        if (!$invoice_url) {
            return new WP_Error("xendit_error", "Gagal membuat invoice. Cek log server.", ["status" => 500]);
        }

        return ["success" => true, "pay_url" => $invoice_url];
    }
}

new TEKRAERPOS_SaaS_REST_Subscription();