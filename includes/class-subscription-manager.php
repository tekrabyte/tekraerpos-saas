<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Subscription {

    public static function start_trial($tenant_id, $plan_id) {
        global $wpdb;

        $plan = TEKRAERPOS_SaaS_Plans::get($plan_id);
        $expires = date('Y-m-d H:i:s', strtotime("+{$plan->trial_days} days"));

        $wpdb->insert($wpdb->prefix . 'saas_subscriptions', [
            'tenant_id' => $tenant_id,
            'plan_id' => $plan_id,
            'status' => 'trial',
            'started_at' => tekraerpos_now(),
            'expires_at' => $expires,
            'created_at' => tekraerpos_now()
        ]);
    }
}
