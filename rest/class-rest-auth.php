<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Auth {

    public function __construct() {
        add_action('rest_api_init', [$this, 'routes']);
    }

    public function routes() {
        register_rest_route('tekra-saas/v1', '/auth/login', [
            'methods' => 'POST',
            'callback' => [$this, 'login'],
            'permission_callback' => '__return_true'
        ]);
    }

    public function login($req) {
        $email = sanitize_email($req['email']);
        $pass  = $req['password'];

        $user = wp_authenticate($email, $pass);

        if (is_wp_error($user)) {
            return new WP_Error('invalid_credentials', 'Email atau password salah.', ['status'=>403]);
        }

        // Cek Tenant
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($user->ID);
        if (!$tenant) {
             $linked = get_user_meta($user->ID, 'tekra_tenant_id', true);
             if ($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }

        if (!$tenant) return new WP_Error('no_tenant', 'User tidak terhubung tenant.', ['status'=>403]);

        // GENERATE TOKEN & SIMPAN
        $secret = wp_generate_password(30, false);
        update_user_meta($user->ID, 'tekra_api_token', $secret); // <--- PENTING: Simpan token

        $token = base64_encode($user->ID . ':' . $secret);

        return [
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'           => $user->ID,
                'display_name' => $user->display_name,
                'email'        => $user->user_email,
                'role'         => get_user_meta($user->ID, 'tekra_role', true) ?: 'owner',
                'tenant'       => $tenant
            ]
        ];
    }
}

new TEKRAERPOS_SaaS_REST_Auth();