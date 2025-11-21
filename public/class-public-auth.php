<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Public_Auth {

    public function __construct() {
        add_action('admin_post_nopriv_erpos_login', [$this, 'login']);
        add_action('admin_post_erpos_login', [$this, 'login']);
    }

    public function login() {

        $email = $_POST['email'];
        $password = $_POST['password'];

        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            wp_redirect('/login?failed=1');
            exit;
        }

        wp_set_auth_cookie($user->ID);

        wp_redirect('/redirect');
        exit;
    }
}
