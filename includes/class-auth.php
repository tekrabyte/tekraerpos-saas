<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_Auth {

    public static function validate_api_key($key) {
        $stored = get_option('tekra_saas_api_key');
        return hash_equals($stored, $key);
    }

    public static function verify_jwt($token) {
        $secret = get_option('tekra_saas_jwt_secret');
        if (!$secret) return false;

        try {
            list($header, $payload, $signature) = explode('.', $token);
            $verify = hash_hmac('sha256', "$header.$payload", $secret, true);
            return hash_equals($verify, base64_decode($signature));
        } catch (\Throwable $e) {
            return false;
        }
    }
}
