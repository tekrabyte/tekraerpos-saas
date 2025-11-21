<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Xendit_Invoice {

    public static function create_invoice($tenant_id, $plan_id) {
        global $wpdb;

        // PERBAIKAN: Ambil dari 'tekra_saas_xendit_options' (Bukan General)
        $options = get_option('tekra_saas_xendit_options');
        $secret_key = $options['xendit_secret'] ?? '';

        if (empty($secret_key)) {
            error_log("TekraERPOS Error: Secret Key Xendit kosong. Cek Settings > Tab Xendit.");
            return false;
        }

        $plan = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_plans WHERE id=%d", $plan_id));
        if (!$plan) return false;

        $sub = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}saas_subscriptions WHERE tenant_id=%d ORDER BY id DESC LIMIT 1", 
            $tenant_id
        ));
        if (!$sub) return false;

        $tenant = TEKRAERPOS_SaaS_Tenant::get($tenant_id);
        $external_id = "inv_" . $tenant_id . "_" . time();
        
        $payload = [
            "external_id" => $external_id,
            "payer_email" => $tenant->email,
            "description" => "Langganan: " . $plan->name,
            "amount"      => floatval($plan->price_month),
            "currency"    => "IDR",
            // Redirect kembali ke halaman billing setelah bayar
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
            error_log("Xendit Error: " . $resp->get_error_message());
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($resp), true);

        if (!isset($body["id"])) {
            error_log("Xendit API Failed: " . print_r($body, true));
            return false;
        }

        $wpdb->update(
            $wpdb->prefix . "saas_subscriptions", 
            ["xendit_invoice_id" => $body["id"], "status" => "pending_payment"], 
            ["id" => $sub->id]
        );

        return $body["invoice_url"];
    }
}



