<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_Settings {

    public static function init() {
        add_action('admin_init', [__CLASS__, 'register_settings']);
        // Enqueue script khusus admin jika perlu, tapi kita pakai inline script agar praktis
    }

    public static function render() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Load View
        $view_path = __DIR__ . '/views/settings.php';
        if (file_exists($view_path)) {
            include $view_path;
        } else {
            echo '<div class="error"><p>Error: File view settings.php tidak ditemukan.</p></div>';
        }
    }

    public static function register_settings() {
        // ---------------------------------------------------------
        // 1. TAB GENERAL
        // ---------------------------------------------------------
        register_setting('tekra_saas_general', 'tekra_saas_general_options');
        
        add_settings_section(
            'tekra_general_section',
            'Pengaturan Umum',
            null,
            'tekra_saas_general'
        );

        add_settings_field(
            'app_currency',
            'Mata Uang',
            [__CLASS__, 'render_text_field'],
            'tekra_saas_general',
            'tekra_general_section',
            ['option_name' => 'tekra_saas_general_options', 'field_name' => 'currency', 'default' => 'IDR']
        );


        // ---------------------------------------------------------
        // 2. TAB XENDIT
        // ---------------------------------------------------------
        register_setting('tekra_saas_xendit', 'tekra_saas_xendit_options');

        add_settings_section(
            'tekra_xendit_section',
            'Konfigurasi Pembayaran',
            null,
            'tekra_saas_xendit'
        );

        add_settings_field(
            'xendit_secret_key',
            'Xendit Secret Key',
            [__CLASS__, 'render_text_field'],
            'tekra_saas_xendit',
            'tekra_xendit_section',
            ['option_name' => 'tekra_saas_xendit_options', 'field_name' => 'xendit_secret', 'type' => 'password']
        );

        add_settings_field(
            'xendit_public_key',
            'Xendit Public Key',
            [__CLASS__, 'render_text_field'],
            'tekra_saas_xendit',
            'tekra_xendit_section',
            ['option_name' => 'tekra_saas_xendit_options', 'field_name' => 'xendit_public']
        );


        // ---------------------------------------------------------
        // 3. TAB PLANS
        // ---------------------------------------------------------
        register_setting('tekra_saas_plans', 'tekra_saas_plans_options');
        
        add_settings_section(
            'tekra_plans_section',
            'Global Plan Settings',
            function() { echo '<p>Untuk mengedit harga dan fitur paket, silakan gunakan menu <a href="admin.php?page=tekraerpos-plans">Plans Management</a>.</p>'; },
            'tekra_saas_plans'
        );


        // ---------------------------------------------------------
        // 4. TAB BRANDING
        // ---------------------------------------------------------
        register_setting('tekra_saas_branding', 'tekra_saas_branding_options');

        add_settings_section(
            'tekra_branding_section',
            'Kustomisasi Tampilan',
            null,
            'tekra_saas_branding'
        );

        add_settings_field(
            'brand_app_name',
            'Nama Aplikasi',
            [__CLASS__, 'render_text_field'],
            'tekra_saas_branding',
            'tekra_branding_section',
            ['option_name' => 'tekra_saas_branding_options', 'field_name' => 'app_name', 'default' => 'TekraERPOS']
        );

        add_settings_field(
            'brand_logo_url',
            'URL Logo Dashboard',
            [__CLASS__, 'render_text_field'],
            'tekra_saas_branding',
            'tekra_branding_section',
            ['option_name' => 'tekra_saas_branding_options', 'field_name' => 'logo_url']
        );
    }

    /**
     * Helper Render Field Input Text/Password
     */
    public static function render_text_field($args) {
        $option_name = $args['option_name'];
        $field_name  = $args['field_name'];
        $type        = $args['type'] ?? 'text';
        $default     = $args['default'] ?? '';

        $options = get_option($option_name);
        $value   = $options[$field_name] ?? $default;

        // Render Input
        echo sprintf(
            '<input type="%s" name="%s[%s]" value="%s" class="regular-text" id="%s">',
            esc_attr($type),
            esc_attr($option_name),
            esc_attr($field_name),
            esc_attr($value),
            esc_attr($field_name) // ID untuk JS selector
        );
        
        // Khusus Field Xendit Secret: Tambah Tombol Test & Script
        if ($field_name === 'xendit_secret') {
            $api_url = get_rest_url(null, 'tekra-saas/v1/system/health');
            echo '<p class="description">Masukkan Secret Key (Development/Production) dari dashboard Xendit.</p>';
            
            ?>
            <div style="margin-top: 10px;">
                <button type="button" id="btn-test-xendit" class="button button-secondary">
                    <span class="dashicons dashicons-admin-network" style="margin-top:3px;"></span> Test Koneksi API
                </button>
                <span id="xendit-test-result" style="margin-left: 10px; font-weight: 600;"></span>
            </div>

            <script>
            document.getElementById("btn-test-xendit").addEventListener("click", async function() {
                const btn = this;
                const resultSpan = document.getElementById("xendit-test-result");
                const originalText = btn.innerHTML;

                // UI Loading
                btn.disabled = true;
                btn.innerHTML = 'Testing...';
                resultSpan.innerText = "";
                resultSpan.className = "";

                try {
                    // Panggil Endpoint Health Check
                    const response = await fetch("<?php echo esc_url($api_url); ?>");
                    const json = await response.json();

                    if (json.success && json.health && json.health.xendit) {
                        const xendit = json.health.xendit;
                        
                        if (xendit.status === 'ok') {
                            resultSpan.style.color = "green";
                            resultSpan.innerHTML = "✅ " + xendit.message;
                        } else {
                            resultSpan.style.color = "red";
                            resultSpan.innerHTML = "❌ " + xendit.message;
                        }
                    } else {
                        resultSpan.style.color = "orange";
                        resultSpan.innerText = "⚠️ Tidak dapat mengambil status Xendit.";
                    }
                } catch (error) {
                    resultSpan.style.color = "red";
                    resultSpan.innerText = "❌ Error: " + error.message;
                }

                // Reset Button
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
            </script>
            <?php
        }
    }
}

TEKRAERPOS_Admin_Settings::init();