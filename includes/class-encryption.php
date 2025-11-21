<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Encryption {

    private static function key_iv() {
        $secret = defined('TEKRAERPOS_SECRET_KEY')
            ? TEKRAERPOS_SECRET_KEY
            : AUTH_KEY . SECURE_AUTH_KEY;

        $key = substr(hash('sha256', $secret), 0, 32);
        $iv  = substr(hash('sha256', $key), 0, 16);

        return [$key, $iv];
    }

    public static function encrypt($txt) {
        list($key, $iv) = self::key_iv();
        return base64_encode(openssl_encrypt($txt, 'AES-256-CBC', $key, 0, $iv));
    }

    public static function decrypt($cipher) {
        list($key, $iv) = self::key_iv();
        return openssl_decrypt(base64_decode($cipher), 'AES-256-CBC', $key, 0, $iv);
    }
}
