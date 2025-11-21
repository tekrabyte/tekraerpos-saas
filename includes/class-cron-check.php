<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_CronCheck {

    public static function init() {
        add_action('tekraerpos_daily_check', [__CLASS__, 'run']);
        if (!wp_next_scheduled('tekraerpos_daily_check')) {
            wp_schedule_event(time(), 'daily', 'tekraerpos_daily_check');
        }
    }

    public static function run() {
        global $wpdb;

        $subs = $wpdb->get_results("
            SELECT s.*, t.id AS tenant_id 
            FROM {$wpdb->prefix}saas_subscriptions s
            JOIN {$wpdb->prefix}saas_tenants t ON t.id = s.tenant_id
            WHERE s.expires_at < NOW() AND s.status='active'
        ");

        foreach ($subs as $s) {
            // suspend tenant
            $wpdb->update($wpdb->prefix.'saas_tenants', [
                'status' => 'suspended'
            ], ['id'=>$s->tenant_id]);

            // mark subscription expired
            $wpdb->update($wpdb->prefix.'saas_subscriptions', [
                'status' => 'expired'
            ], ['id'=>$s->id]);
        }
    }
}
foreach ($subs as $s) {

    // lakukan downgrade
    $result = TEKRAERPOS_SaaS_Tenant::downgrade_plan($s->tenant_id);

    // tandai subscription expired
    $wpdb->update(
        $wpdb->prefix.'saas_subscriptions',
        ["status" => "expired"],
        ["id" => $s->id]
    );

    if ($result === "suspended") {
        error_log("Tenant {$s->tenant_id} suspended.");
    } else {
        error_log("Tenant {$s->tenant_id} downgraded to plan {$result}.");
    }
}

TEKRAERPOS_SaaS_CronCheck::init();
