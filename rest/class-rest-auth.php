<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Auth {

    public function __construct() {
        add_action('rest_api_init', [$this, 'routes']);
    }

    public function routes() {
        // Login
        register_rest_route('tekra-saas/v1', '/auth/login', [
            'methods' => 'POST', 'callback' => [$this, 'login'], 'permission_callback' => '__return_true'
        ]);

        // Request OTP (Real)
        register_rest_route('tekra-saas/v1', '/auth/otp/request', [
            'methods' => 'POST', 'callback' => [$this, 'request_otp'], 'permission_callback' => [$this, 'check_auth']
        ]);

        // Verify OTP
        register_rest_route('tekra-saas/v1', '/auth/otp/verify', [
            'methods' => 'POST', 'callback' => [$this, 'verify_otp'], 'permission_callback' => [$this, 'check_auth']
        ]);
    }

    public function check_auth() { return is_user_logged_in(); }

    public function login($req) {
        $email = sanitize_email($req['email']);
        $pass  = $req['password'];
        $user = wp_authenticate($email, $pass);

        if (is_wp_error($user)) return new WP_Error('invalid', 'Email/Password salah.', ['status'=>403]);

        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user->ID);
        if (!$tenant) {
             $linked = get_user_meta($user->ID, 'tekra_tenant_id', true);
             if ($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }
        if (!$tenant) return new WP_Error('no_tenant', 'User tanpa tenant.', ['status'=>403]);

        $secret = wp_generate_password(30, false);
        update_user_meta($user->ID, 'tekra_api_token', $secret);
        $token = base64_encode($user->ID . ':' . $secret);

        return ['success' => true, 'token' => $token, 'user' => ['id'=>$user->ID, 'display_name'=>$user->display_name, 'email'=>$user->user_email, 'role'=>'owner', 'tenant'=>$tenant]];
    }

    // --- REQUEST OTP (MENGGUNAKAN API RAILWAY ANDA) ---
    public function request_otp($req) {
        $user_id = get_current_user_id();
        $target  = sanitize_text_field($req['target']);
        $type    = $req['type']; 

        if (empty($target)) return new WP_Error('no_target', 'Target kosong', ['status' => 400]);

        // 1. Generate OTP
        $otp = rand(100000, 999999);
        $transient_key = "otp_{$user_id}_{$type}";
        set_transient($transient_key, $otp, 300); // 5 Menit

        // LOGGING UNTUK DEBUG (Cek wp-content/debug.log)
        error_log("[TekraERPOS] OTP Generated for $target ($type): $otp");

        // 2. KIRIM EMAIL (WP MAIL SMTP)
        if ($type === 'email') {
            $subject = "Kode Verifikasi TekraERPOS";
            $message = "Kode OTP Anda: {$otp}\n\nBerlaku 5 menit.";
            $headers = ['Content-Type: text/plain; charset=UTF-8'];
            
            $sent = wp_mail($target, $subject, $message, $headers);
            
            if (!$sent) {
                error_log("[TekraERPOS] Gagal kirim email ke $target. Cek SMTP.");
                return new WP_Error('mail_failed', 'Server gagal kirim email.', ['status' => 500]);
            }

        } 
        // 3. KIRIM WHATSAPP (VIA RAILWAY)
        else if ($type === 'phone') {
            
            // --- PENTING: MASUKKAN URL RAILWAY ANDA DI SINI ---
            // Pastikan diakhiri dengan /send-otp
            // Contoh: https://wa-bot-production.up.railway.app/send-otp
            $api_url = 'https://dabewa-production.up.railway.app/send-otp'; 
            
            $response = wp_remote_post($api_url, [
                'body'    => json_encode([
                    'target'  => $target,
                    'message' => "Kode Verifikasi TekraERPOS: *$otp*\n\nJangan berikan kode ini ke siapapun."
                ]),
                'headers' => ['Content-Type' => 'application/json'],
                'timeout' => 20, // Tambah timeout karena WA kadang butuh waktu
                'sslverify' => false // Bypass SSL jika Railway pakai sertifikat standar
            ]);

            if (is_wp_error($response)) {
                error_log("[TekraERPOS] Bot WA Error: " . $response->get_error_message());
                return new WP_Error('wa_failed', 'Gagal terhubung ke Bot WhatsApp.', ['status' => 500]);
            }

            $body = json_decode(wp_remote_retrieve_body($response), true);
            
            // Cek status dari bot Node.js
            if (!$body || !isset($body['status']) || !$body['status']) {
                error_log("[TekraERPOS] WA Bot Response Gagal: " . print_r($body, true));
                return new WP_Error('wa_error', 'Bot WA gagal mengirim pesan. Pastikan WA connect.', ['status' => 500]);
            }
        }

        return ['success' => true, 'message' => "Kode OTP dikirim ke $target"];
    }

    // --- VERIFY OTP ---
    public function verify_otp($req) {
        $user_id = get_current_user_id();
        $code    = sanitize_text_field($req['code']);
        $type    = $req['type'];
        $target  = sanitize_text_field($req['target']);

        $transient_key = "otp_{$user_id}_{$type}";
        $saved_otp     = get_transient($transient_key);

        if (!$saved_otp) return new WP_Error('expired', 'Kode kadaluarsa.', ['status' => 400]);
        if ($saved_otp != $code) return new WP_Error('invalid', 'Kode salah.', ['status' => 400]);

        delete_transient($transient_key);
        update_user_meta($user_id, "tekra_{$type}_verified", true);

        if ($type === 'email') wp_update_user(['ID' => $user_id, 'user_email' => $target]);
        if ($type === 'phone') {
            $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
            if ($tenant) {
                global $wpdb;
                $wpdb->update($wpdb->prefix.'saas_tenants', ['phone' => $target], ['id' => $tenant->id]);
            }
        }

        return ['success' => true, 'message' => 'Verifikasi berhasil!'];
    }
}

new TEKRAERPOS_SaaS_REST_Auth();