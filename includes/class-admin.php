$features = TEKRAERPOS_SaaS_Tenant::get_features($tenant_id);

if (empty($features['multi_outlet'])) {
    remove_menu_page('tekraerpos-outlets');
}

if (empty($features['kds'])) {
    remove_menu_page('tekraerpos-kds');
}

if (empty($features['multi_printer'])) {
    remove_menu_page('tekraerpos-printer');
}
