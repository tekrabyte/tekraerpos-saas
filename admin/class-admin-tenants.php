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
        $tenant = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_tenants WHERE id=%d", $id)
        );
        include __DIR__ . '/views/tenant-edit.php';
    }

    public static function save() {
        global $wpdb;

        $id = intval($_POST['id']);

        $wpdb->update(
            $wpdb->prefix . 'saas_tenants',
            [
                'name'=>sanitize_text_field($_POST['name']),
                'status'=>sanitize_text_field($_POST['status']),
                'updated_at'=>current_time('mysql')
            ],
            ['id'=>$id]
        );

        wp_redirect(admin_url('admin.php?page=tekraerpos-tenants&updated=1'));
        exit;
    }
}
