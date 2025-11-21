<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Restrict {

    public function __construct() {
        add_filter("tekraerpos/check_feature", [$this, "validate_feature"], 10, 3);
    }

    public function validate_feature($allowed, $tenant_id, $feature) {
if (!$allowed) {
    // auto choose next plan
    $next_plan = self::get_next_upgrade_plan($tenant_id);

    $invoice_url = TEKRAERPOS_Xendit_Invoice::create_invoice($tenant_id, $next_plan);

    return [
        "allowed" => false,
        "upgrade_url" => $invoice_url,
        "plan_id" => $next_plan
    ];
}
        $limits = TEKRAERPOS_SaaS_Tenant::get_plan_limits($tenant_id);
        if (!$limits) return false;

        switch ($feature) {

            case "multi_outlet":
                return $limits['multi_outlet'] > 1;

            case "add_outlet":
                $count = $this->count_outlets($tenant_id);
                return $count < $limits['multi_outlet'];

            case "multi_user":
                return $limits['multi_user'] > 1;

            case "kds":
                return $limits['kds'] == 1;

            case "multi_printer":
                return $limits['multi_printer'] == 1;

            default:
                return true;
        }
    }

    private function count_outlets($tenant_id) {
        global $wpdb;
        $tbl = $wpdb->prefix . "tekra_t{$tenant_id}_outlets";
        return intval($wpdb->get_var("SELECT COUNT(*) FROM $tbl"));
    }
    public static function get_next_upgrade_plan($tenant_id) {
    global $wpdb;

    $sub = $wpdb->get_row(
        $wpdb->prepare("SELECT plan_id FROM {$wpdb->prefix}saas_subscriptions WHERE tenant_id=%d", $tenant_id)
    );

    if (!$sub) return 2;

    $plan = intval($sub->plan_id);

    if ($plan == 1) return 2; // Starter → Pro
    if ($plan == 2) return 3; // Pro → Enterprise

    return 3; // already enterprise
}
public static function block_if_suspended($tenant_id) {
    global $wpdb;
    $t = $wpdb->prefix . 'saas_tenants';

    $status = $wpdb->get_var($wpdb->prepare(
        "SELECT status FROM $t WHERE id=%d",
        $tenant_id
    ));

    if ($status === "suspended") {
        return [
            "blocked" => true,
            "reason" => "suspended",
            "message" => "Your subscription has expired. Please renew to continue.",
            "renew_url" => site_url("/billing?tenant=$tenant_id")
        ];
    }
    return ["blocked" => false];
}

}

new TEKRAERPOS_SaaS_REST_Restrict();
