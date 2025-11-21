<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Public_Shortcodes {
    public function __construct() {
        add_shortcode('tekra_saas_signup', [$this, 'render_signup']);
        add_shortcode('erpos_signup', [$this, 'render_signup']);
    }

    public function render_signup($atts) {
        ob_start();
        if (defined('ERPOS_PUBLIC')) {
            $file = ERPOS_PUBLIC . 'views/signup-form.php';
            if (file_exists($file)) include $file;
            else echo "Error: View not found.";
        }
        return ob_get_clean();
    }
}