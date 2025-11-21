<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Tenant_Settings {

    public static function register() {
        register_rest_route("tekra-saas/v1", "/tenant/settings", [
            "methods" => "GET",
            "callback" => [__CLASS__, "get_settings"],
            "permission_callback" => ["TEKRAERPOS_SaaS_REST_Auth", "auth"]
        ]);

        register_rest_route("tekra-saas/v1", "/tenant/settings/update", [
            "methods" => "POST",
            "callback" => [__CLASS__, "update_settings"],
            "permission_callback" => ["TEKRAERPOS_SaaS_REST_Auth", "auth"]
        ]);

        register_rest_route("tekra-saas/v1", "/tenant/settings/upgrade", [
            "methods" => "POST",
            "callback" => [__CLASS__, "upgrade_plan"],
            "permission_callback" => ["TEKRAERPOS_SaaS_REST_Auth", "auth"]
        ]);

        register_rest_route("tekra-saas/v1", "/tenant/settings/reset-pos", [
            "methods" => "POST",
            "callback" => [__CLASS__, "reset_pos"],
            "permission_callback" => ["TEKRAERPOS_SaaS_REST_Auth", "auth"]
        ]);
    }

    public static function get_settings($r) {
        $uid = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_instance()->get_tenant_by_user($uid);

        return wp_send_json_success([
            "tenant" => $tenant,
            "plan" => TEKRAERPOS_SaaS_Tenant::get_plan_info($tenant->plan_id)
        ]);
    }

    public static function update_settings($r) {
        $uid = get_current_user_id();
        $t = TEKRAERPOS_SaaS_Tenant::get_instance()->get_tenant_by_user($uid);

        $data = [
            "name" => sanitize_text_field($r["name"]),
            "address" => sanitize_textarea_field($r["address"]),
            "phone" => sanitize_text_field($r["phone"]),
            "logo" => esc_url_raw($r["logo"]),
        ];

        TEKRAERPOS_SaaS_Tenant::get_instance()->update_tenant($t->id, $data);

        return wp_send_json_success(["message" => "Updated"]);
    }

    public static function upgrade_plan($r) {
        $uid = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_instance()->get_tenant_by_user($uid);

        return TEKRAERPOS_SaaS_Subscription::create_invoice([
            "tenant_id" => $tenant->id,
            "plan_id"   => $r["plan_id"]
        ]);
    }

    public static function reset_pos() {
        $uid = get_current_user_id();
        $tenant = TEKRAERPOS_SaaS_Tenant::get_instance()->get_tenant_by_user($uid);

        TEKRAERPOS_SaaS_Tenant::reset_pos_tables($tenant->id);

        return wp_send_json_success(["message" => "POS reset successful"]);
    }
}
