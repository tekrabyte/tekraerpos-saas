<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_Menu {

    public function __construct() {
        // --- PERBAIKAN UTAMA DI SINI ---
        // Kita harus me-load file class admin secara manual agar ditemukan oleh WordPress
        require_once __DIR__ . '/class-admin-tenants.php';
        require_once __DIR__ . '/class-admin-plans.php';
        require_once __DIR__ . '/class-admin-subscriptions.php';
        
        // Cek jika file settings ada (opsional, untuk mencegah error jika file belum dibuat)
        if (file_exists(__DIR__ . '/class-admin-settings.php')) {
            require_once __DIR__ . '/class-admin-settings.php';
        }
        // -------------------------------

        add_action('admin_menu', [$this, 'menu']);
    }

    public static function get_instance() { return new self(); }

    public function menu() {

        add_menu_page(
            'TekraERPOS SaaS',
            'TekraERPOS SaaS',
            'manage_options',
            'tekraerpos-saas',
            [$this, 'dashboard'],
            'dashicons-store',
            55
        );

        add_submenu_page(
            'tekraerpos-saas',
            'Tenants',
            'Tenants',
            'manage_options',
            'tekraerpos-tenants',
            ['TEKRAERPOS_Admin_Tenants','render'] // Class ini sekarang sudah di-require di __construct
        );

        add_submenu_page(
            'tekraerpos-saas',
            'Plans',
            'Plans',
            'manage_options',
            'tekraerpos-plans',
            ['TEKRAERPOS_Admin_Plans','render']
        );

        add_submenu_page(
            'tekraerpos-saas',
            'Subscriptions',
            'Subscriptions',
            'manage_options',
            'tekraerpos-subscriptions',
            ['TEKRAERPOS_Admin_Subscriptions','render']
        );
        
        // Tambahan Menu Settings (Jika class-nya ada)
        if (class_exists('TEKRAERPOS_Admin_Settings')) {
            add_submenu_page(
                'tekraerpos-saas',
                'Settings',
                'Settings',
                'manage_options',
                'tekra-saas-settings',
                ['TEKRAERPOS_Admin_Settings', 'render']
            );
        }
    }

    public function dashboard() {
        include __DIR__ . '/views/dashboard.php';
    }
}