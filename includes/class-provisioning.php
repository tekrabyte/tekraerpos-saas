<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Provisioning {

    public static function create_tenant_full($data) {

        $tenant_id = TEKRAERPOS_SaaS_Tenant::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'user_id' => $data['user_id'],
            'plan_id' => $data['plan_id']
        ]);

        TEKRAERPOS_SaaS_Subscription::start_trial($tenant_id, $data['plan_id']);

        return $tenant_id;
    }
}
