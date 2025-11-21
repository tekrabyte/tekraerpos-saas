<?php if (!defined('ABSPATH')) exit; ?>

<div class="wrap">
    <h1>Welcome to TekraERPOS SaaS</h1>
    <p class="description">Manage tenants, billing, plans, and global POS infrastructure.</p>

    <div style="margin-top:20px; display:flex; gap:20px; flex-wrap:wrap">
        <div class="card" style="padding:20px; width:300px">
            <h2>Tenants</h2>
            <p>Manage all active and inactive tenants.</p>
            <a href="?page=tekra-saas-tenants" class="button button-primary">Open</a>
        </div>

        <div class="card" style="padding:20px; width:300px">
            <h2>Plans</h2>
            <p>Create & update SaaS subscription plans.</p>
            <a href="?page=tekra-saas-settings&tab=plans" class="button">Open</a>
        </div>

        <div class="card" style="padding:20px; width:300px">
            <h2>Xendit Billing</h2>
            <p>Set your API keys and invoice callback URL.</p>
            <a href="?page=tekra-saas-settings&tab=xendit" class="button">Configure</a>
        </div>
    </div>
</div>
