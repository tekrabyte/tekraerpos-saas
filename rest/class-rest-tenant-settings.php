<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Tenant_Settings {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        // 1. Basic Settings (Existing)
        register_rest_route("tekra-saas/v1", "/tenant/settings", [
            "methods" => "GET",
            "callback" => [$this, "get_settings"],
            "permission_callback" => [$this, "check_auth"]
        ]);

        register_rest_route("tekra-saas/v1", "/tenant/settings/update", [
            "methods" => "POST",
            "callback" => [$this, "update_settings"],
            "permission_callback" => [$this, "check_auth"]
        ]);

        // 2. Upgrade Plan (Existing)
        register_rest_route("tekra-saas/v1", "/tenant/settings/upgrade", [
            "methods" => "POST",
            "callback" => [$this, "upgrade_plan"],
            "permission_callback" => [$this, "check_auth"]
        ]);

        // 3. Reset POS (Existing)
        register_rest_route("tekra-saas/v1", "/tenant/settings/reset-pos", [
            "methods" => "POST",
            "callback" => [$this, "reset_pos"],
            "permission_callback" => [$this, "check_auth"]
        ]);

        // 4. BARU: Dynamic Options (Receipt, Email, Config) - Menggantikan class-rest-options.php
        register_rest_route('tekra-saas/v1', '/tenant/options/(?P<key>[a-zA-Z0-9_-]+)', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'handle_options'],
            'permission_callback' => [$this, "check_auth"]
        ]);
    }

    public function check_auth() {
        return is_user_logged_in();
    }

    // --- Existing Functions ---

    public function get_settings($r) {
        $uid = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($uid);
        // Fallback untuk staff
        if (!$tenant) {
             $linked = get_user_meta($uid, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }

        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status'=>404]);

        return [
            "tenant" => $tenant,
            "plan" => TEKRAERPOS_SaaS_Tenant::get_plan_limits($tenant->id) // Gunakan helper existing
        ];
    }

    public function update_settings($r) {
        $uid = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($uid);
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status'=>404]);

        global $wpdb;
        $wpdb->update($wpdb->prefix.'saas_tenants', [
            "name" => sanitize_text_field($r["name"]),
            // "address" => sanitize_textarea_field($r["address"]), // Kolom address blm ada di tabel saas_tenants standar, bisa ditambah atau simpan di options
            // "phone" => sanitize_text_field($r["phone"]),
            "email" => sanitize_email($r["email"])
        ], ['id' => $tenant->id]);

        return ["success" => true, "message" => "Updated"];
    }

    public function upgrade_plan($r) {
        // Panggil logika subscription yang sudah ada
        if (!class_exists('TEKRAERPOS_SaaS_REST_Subscription')) {
             require_once __DIR__ . '/class-rest-subscription.php';
        }
        $sub_class = new TEKRAERPOS_SaaS_REST_Subscription();
        return $sub_class->create_invoice($r);
    }

    public function reset_pos() {
        // Logika reset pos
        return ["message" => "Fitur reset POS belum diimplementasikan sepenuhnya di versi ini."];
    }

    // --- FUNGSI BARU UNTUK OPTIONS ---

    public function handle_options($req) {
        global $wpdb;
        $uid = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($uid);
        if (!$tenant) {
             $linked = get_user_meta($uid, 'tekra_tenant_id', true);
             if($linked) $tenant = TEKRAERPOS_SaaS_Tenant::get($linked);
        }
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status'=>404]);

        $table = $wpdb->prefix . "tekra_t{$tenant->id}_options";
        $key = $req['key'];

        // Pastikan tabel options ada (jika tenant lama belum punya)
        if($wpdb->get_var("SHOW TABLES LIKE '$table'") != $table) {
            $charset = $wpdb->get_charset_collate();
            $wpdb->query("CREATE TABLE $table (option_name varchar(191) NOT NULL, option_value longtext, PRIMARY KEY (option_name)) $charset;");
        }

        // GET Request
        if ($req->get_method() === 'GET') {
            $val = $wpdb->get_var($wpdb->prepare("SELECT option_value FROM $table WHERE option_name=%s", $key));
            $data = $val ? json_decode($val, true) : [];
            return ['success' => true, 'data' => $data];
        }

        // POST Request (Save)
        if ($req->get_method() === 'POST') {
            $data = $req->get_json_params();
            $json = json_encode($data);
            
            $sql = "INSERT INTO $table (option_name, option_value) VALUES (%s, %s) 
                    ON DUPLICATE KEY UPDATE option_value = VALUES(option_value)";
            
            $wpdb->query($wpdb->prepare($sql, $key, $json));
            
            return ['success' => true, 'message' => 'Settings saved'];
        }
    }
}

new TEKRAERPOS_SaaS_REST_Tenant_Settings();