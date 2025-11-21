<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Admin {

    public static function init() {
        add_action('admin_menu', [__CLASS__, 'menu']);
    }

    public static function menu() {
        add_menu_page(
            "TekraERPOS SaaS",
            "TekraERPOS",
            "manage_options",
            "tekra-saas",
            [__CLASS__, "dashboard_page"],
            "dashicons-cloud",
            3
        );

        add_submenu_page(
            "tekra-saas",
            "Tenants",
            "Tenants",
            "manage_options",
            "tekra-saas-tenants",
            [__CLASS__, "tenants_page"]
        );

        add_submenu_page(
            "tekra-saas",
            "Plans",
            "Plans",
            "manage_options",
            "tekra-saas-plans",
            [__CLASS__, "plans_page"]
        );

        add_submenu_page(
            "tekra-saas",
            "Subscriptions",
            "Subscriptions",
            "manage_options",
            "tekra-saas-subscriptions",
            [__CLASS__, "subs_page"]
        );

        add_submenu_page(
            "tekra-saas",
            "Logs",
            "Logs",
            "manage_options",
            "tekra-saas-logs",
            [__CLASS__, "logs_page"]
        );

        add_submenu_page(
            "tekra-saas",
            "System Settings",
            "System Settings",
            "manage_options",
            "tekra-saas-settings",
            [__CLASS__, "settings_page"]
        );
    }

    public static function dashboard_page() {
        require __DIR__ . "/views/dashboard.php";
    }

    public static function tenants_page() {
        require __DIR__ . "/views/tenants.php";
    }

    public static function plans_page() {
        require __DIR__ . "/views/plans.php";
    }

    public static function subs_page() {
        require __DIR__ . "/views/subscriptions.php";
    }

    public static function logs_page() {
        require __DIR__ . "/views/logs.php";
    }

    public static function settings_page() {
        require __DIR__ . "/views/settings.php";
    }
}
