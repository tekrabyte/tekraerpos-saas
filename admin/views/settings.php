<?php
if (!defined('ABSPATH')) exit;

$active_tab = $_GET['tab'] ?? 'general';
?>

<div class="wrap">
    <h1>TekraERPOS SaaS – Settings</h1>

    <nav class="nav-tab-wrapper" style="margin-top:20px">
        <a href="?page=tekra-saas-settings&tab=general" class="nav-tab <?= $active_tab=='general'?'nav-tab-active':'' ?>">General</a>
        <a href="?page=tekra-saas-settings&tab=xendit" class="nav-tab <?= $active_tab=='xendit'?'nav-tab-active':'' ?>">Xendit</a>
        <a href="?page=tekra-saas-settings&tab=plans" class="nav-tab <?= $active_tab=='plans'?'nav-tab-active':'' ?>">Plans</a>
        <a href="?page=tekra-saas-settings&tab=branding" class="nav-tab <?= $active_tab=='branding'?'nav-tab-active':'' ?>">Branding</a>
    </nav>

    <form method="post" action="options.php" style="margin-top:20px">
        <?php
        if ($active_tab == 'general') {
            settings_fields('tekra_saas_general');
            do_settings_sections('tekra_saas_general');
        }

        if ($active_tab == 'xendit') {
            settings_fields('tekra_saas_xendit');
            do_settings_sections('tekra_saas_xendit');
        }

        if ($active_tab == 'plans') {
            settings_fields('tekra_saas_plans');
            do_settings_sections('tekra_saas_plans');
        }

        if ($active_tab == 'branding') {
            settings_fields('tekra_saas_branding');
            do_settings_sections('tekra_saas_branding');
        }
        submit_button();
        ?>
    </form>
</div>
