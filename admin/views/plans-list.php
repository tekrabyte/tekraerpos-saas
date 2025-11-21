<div class="wrap">
    <h1>Subscription Plans</h1>

    <table class="widefat striped">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Monthly</th>
                <th>Yearly</th>
                <th>Trial</th>
                <th>Tools</th>
            </tr>
        </thead>

        <tbody>
            <?php foreach ($plans as $p): ?>
            <tr>
                <td><?php echo $p->id; ?></td>
                <td><?php echo $p->name; ?></td>
                <td>Rp <?php echo number_format($p->price_month); ?></td>
                <td>Rp <?php echo number_format($p->price_year); ?></td>
                <td><?php echo $p->trial_days; ?> days</td>
                <td>
                    <a href="admin.php?page=tekraerpos-plans&action=edit&id=<?php echo $p->id; ?>" class="button">Edit</a>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>

    </table>
</div>
