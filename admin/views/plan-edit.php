<div class="wrap">
    <h1>Edit Plan</h1>

    <form method="post" action="admin.php?page=tekraerpos-plans&action=save">
        <input type="hidden" name="id" value="<?php echo $plan->id; ?>">

        <table class="form-table">
            <tr><th>Name</th>
                <td><input type="text" name="name" value="<?php echo $plan->name; ?>"></td>
            </tr>

            <tr><th>Monthly Price</th>
                <td><input type="number" name="price_month" value="<?php echo $plan->price_month; ?>"></td>
            </tr>

            <tr><th>Yearly Price</th>
                <td><input type="number" name="price_year" value="<?php echo $plan->price_year; ?>"></td>
            </tr>

            <tr><th>Trial Days</th>
                <td><input type="number" name="trial_days" value="<?php echo $plan->trial_days; ?>"></td>
            </tr>

            <tr><th>Max Outlets</th>
                <td><input type="number" name="outlets" value="<?php echo json_decode($plan->features)->outlets; ?>"></td>
            </tr>

            <tr><th>Max Users</th>
                <td><input type="number" name="users" value="<?php echo json_decode($plan->features)->users; ?>"></td>
            </tr>

            <tr><th>KDS</th>
                <td><input type="number" name="kds" value="<?php echo json_decode($plan->features)->kds ?? 0; ?>"></td>
            </tr>

            <tr><th>Printers</th>
                <td><input type="number" name="printers" value="<?php echo json_decode($plan->features)->printers ?? 1; ?>"></td>
            </tr>
        </table>

        <button class="button button-primary">Save</button>
    </form>
</div>
