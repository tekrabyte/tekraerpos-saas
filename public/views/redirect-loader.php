<?php
$uid = get_current_user_id();
$tenant = TEKRAERPOS_SaaS_Tenant::get_by_owner($uid);

if (!$tenant) wp_die("No tenant found.");

$url = "https://czone.tekrabyte.id/tenant/?id={$tenant->id}";
?>
<meta http-equiv="refresh" content="0; url=<?php echo $url; ?>">
Redirecting...
