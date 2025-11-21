<div class="wrap">
    <h1>Subscriptions</h1>

    <table class="widefat striped">
        <thead>
            <tr>
                <th>ID</th>
                <th>Tenant</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Invoice</th>
            </tr>
        </thead>

        <tbody>
            <?php foreach ($subs as $s): ?>
            <tr>
                <td><?php echo $s->id; ?></td>
                <td><?php echo $s->tenant_name; ?></td>
                <td><?php echo $s->plan_name; ?></td>
                <td><?php echo $s->status; ?></td>
                <td><?php echo $s->expires_at; ?></td>
                <td><?php echo $s->xendit_invoice_id; ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>

    </table>
</div>
