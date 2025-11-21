<?php
if (!defined('ABSPATH')) exit;

function tekraerpos_slugify($str) {
    $str = strtolower(trim($str));
    $str = preg_replace('/[^a-z0-9]+/', '-', $str);
    return trim($str, '-');
}

function tekraerpos_json($data, $status = 200) {
    wp_send_json($data, $status);
}

function tekraerpos_now() {
    return current_time('mysql');
}
