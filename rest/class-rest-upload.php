<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_SaaS_REST_Upload {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('tekra-saas/v1', '/tenant/upload', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_upload'],
            'permission_callback' => [$this, 'check_permission']
        ]);
    }

    public function check_permission() {
        return is_user_logged_in();
    }

    public function handle_upload($request) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $files = $request->get_file_params();

        if (empty($files['file'])) {
            return new WP_Error('no_file', 'No file uploaded', ['status' => 400]);
        }

        // Upload file ke WP Media Library
        $attachment_id = media_handle_upload('file', 0);

        if (is_wp_error($attachment_id)) {
            return new WP_Error('upload_failed', $attachment_id->get_error_message(), ['status' => 500]);
        }

        // Ambil URL file
        $url = wp_get_attachment_url($attachment_id);

        return [
            'success' => true,
            'url'     => $url,
            'id'      => $attachment_id
        ];
    }
}

new TEKRAERPOS_SaaS_REST_Upload();