<div class="wrap">
    <h1>Tenants</h1>

    <table class="widefat striped">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Tools</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($tenants as $t): ?>
            <tr>
                <td><?php echo $t->id; ?></td>
                <td><?php echo esc_html($t->name); ?></td>
                <td><?php echo $t->plan_id; ?></td>
                <td><?php echo $t->email; ?></td>
                <td><?php echo $t->status; ?></td>
                <td><?php echo $t->created_at; ?></td>
                <td>
                    <a href="admin.php?page=tekraerpos-tenants&action=edit&id=<?php echo $t->id; ?>" class="button">Edit</a>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
