<div class="wrap">
    <h1>Tenant Settings</h1>

    <form method="post">
        <table class="form-table">
            <tr><th>Name</th><td><input name="name" value="<?php echo $t->name ?>" class="regular-text"/></td></tr>
            <tr><th>Slug</th><td><input name="slug" value="<?php echo $t->slug ?>" class="regular-text"/></td></tr>
            <tr><th>Email</th><td><input name="email" value="<?php echo $t->email ?>" class="regular-text"/></td></tr>
            <tr><th>Plan</th>
                <td>
                    <select name="plan_id">
                        <?php foreach ($plans as $p): ?>
                            <option value="<?php echo $p->id ?>" <?php selected($t->plan_id, $p->id) ?>>
                                <?php echo $p->name ?>
                            </option>
                        <?php endforeach ?>
                    </select>
                </td>
            </tr>
            <tr><th>Status</th>
                <td>
                    <select name="status">
                        <option value="trial" <?php selected($t->status,'trial')?>>Trial</option>
                        <option value="active"<?php selected($t->status,'active')?>>Active</option>
                        <option value="expired"<?php selected($t->status,'expired')?>>Expired</option>
                        <option value="suspended"<?php selected($t->status,'suspended')?>>Suspended</option>
                    </select>
                </td>
            </tr>
        </table>

        <button class="button button-primary">Save Changes</button>
        <button class="button" name="regen_schema" value="1">Regenerate Schema</button>
    </form>
</div>
