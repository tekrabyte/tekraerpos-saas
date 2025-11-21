<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_Plans {

    public static function render() {
        $action = $_GET['action'] ?? 'list';

        switch ($action) {
            case 'edit':
                self::edit(intval($_GET['id']));
                break;

            case 'save':
                self::save();
                break;

            default:
                self::lists();
        }
    }

    public static function lists() {
        global $wpdb;
        $plans = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}saas_plans ORDER BY id ASC");
        include __DIR__ . '/views/plans-list.php';
    }

    public static function edit($id) {
        global $wpdb;
        $plan = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_plans WHERE id=%d",$id)
        );
        include __DIR__ . '/views/plan-edit.php';
    }

    public static function save() {
        global $wpdb;

        $id = intval($_POST['id']);
        $features = json_encode([
            'outlets'=>intval($_POST['outlets']),
            'users'=>intval($_POST['users']),
            'offline'=>intval($_POST['offline']),
            'kds'=>intval($_POST['kds']),
            'printers'=>intval($_POST['printers'])
        ]);

        $wpdb->update(
            $wpdb->prefix . 'saas_plans',
            [
                'name'=>sanitize_text_field($_POST['name']),
                'price_month'=>floatval($_POST['price_month']),
                'price_year'=>floatval($_POST['price_year']),
                'trial_days'=>intval($_POST['trial_days']),
                'features'=>$features
            ],
            ['id'=>$id]
        );

        wp_redirect(admin_url('admin.php?page=tekraerpos-plans&updated=1'));
        exit;
    }
}
