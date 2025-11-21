<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Tenant {

    public static function create($data) {
        global $wpdb;

        $wpdb->insert($wpdb->prefix . 'saas_tenants', [
            'name' => $data['name'],
            'slug' => tekraerpos_slugify($data['name']),
            'owner_user_id' => $data['user_id'],
            'plan_id' => $data['plan_id'],
            'email' => $data['email'],
            'status' => 'trial',
            'created_at' => tekraerpos_now(),
            'updated_at' => tekraerpos_now()
        ]);

        $id = $wpdb->insert_id;

        TEKRAERPOS_SaaS_Database::create_tenant_schema($id);

        return $id;
    }

    public static function get($id) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_tenants WHERE id=%d", $id)
        );
    }

    /**
     * Mengambil data tenant berdasarkan ID User (Owner)
     * Diperlukan untuk shortcode Dashboard Button
     */
    public static function get_by_owner($user_id) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_tenants WHERE owner_user_id=%d", $user_id)
        );
    }

    /**
     * Mengambil data tenant berdasarkan Slug URL
     * Diperlukan untuk public router
     */
    public static function get_by_slug($slug) {
        global $wpdb;
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$wpdb->prefix}saas_tenants WHERE slug=%s", $slug)
        );
    }

    public static function get_plan_limits($tenant_id) {
        global $wpdb;

        $subs = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT plan_id FROM {$wpdb->prefix}saas_subscriptions WHERE tenant_id=%d",
                $tenant_id
            )
        );

        if (!$subs) return false;

        $plan = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}saas_plans WHERE id=%d",
                $subs->plan_id
            )
        );

        // Handle jika fitur kosong/null
        $features = !empty($plan->features) ? json_decode($plan->features, true) : [];

        return [
            "plan_name"    => $plan->name,
            "multi_outlet" => $features['multi_outlet'] ?? 0,
            "multi_user"   => $features['multi_user'] ?? 1,
            "offline"      => $features['offline'] ?? 1,
            "kds"          => $features['kds'] ?? 0,
            "multi_printer"=> $features['multi_printer'] ?? 0
        ];
    }

    public static function downgrade_plan($tenant_id) {
        global $wpdb;
    
        $plans_table = $wpdb->prefix . "saas_plans";
        $tenant_table = $wpdb->prefix . "saas_tenants";
    
        // ambil plan saat ini
        $tenant = $wpdb->get_row(
            $wpdb->prepare("SELECT plan_id FROM $tenant_table WHERE id=%d", $tenant_id)
        );
    
        if (!$tenant) return false;
    
        // ambil detail plan saat ini
        $current_plan = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $plans_table WHERE id=%d", $tenant->plan_id)
        );
    
        if (!$current_plan) return false;
    
        // definisi hirarki
        $order = ["enterprise","pro","starter","free"];
    
        $slug = $current_plan->slug;
        $index = array_search($slug, $order);
    
        // sudah paling bawah -> suspend
        if ($index === false || $index === (count($order)-1)) {
            $wpdb->update($tenant_table, [
                "status" => "suspended"
            ], ["id" => $tenant_id]);
    
            return "suspended";
        }
    
        // ambil slug baru
        $new_slug = $order[$index + 1];
    
        // ambil id plan baru
        $new_plan = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $plans_table WHERE slug=%s", $new_slug)
        );
    
        if (!$new_plan) return false;
    
        // update tenant -> downgrade
        $wpdb->update($tenant_table, [
            "plan_id" => $new_plan->id,
            "status"  => "active"
        ], ["id"=>$tenant_id]);
    
        return $new_slug;
    }

    public static function get_features($tenant_id) {
        global $wpdb;
    
        $tenant = $wpdb->get_row(
            $wpdb->prepare("SELECT plan_id FROM {$wpdb->prefix}saas_tenants WHERE id=%d", $tenant_id)
        );
    
        if (!$tenant) return [];
    
        $plan = $wpdb->get_row(
            $wpdb->prepare("SELECT slug,features FROM {$wpdb->prefix}saas_plans WHERE id=%d", $tenant->plan_id)
        );
    
        if (!$plan) return [];
    
        return !empty($plan->features) ? json_decode($plan->features, true) : [];
    }
}