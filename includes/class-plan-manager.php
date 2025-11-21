<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Plans {

    public static function all() {
        global $wpdb;
        return $wpdb->get_results("SELECT * FROM {$wpdb->prefix}saas_plans ORDER BY id ASC");
    }

    public static function get($id) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_plans WHERE id=%d", $id)
        );
    }
}
