<?php
/**
 * Plugin Name: TekraERPOS SaaS
 * Description: Enterprise Multi-Tenant POS – SaaS Engine
 * Version: 1.0.0
 * Author: Tekrabyte
 */

if (!defined('ABSPATH')) exit;

// Definisi Konstanta
define('TEKRAERPOS_SAAS_DIR', plugin_dir_path(__FILE__));
define('TEKRAERPOS_SAAS_URL', plugin_dir_url(__FILE__));
define('ERPOS_PUBLIC', TEKRAERPOS_SAAS_DIR . 'public/');

// Load Loader
require_once TEKRAERPOS_SAAS_DIR . 'includes/class-saas-loader.php';

// Register Hooks
register_activation_hook(__FILE__, ['TEKRAERPOS_SaaS_Loader','activate']);
register_deactivation_hook(__FILE__, ['TEKRAERPOS_SaaS_Loader','deactivate']);

add_action('plugins_loaded', ['TEKRAERPOS_SaaS_Loader','init']);