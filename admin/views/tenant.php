<?php
global $wpdb;
$rows = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}saas_tenants ORDER BY id DESC");
?>
<div class="wrap">
    <h1>Tenants</h1>

    <table class="wp-list-table widefat striped">
        <thead><tr>
            <th>ID</th><th>Name</th><th>Plan</th><th>Status</th><th>Owner</th><th>Actions</th>
        </tr></thead>
        <tbody>
            <?php foreach ($rows as $r): ?>
            <tr>
                <td><?php echo $r->id ?></td>
                <td><?php echo $r->name ?></td>
                <td><?php echo $r->plan_id ?></td>
                <td><?php echo $r->status ?></td>
                <td><?php echo $r->owner_user_id ?></td>
                <td>
                    <a class="button" href="admin.php?page=tekra-saas-tenants&edit=<?php echo $r->id ?>">Edit</a>
                    <a class="button" href="admin.php?page=tekra-saas-subscriptions&tenant=<?php echo $r->id ?>">Subscription</a>
                </td>
            </tr>
            <?php endforeach ?>
        </tbody>
    </table>
</div>
