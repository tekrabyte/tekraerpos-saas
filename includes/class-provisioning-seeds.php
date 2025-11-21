<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Provisioning_Seeds {

    public static function seed_default_plans() {
        global $wpdb;

        $tbl = $wpdb->prefix . 'saas_plans';

        if ($wpdb->get_var("SELECT COUNT(*) FROM $tbl") > 0)
            return;

        $wpdb->insert($tbl, [
            'name'=>'Starter',
            'slug'=>'starter',
            'price_month'=>0,
            'price_year'=>0,
            'trial_days'=>14,
            'features'=>json_encode([
                'outlets' => 1,
                'users' => 1
            ]),
            'created_at'=>tekraerpos_now()
        ]);

        $wpdb->insert($tbl, [
            'name'=>'Pro',
            'slug'=>'pro',
            'price_month'=>79000,
            'price_year'=>790000,
            'trial_days'=>14,
            'features'=>json_encode([
                'outlets' => 5,
                'users' => 10
            ]),
            'created_at'=>tekraerpos_now()
        ]);

        $wpdb->insert($tbl, [
            'name'=>'Enterprise',
            'slug'=>'enterprise',
            'price_month'=>149000,
            'price_year'=>1490000,
            'trial_days'=>14,
            'features'=>json_encode([
                'outlets' => 99,
                'users' => 999
            ]),
            'created_at'=>tekraerpos_now()
        ]);
    }
}
