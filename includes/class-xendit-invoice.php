<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Xendit_Invoice {

    public static function create_invoice($tenant_id, $plan_id) {
        global $wpdb;

        $options = get_option('tekra_saas_xendit_options');
        $secret_key = $options['xendit_secret'] ?? '';

        if (empty($secret_key)) {
            return new WP_Error('config_error', 'Secret Key Xendit belum diisi di pengaturan.');
        }

        $plan = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_plans WHERE id=%d", $plan_id));
        if (!$plan) return new WP_Error('plan_error', 'Paket tidak ditemukan.');

        $sub = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}saas_subscriptions WHERE tenant_id=%d ORDER BY id DESC LIMIT 1", 
            $tenant_id
        ));
        
        if (!$sub) return new WP_Error('sub_error', 'Data subscription tidak ditemukan.');

        $tenant = TEKRAERPOS_SaaS_Tenant::get($tenant_id);
        $external_id = "inv_" . $tenant_id . "_" . time();
        
        $payload = [
            "external_id" => $external_id,
            "payer_email" => $tenant->email,
            "description" => "Upgrade ke Paket: " . $plan->name,
            "amount"      => floatval($plan->price_month),
            "currency"    => "IDR",
            "success_redirect_url" => "https://dashboard.tekrabyte.id/" . $tenant->slug . "/settings/billing",
            "failure_redirect_url" => "https://dashboard.tekrabyte.id/" . $tenant->slug . "/settings/billing?failed=1"
        ];

        $resp = wp_remote_post("https://api.xendit.co/v2/invoices", [
            "headers" => [
                "Authorization" => "Basic " . base64_encode($secret_key . ":"),
                "Content-Type"  => "application/json"
            ],
            "body" => json_encode($payload),
            "timeout" => 45
        ]);

        if (is_wp_error($resp)) {
            return new WP_Error('xendit_connection', $resp->get_error_message());
        }

        $body = json_decode(wp_remote_retrieve_body($resp), true);

        // JIKA GAGAL DARI XENDIT (KEMBALIKAN PESAN ERROR ASLINYA)
        if (!isset($body["id"])) {
            $err_code = $body['error_code'] ?? 'XENDIT_API_ERROR';
            $err_msg  = $body['message'] ?? 'Terjadi kesalahan pada API Xendit.';
            error_log("Xendit Failed: " . print_r($body, true));
            return new WP_Error($err_code, $err_msg);
        }

        // JIKA SUKSES
        $wpdb->update(
            $wpdb->prefix . "saas_subscriptions", 
            [
                "xendit_invoice_id" => $body["id"], 
                "status" => "pending_payment",
                "plan_id" => $plan_id 
            ], 
            ["id" => $sub->id]
        );

        return $body["invoice_url"];
    }
}