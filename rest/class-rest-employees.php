<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Employees {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        $namespace = 'tekra-saas/v1';
        $base      = 'tenant/employees';

        // GET: List Karyawan
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_items'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // POST: Tambah Karyawan Baru
        register_rest_route($namespace, '/' . $base, [
            'methods'             => 'POST',
            'callback'            => [$this, 'create_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);

        // DELETE: Hapus Karyawan
        register_rest_route($namespace, '/' . $base . '/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'delete_item'],
            'permission_callback' => [$this, 'check_permission']
        ]);
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    public function get_items($request) {
        $user_id = get_current_user_id();
        $tenant  = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        // Cari user yang memiliki meta key 'tekra_tenant_id' sama dengan tenant ini
        // Dan role bukan administrator (agar owner tidak muncul sebagai karyawan biasa)
        $args = [
            'meta_key'   => 'tekra_tenant_id',
            'meta_value' => $tenant->id,
            'exclude'    => [$user_id] 
        ];
        
        $users = get_users($args);
        $data = [];
        
        foreach ($users as $u) {
            $data[] = [
                'id'    => $u->ID,
                'name'  => $u->display_name,
                'email' => $u->user_email,
                'role'  => 'cashier' // Default role
            ];
        }

        return rest_ensure_response(['employees' => $data]);
    }

    public function create_item($request) {
        $user_id = get_current_user_id();
        $tenant  = TEKRAERPOS_SaaS_Tenant::get_by_owner($user_id);
        if (!$tenant) return new WP_Error('no_tenant', 'Tenant not found', ['status' => 404]);

        // --- CEK LIMIT USER BERDASARKAN PLAN ---
        $limits = TEKRAERPOS_SaaS_Tenant::get_plan_limits($tenant->id);
        // Hitung user saat ini
        $current_users = count(get_users(['meta_key' => 'tekra_tenant_id', 'meta_value' => $tenant->id]));
        
        // +1 karena owner juga dihitung sebagai user
        if (($current_users + 1) >= $limits['multi_user']) {
            return new WP_Error('limit_reached', 'User limit reached. Please upgrade plan.', ['status' => 403]);
        }
        // ---------------------------------------

        $email    = sanitize_email($request['email']);
        $name     = sanitize_text_field($request['name']);
        $password = $request['password'];

        if (email_exists($email)) {
            return new WP_Error('email_exists', 'Email already registered', ['status' => 400]);
        }

        $new_user_id = wp_create_user($email, $password, $email);
        
        if (is_wp_error($new_user_id)) {
            return $new_user_id;
        }

        // Update User Data & Link ke Tenant
        wp_update_user(['ID' => $new_user_id, 'display_name' => $name, 'role' => 'subscriber']);
        update_user_meta($new_user_id, 'tekra_tenant_id', $tenant->id);
        update_user_meta($new_user_id, 'tekra_role', 'cashier');

        return rest_ensure_response(['success' => true, 'id' => $new_user_id]);
    }

    public function delete_item($request) {
        require_once(ABSPATH.'wp-admin/includes/user.php');
        
        $id = intval($request['id']);
        // Cek apakah user ini milik tenant yang sama (Security Check)
        $tenant_id = get_user_meta($id, 'tekra_tenant_id', true);
        $owner_id  = get_current_user_id();
        $my_tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($owner_id);

        if (!$my_tenant || $tenant_id != $my_tenant->id) {
            return new WP_Error('forbidden', 'Cannot delete this user', ['status' => 403]);
        }

        wp_delete_user($id);
        return rest_ensure_response(['success' => true]);
    }
}

new TEKRAERPOS_SaaS_REST_Employees();