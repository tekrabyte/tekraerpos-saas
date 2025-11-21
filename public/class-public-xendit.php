<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Public_Xendit {

    public static function create_invoice($tenant_id, $plan) {

        $secret = get_option('erpos_xendit_secret');

        $url = "https://api.xendit.co/v2/invoices";

        $data = [
            "external_id" => "tenant_".$tenant_id."_".time(),
            "description" => "Upgrade Plan {$plan->name}",
            "amount" => $plan->price_month,
        ];

        $response = wp_remote_post($url, [
            'headers'=>[
                'Authorization'=>'Basic '.base64_encode($secret.':'),
                'Content-Type'=>'application/json'
            ],
            'body'=>json_encode($data)
        ]);

        return json_decode($response['body']);
    }
}
