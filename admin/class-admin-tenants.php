<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_Tenants {

    public static function render() {
        $action = $_GET['action'] ?? 'list';
        switch ($action) {
            case 'edit':
                self::edit_page(intval($_GET['id']));
                break;
            case 'save':
                self::save();
                break;
            default:
                self::list_page();
        }
    }

    public static function list_page() {
        global $wpdb;
        $tenants = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}saas_tenants ORDER BY id DESC");
        include __DIR__ . '/views/tenants-list.php';
    }

    public static function edit_page($id) {
        global $wpdb;
        // PERBAIKAN 1: Gunakan variabel $t agar sesuai dengan view tenant-edit.php
        $t = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_tenants WHERE id=%d", $id));
        
        // Ambil plans untuk dropdown
        $plans = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}saas_plans"); 
        
        include __DIR__ . '/views/tenant-edit.php';
    }

    public static function save() {
        global $wpdb;
        $id = intval($_POST['id']);

        // PERBAIKAN 2: Logika Tombol Regenerate Schema
        if (isset($_POST['regen_schema']) && $_POST['regen_schema'] == '1') {
            // Panggil fungsi update struktur database
            TEKRAERPOS_SaaS_Database::create_tenant_schema($id);
            
            // Redirect kembali dengan pesan sukses
            wp_redirect(admin_url('admin.php?page=tekraerpos-tenants&action=edit&id='.$id.'&msg=schema_updated'));
            exit;
        }

        // Update Data Tenant Biasa
        $wpdb->update(
            $wpdb->prefix . 'saas_tenants',
            [
                'name' => sanitize_text_field($_POST['name']),
                'slug' => sanitize_text_field($_POST['slug']),
                'email' => sanitize_email($_POST['email']),
                'plan_id' => intval($_POST['plan_id']),
                'status' => sanitize_text_field($_POST['status']),
                'updated_at' => current_time('mysql')
            ],
            ['id' => $id]
        );

        wp_redirect(admin_url('admin.php?page=tekraerpos-tenants&updated=1'));
        exit;
    }
}