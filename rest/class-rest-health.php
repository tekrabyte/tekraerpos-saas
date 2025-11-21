<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Health {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('tekra-saas/v1', '/system/health', [
            'methods'             => 'GET',
            'callback'            => [$this, 'check_health'],
            'permission_callback' => '__return_true', // Bisa diakses publik untuk debugging awal (atau batasi ke admin)
        ]);
    }

    public function check_health() {
        global $wpdb;
        $report = [];
        $start_time = microtime(true);

        // 1. TEST DATABASE CONNECTION
        try {
            $db_check = $wpdb->query("SELECT 1");
            $report['database'] = [
                'status' => $db_check !== false ? 'ok' : 'error',
                'message' => $db_check !== false ? 'Terhubung' : $wpdb->last_error
            ];
        } catch (Exception $e) {
            $report['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // 2. TEST TABEL UTAMA (Integrity Check)
        $required_tables = ['saas_tenants', 'saas_plans', 'saas_subscriptions', 'saas_invoices'];
        $tables_ok = true;
        $missing_tables = [];

        foreach ($required_tables as $tbl) {
            $full_name = $wpdb->prefix . $tbl;
            if ($wpdb->get_var("SHOW TABLES LIKE '$full_name'") != $full_name) {
                $tables_ok = false;
                $missing_tables[] = $tbl;
            }
        }
        $report['tables'] = [
            'status' => $tables_ok ? 'ok' : 'warning',
            'missing' => $missing_tables,
            'message' => $tables_ok ? 'Struktur tabel lengkap' : 'Beberapa tabel hilang'
        ];

        // 3. TEST KONEKSI XENDIT
        $options = get_option('tekra_saas_xendit_options');
        $secret_key = $options['xendit_secret'] ?? '';
        
        if (empty($secret_key)) {
            $report['xendit'] = ['status' => 'warning', 'message' => 'API Key belum disetting'];
        } else {
            // Coba ping endpoint Balance Xendit
            $remote = wp_remote_get('https://api.xendit.co/balance', [
                'headers' => ['Authorization' => 'Basic ' . base64_encode($secret_key . ':')],
                'timeout' => 5
            ]);

            if (is_wp_error($remote)) {
                $report['xendit'] = ['status' => 'error', 'message' => $remote->get_error_message()];
            } else {
                $code = wp_remote_retrieve_response_code($remote);
                $report['xendit'] = [
                    'status' => $code === 200 ? 'ok' : 'error',
                    'http_code' => $code,
                    'message' => $code === 200 ? 'Koneksi Xendit Stabil' : 'Gagal terhubung ke Xendit'
                ];
            }
        }

        // 4. SERVER ENVIRONMENT
        $report['server'] = [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'],
            'wp_version' => get_bloginfo('version'),
            'https' => is_ssl() ? 'Yes' : 'No'
        ];

        // 5. RESPONSE TIME
        $end_time = microtime(true);
        $report['latency'] = round(($end_time - $start_time) * 1000, 2) . ' ms';

        return [
            'success' => true,
            'timestamp' => current_time('mysql'),
            'health' => $report
        ];
    }
}

new TEKRAERPOS_SaaS_REST_Health();