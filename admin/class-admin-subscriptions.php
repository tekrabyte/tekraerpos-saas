<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_Subscriptions {

    public static function render() {
        global $wpdb;

        $subs = $wpdb->get_results("
            SELECT s.*, t.name as tenant_name, p.name as plan_name
            FROM {$wpdb->prefix}saas_subscriptions s
            LEFT JOIN {$wpdb->prefix}saas_tenants t ON t.id=s.tenant_id
            LEFT JOIN {$wpdb->prefix}saas_plans p ON p.id=s.plan_id
            ORDER BY s.id DESC
        ");

        include __DIR__ . '/views/subscriptions-list.php';
    }
}
