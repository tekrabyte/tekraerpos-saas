<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Public_Router {

    public function __construct() {
        add_action('init', [$this, 'add_endpoints']);
        add_filter('query_vars', [$this, 'vars']);
        add_action('template_redirect', [$this, 'render']);
    }

    public static function get_instance() { return new self(); }

    public function add_endpoints() {
        add_rewrite_rule('signup/?$', 'index.php?erpos_page=signup', 'top');
        add_rewrite_rule('login/?$', 'index.php?erpos_page=login', 'top');
        add_rewrite_rule('redirect/?$', 'index.php?erpos_page=redirect', 'top');
        add_rewrite_rule('tenant/([^/]+)/?$', 'index.php?erpos_tenant_slug=$matches[1]', 'top');
    }

    public function vars($vars) {
        $vars[] = 'erpos_page';
        $vars[] = 'erpos_tenant_slug';
        return $vars;
    }

    public function render() {
        $page = get_query_var('erpos_page');
        $slug = get_query_var('erpos_tenant_slug');

        switch ($page) {
            case 'signup':
                include ERPOS_PUBLIC . 'views/signup-form.php';
                exit;

            case 'login':
                include ERPOS_PUBLIC . 'views/login-form.php';
                exit;

            case 'redirect':
                include ERPOS_PUBLIC . 'views/redirect-loader.php';
                exit;
        }

        if ($slug) {
            $tenant = TEKRAERPOS_SaaS_Tenant::get_by_slug($slug);
            if (!$tenant) {
                wp_die("Tenant not found.");
            }

            if ($tenant->status === 'suspended') {
                include ERPOS_PUBLIC . 'views/tenant-suspended.php';
                exit;
            }

            if ($tenant->status === 'expired') {
                include ERPOS_PUBLIC . 'views/tenant-expired.php';
                exit;
            }

            wp_redirect("https://czone.tekrabyte.id/tenant/?id={$tenant->id}");
            exit;
        }
    }
}
