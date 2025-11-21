<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Signup {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // 1. Inisialisasi & Kirim OTP
        register_rest_route('tekra-saas/v1', '/signup/init', [
            'methods' => 'POST',
            'callback' => [$this, 'init_signup'],
            'permission_callback' => '__return_true'
        ]);

        // 2. Verifikasi OTP
        register_rest_route('tekra-saas/v1', '/signup/verify', [
            'methods' => 'POST',
            'callback' => [$this, 'verify_otp'],
            'permission_callback' => '__return_true'
        ]);

        // 3. Finalisasi (Data Bisnis & Create Tenant)
        register_rest_route('tekra-saas/v1', '/signup/complete', [
            'methods' => 'POST',
            'callback' => [$this, 'complete_signup'],
            'permission_callback' => '__return_true'
        ]);
    }

    // TAHAP 1: Simpan Data Sementara & Kirim OTP
    public function init_signup($req) {
        $data = [
            'name' => sanitize_text_field($req['fullname']),
            'phone' => sanitize_text_field($req['phone']),
            'email' => sanitize_email($req['email']),
            'password' => $req['password'],
            'referral' => sanitize_text_field($req['referral'])
        ];

        if(empty($data['name']) || empty($data['phone']) || empty($data['email']) || empty($data['password'])) {
            return new WP_Error('400', 'Data tidak lengkap', ['status'=>400]);
        }

        if(email_exists($data['email'])) {
            return new WP_Error('400', 'Email sudah terdaftar', ['status'=>400]);
        }

        // Generate 6 Digit OTP
        $otp = rand(100000, 999999);
        
        // Simpan data di Transient (Cache sementara 10 menit)
        // Key menggunakan Email atau No HP agar unik
        $key = 'signup_' . md5($data['email']);
        $data['otp'] = $otp;
        set_transient($key, $data, 600); 

        // TODO: Integrasikan SMS Gateway di sini (Twilio/Wablas/dll) untuk kirim ke No HP.
        // Untuk sekarang, kita kirim ke Email & Log Debug agar bisa dites.
        wp_mail($data['email'], "Kode Verifikasi TekraERPOS", "Kode OTP Anda: $otp");
        error_log("OTP untuk {$data['email']} / {$data['phone']} adalah: $otp");

        return ['success' => true, 'message' => 'OTP dikirim ke WhatsApp/Email Anda. (Cek Debug Log untuk testing: '.$otp.')'];
    }

    // TAHAP 2: Verifikasi OTP
    public function verify_otp($req) {
        $email = sanitize_email($req['email']);
        $otp_input = sanitize_text_field($req['otp']);
        
        $key = 'signup_' . md5($email);
        $stored_data = get_transient($key);

        if (!$stored_data) {
            return new WP_Error('400', 'Sesi habis. Silakan daftar ulang.', ['status'=>400]);
        }

        if ($stored_data['otp'] != $otp_input) {
            return new WP_Error('400', 'Kode OTP salah.', ['status'=>400]);
        }

        // OTP Benar, tandai verified
        $stored_data['verified'] = true;
        set_transient($key, $stored_data, 600); // Perpanjang sesi

        return ['success' => true, 'message' => 'Verifikasi berhasil'];
    }

    // TAHAP 3: Data Bisnis & Create Tenant
    public function complete_signup($req) {
        $email = sanitize_email($req['email']);
        $key = 'signup_' . md5($email);
        $stored_data = get_transient($key);

        if (!$stored_data || !isset($stored_data['verified'])) {
            return new WP_Error('403', 'Akses ditolak. Verifikasi dulu.', ['status'=>403]);
        }

        // Data Bisnis dari Form Step 3
        $biz_type = sanitize_text_field($req['biz_type']);
        $outlet_count = sanitize_text_field($req['outlet_count']);
        $city = sanitize_text_field($req['city']);
        $biz_name = sanitize_text_field($req['biz_name']);
        
        // Validasi
        $slug = tekraerpos_slugify($biz_name);
        if (TEKRAERPOS_SaaS_Tenant::get_by_slug($slug)) {
            // Jika slug ada, tambahkan angka acak
            $slug .= '-' . rand(10,99);
        }

        // 1. Buat User WP
        $user_id = wp_create_user($email, $stored_data['password'], $email);
        if (is_wp_error($user_id)) return $user_id;

        wp_update_user(['ID' => $user_id, 'display_name' => $stored_data['name'], 'role' => 'subscriber']);
        
        // Simpan No HP & Referral di User Meta
        update_user_meta($user_id, 'phone_number', $stored_data['phone']);
        update_user_meta($user_id, 'referral_code', $stored_data['referral']);

        // 2. Buat Tenant (Default Plan Trial)
        try {
            $tenant_id = TEKRAERPOS_SaaS_Provisioning::create_tenant_full([
                'name'    => $biz_name,
                'email'   => $email,
                'user_id' => $user_id,
                'plan_id' => 1 // Default Starter/Trial
            ]);

            // Simpan Detail Bisnis Tambahan di Meta Tenant (Perlu buat tabel meta atau simpan di option json)
            // Untuk simplifikasi, kita anggap tersimpan di tenant profile (update nanti)
            
            // Hapus transient
            delete_transient($key);

            // URL Dashboard Client
            $dashboard_url = "https://dashboard.tekrabyte.id/" . $slug . "/login";

            return [
                'success' => true,
                'redirect_url' => $dashboard_url,
                'slug' => $slug
            ];

        } catch (Exception $e) {
            return new WP_Error('500', $e->getMessage(), ['status'=>500]);
        }
    }
}

new TEKRAERPOS_SaaS_REST_Signup();