<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Loader {

    public static function init() {
        // CORS Setup
        add_action('init', function() {
            $origin = get_http_origin();
            $allowed_origins = [
                'http://localhost:5173',
                'http://127.0.0.1:5173',
                'https://dashboard.tekrabyte.id'
            ];

            if ($origin && in_array($origin, $allowed_origins)) {
                header("Access-Control-Allow-Origin: " . $origin);
                header("Access-Control-Allow-Credentials: true");
                header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
                header("Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce");
            }
            
            if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
                status_header(200);
                exit();
            }
        }, 0);

        // AUTH HANDLER
        add_filter('determine_current_user', function($user) {
            if (!empty($user)) return $user;
            
            $auth_header = null;
            if (function_exists('getallheaders')) {
                $headers = getallheaders();
                $auth_header = $headers['Authorization'] ?? null;
            }
            if (!$auth_header) {
                $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
            }

            if (!empty($auth_header) && preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
                $token = $matches[1];
                $decoded = base64_decode($token);
                if ($decoded) {
                    list($user_id, $secret) = explode(':', $decoded);
                    $stored = get_user_meta($user_id, 'tekra_api_token', true);
                    if ($stored && hash_equals($stored, $secret)) {
                        return $user_id;
                    }
                }
            }
            return $user;
        });

        self::load_core_files();
        self::load_modules();
    }

    private static function load_core_files() {
        $files = [
            'includes/helpers.php', 'includes/class-encryption.php', 'includes/class-saas-database.php',
            'includes/class-tenant-manager.php', 'includes/class-plan-manager.php', 'includes/class-subscription-manager.php',
            'includes/class-provisioning.php', 'includes/class-provisioning-seeds.php', 'includes/class-xendit-invoice.php'
        ];
        foreach($files as $file) if (file_exists(TEKRAERPOS_SAAS_DIR . $file)) require_once TEKRAERPOS_SAAS_DIR . $file;
    }

   private static function load_modules() {
        // Tambahkan 'data' ke dalam array. 'tenant-settings' sudah ada.
        $apis = [
            'signup', 'auth', 'dashboard', 'products', 'orders', 'outlet', 
            'employees', 'subscription', 'xendit-webhook', 'tenant-settings', 
            'health', 'billing', 'data' // <--- HANYA TAMBAH INI
        ];
        
        foreach($apis as $api) {
            $f = TEKRAERPOS_SAAS_DIR . "rest/class-rest-$api.php";
            if (file_exists($f)) require_once $f;
        }
        
        // Load Public Classes
        if (file_exists(TEKRAERPOS_SAAS_DIR . 'public/class-public-router.php')) {
             require_once TEKRAERPOS_SAAS_DIR . 'public/class-public-router.php';
             TEKRAERPOS_Public_Router::get_instance();
        }
         if (file_exists(TEKRAERPOS_SAAS_DIR . 'public/class-public-shortcodes.php')) {
             require_once TEKRAERPOS_SAAS_DIR . 'public/class-public-shortcodes.php';
             new TEKRAERPOS_Public_Shortcodes();
        }
        if (file_exists(TEKRAERPOS_SAAS_DIR . 'public/signup-form.php')) {
             require_once TEKRAERPOS_SAAS_DIR . 'public/signup-form.php';
        }
        
        if (is_admin()) {
            require_once TEKRAERPOS_SAAS_DIR . 'admin/class-admin-menu.php';
            new TEKRAERPOS_Admin_Menu();
        }
    }

    public static function activate() {
        self::load_core_files();
        TEKRAERPOS_SaaS_Database::create_global_tables();
        TEKRAERPOS_SaaS_Provisioning_Seeds::seed_default_plans();
    }

    public static function deactivate() {}
}