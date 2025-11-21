<?php
global $wpdb;
$table = $wpdb->prefix . "saas_plans";

if ($_POST) {
    $wpdb->insert($table, [
        "name" => sanitize_text_field($_POST["name"]),
        "slug" => sanitize_text_field($_POST["slug"]),
        "price_month" => floatval($_POST["price_month"]),
        "price_year" => floatval($_POST["price_year"]),
        "trial_days" => intval($_POST["trial_days"]),
        "features" => wp_json_encode($_POST["features"])
    ]);
    echo "<div class='updated'><p>Plan created.</p></div>";
}

$rows = $wpdb->get_results("SELECT * FROM $table");
?>
<div class="wrap">
    <h1>Plans</h1>

    <h2>Create Plan</h2>
    <form method="post">
        <table class="form-table">
            <tr><th>Name</th><td><input name="name" required></td></tr>
            <tr><th>Slug</th><td><input name="slug" required></td></tr>
            <tr><th>Monthly Price</th><td><input name="price_month"></td></tr>
            <tr><th>Yearly Price</th><td><input name="price_year"></td></tr>
            <tr><th>Trial Days</th><td><input name="trial_days" value="14"></td></tr>
            <tr><th>Features</th><td>
                <textarea name="features" rows="5">{}</textarea>
            </td></tr>
        </table>
        <button class="button button-primary">Save</button>
    </form>

    <h2>Existing Plans</h2>
    <table class="wp-list-table widefat striped">
        <thead><tr><th>ID</th><th>Name</th><th>Slug</th><th>Price</th><th>Actions</th></tr></thead>
        <tbody>
            <?php foreach ($rows as $r): ?>
            <tr>
                <td><?php echo $r->id ?></td>
                <td><?php echo $r->name ?></td>
                <td><?php echo $r->slug ?></td>
                <td><?php echo $r->price_month ?></td>
                <td><a class="button">Edit</a></td>
            </tr>
            <?php endforeach ?>
        </tbody>
    </table>
</div>
