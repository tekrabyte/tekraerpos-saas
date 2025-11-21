<?php
global $wpdb;

$tenants = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}saas_tenants");
$active  = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}saas_tenants WHERE status='active'");
$trial   = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}saas_tenants WHERE status='trial'");
$expired = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}saas_tenants WHERE status='expired'");
?>
<div class="wrap">
    <h1>TekraERPOS – SaaS Dashboard</h1>

    <div style="display:flex; gap:20px; margin-top:20px;">
        <div class="card"><h2>Tenants</h2><p><?php echo $tenants ?></p></div>
        <div class="card"><h2>Active</h2><p><?php echo $active ?></p></div>
        <div class="card"><h2>Trial</h2><p><?php echo $trial ?></p></div>
        <div class="card"><h2>Expired</h2><p><?php echo $expired ?></p></div>
    </div>

    <h2 style="margin-top:40px;">System Overview</h2>
    <p>All systems normal.</p>
</div>

<style>
.card {background:#fff;padding:20px;border-radius:8px;min-width:150px;text-align:center;border:1px solid #eee;}
.card h2 {margin:0;font-size:18px;}
.card p {font-size:24px;margin:10px 0 0;}
</style>
