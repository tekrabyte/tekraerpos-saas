<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Xendit_Webhook {

    public function __construct() {
        add_action('rest_api_init', function() {
            register_rest_route('tekra-saas/v1', '/xendit/webhook', [
                'methods' => 'POST',
                'callback' => [$this, 'handle'],
                'permission_callback' => '__return_true'
            ]);
        });
    }

    public function handle(WP_REST_Request $req) {
        global $wpdb;

        // 1. Ambil Data & Log
        $payload = $req->get_json_params();
        error_log("XENDIT WEBHOOK MASUK: " . print_r($payload, true));

        if (empty($payload)) {
            return new WP_REST_Response(["status" => "empty_payload"], 400);
        }

        // 2. Normalisasi Data (Handle berbagai format Xendit)
        // Format 1: Langsung (Invoice Callback standar)
        // Format 2: Terbungkus 'data' (Webhook V3 / Payment Request)
        $data = isset($payload['data']) ? $payload['data'] : $payload;

        $invoice_id = $data['id'] ?? $data['external_id'] ?? ''; // Kadang external_id dipakai di tes
        $status     = $data['status'] ?? '';
        $event      = $payload['event'] ?? ''; // Optional

        // Cek Invoice ID
        if (empty($invoice_id)) {
            return new WP_REST_Response(["status" => "ignored_no_id"], 200);
        }

        // 3. Cari Subscription di Database
        $sub_table = $wpdb->prefix . 'saas_subscriptions';
        $tenant_table = $wpdb->prefix . 'saas_tenants';
        $inv_table = $wpdb->prefix . 'saas_invoices';

        // Cari berdasarkan xendit_invoice_id
        // Tips: Kita gunakan 'LIKE' untuk external_id jika id asli tidak ketemu (opsional backup)
        $sub = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $sub_table WHERE xendit_invoice_id=%s",
            $invoice_id
        ));

        // Jika tidak ketemu, coba cari lewat external_id (format: inv_TENANTID_TIME)
        if (!$sub && isset($data['external_id'])) {
            $parts = explode('_', $data['external_id']);
            if (count($parts) >= 2 && is_numeric($parts[1])) {
                $tenant_id_guess = intval($parts[1]);
                // Ambil subscription terakhir milik tenant ini yang statusnya pending
                $sub = $wpdb->get_row($wpdb->prepare(
                    "SELECT * FROM $sub_table WHERE tenant_id=%d ORDER BY id DESC LIMIT 1",
                    $tenant_id_guess
                ));
            }
        }

        if (!$sub) {
            error_log("XENDIT: Subscription tidak ditemukan untuk Invoice ID $invoice_id");
            return new WP_REST_Response(["status" => "subscription_not_found"], 200);
        }

        // 4. PROSES AKTIVASI (Jika Status PAID/SETTLED atau Event invoice.paid)
        if ($status === 'PAID' || $status === 'SETTLED' || $event === 'invoice.paid') {
            
            $tenant_id = $sub->tenant_id;
            $expires = date("Y-m-d H:i:s", strtotime("+30 days"));

            // A. Aktifkan Subscription
            $wpdb->update($sub_table, [
                "status" => "active",
                "expires_at" => $expires,
                "updated_at" => current_time('mysql')
            ], ["id" => $sub->id]);

            // B. Aktifkan Tenant & Update Plan
            $wpdb->update($tenant_table, [
                "status" => "active",
                "plan_id" => $sub->plan_id
            ], ["id" => $tenant_id]);

            // C. Simpan Invoice History (Cek duplikat dulu)
            $cek_inv = $wpdb->get_var($wpdb->prepare("SELECT id FROM $inv_table WHERE invoice_id=%s", $invoice_id));
            if (!$cek_inv) {
                $wpdb->insert($inv_table, [
                    "tenant_id" => $tenant_id,
                    "invoice_id" => $invoice_id,
                    "amount" => $data['amount'] ?? $data['paid_amount'] ?? 0,
                    "status" => "paid",
                    "created_at" => current_time('mysql')
                ]);
            }

            error_log("XENDIT SUKSES: Tenant $tenant_id Diaktifkan.");
            return new WP_REST_Response(["status" => "activated"], 200);
        }

        // 5. PROSES EXPIRED
        if ($status === 'EXPIRED' || $event === 'invoice.expired') {
            $wpdb->update($sub_table, ["status" => "expired"], ["id" => $sub->id]);
            return new WP_REST_Response(["status" => "marked_expired"], 200);
        }

        return new WP_REST_Response(["status" => "ignored_status_".$status], 200);
    }
}

new TEKRAERPOS_SaaS_Xendit_Webhook();