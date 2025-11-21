<?php if (!defined('ABSPATH')) exit; ?>

<div style="max-width:400px; margin:40px auto; padding:30px; background:#fff; border:1px solid #eee; border-radius:10px; text-align:center; box-shadow:0 5px 15px rgba(0,0,0,0.05);">
    <h2 style="margin-top:0;">Login Tenant</h2>
    <p style="color:#666; font-size:14px; margin-bottom:20px;">Masuk untuk mengelola toko Anda.</p>

    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
        <input type="hidden" name="action" value="erpos_login">
        
        <div style="margin-bottom:15px; text-align:left;">
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Email</label>
            <input type="email" name="email" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
        </div>

        <div style="margin-bottom:20px; text-align:left;">
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Password</label>
            <input type="password" name="password" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
        </div>

        <button type="submit" style="width:100%; padding:12px; background:#2563eb; color:white; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">
            Masuk Sekarang
        </button>
    </form>
    
    <?php if (isset($_GET['failed'])): ?>
        <p style="color:red; margin-top:15px;">Login gagal. Cek email/password.</p>
    <?php endif; ?>
</div>