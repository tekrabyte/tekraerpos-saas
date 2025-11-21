<?php
if (!defined('ABSPATH')) exit;

function tekra_saas_render_signup_form($atts) { 
    ?>

<div class="tekra-signup-container" style="max-width:800px; margin:40px auto; font-family:sans-serif;">
    
    <div id="step-plans">
        <h2 style="text-align:center; margin-bottom:30px;">Pilih Paket Langganan</h2>
        <div id="plan-loader" style="text-align:center;">Memuat paket...</div>
        
        <div id="plans-grid" style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
            </div>
    </div>

    <div id="step-form" style="display:none; max-width:450px; margin:0 auto;">
        <button type="button" onclick="showPlans()" style="background:none; border:none; color:#666; cursor:pointer; margin-bottom:15px;">← Kembali pilih paket</button>
        
        <div style="background:#fff; padding:30px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
            <h3 style="margin-top:0;">Lengkapi Data Toko</h3>
            <div id="selected-plan-info" style="background:#f0f9ff; color:#0c4a6e; padding:10px; border-radius:6px; font-size:14px; margin-bottom:20px; border:1px solid #bae6fd;"></div>

            <form id="tekraSignupForm">
                <input type="hidden" name="plan_id" id="input-plan-id">
                
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-weight:bold; font-size:14px; margin-bottom:5px;">Nama Toko</label>
                    <input type="text" name="store_name" required style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px;">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; font-weight:bold; font-size:14px; margin-bottom:5px;">Link Akses (Slug)</label>
                    <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:6px; background:#f9f9f9; overflow:hidden;">
                        <span style="padding:12px; color:#666; font-size:13px; border-right:1px solid #ddd;">dashboard.tekrabyte.id/</span>
                        <input type="text" name="slug" placeholder="kopiku" required style="flex:1; border:none; padding:12px; background:transparent; outline:none;">
                    </div>
                </div>

                <div style="margin-bottom:15px;">
                    <label style="display:block; font-weight:bold; font-size:14px; margin-bottom:5px;">Email Owner</label>
                    <input type="email" name="email" required style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px;">
                </div>

                <div style="margin-bottom:25px;">
                    <label style="display:block; font-weight:bold; font-size:14px; margin-bottom:5px;">Password</label>
                    <input type="password" name="password" required style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px;">
                </div>

                <button type="submit" id="btnSubmit" style="width:100%; padding:14px; background:#2563eb; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:16px;">
                    Lanjut Pembayaran →
                </button>
                
                <div id="msgBox" style="margin-top:15px; font-size:14px; text-align:center;"></div>
            </form>
        </div>
    </div>

</div>

<script>
// Load Plans saat halaman dibuka
document.addEventListener("DOMContentLoaded", async function() {
    try {
        const res = await fetch("/wp-json/tekra-saas/v1/plans"); // Endpoint Get Plans
        const json = await res.json();
        
        if(json.success) {
            renderPlans(json.plans);
        }
    } catch (e) {
        document.getElementById("plan-loader").innerText = "Gagal memuat paket.";
    }
});

function renderPlans(plans) {
    const container = document.getElementById("plans-grid");
    document.getElementById("plan-loader").style.display = "none";
    
    let html = "";
    plans.forEach(p => {
        const price = parseInt(p.price_month);
        const priceDisplay = price === 0 ? "GRATIS" : "Rp " + price.toLocaleString() + "/bln";
        const btnText = price === 0 ? "Mulai Gratis" : "Pilih Paket";
        
        html += `
        <div style="border:1px solid #eee; padding:25px; border-radius:12px; width:220px; text-align:center; background:#fff; transition:0.2s; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <h3 style="margin:0; color:#333;">${p.name}</h3>
            <div style="font-size:24px; font-weight:bold; color:#2563eb; margin:15px 0;">${priceDisplay}</div>
            <div style="font-size:13px; color:#666; margin-bottom:20px; height:60px;">
                ${p.trial_days} Hari Trial<br>
                Fitur: ${JSON.parse(p.features).multi_outlet ? 'Multi Outlet' : '1 Outlet'}
            </div>
            <button onclick='selectPlan(${p.id}, "${p.name}", "${priceDisplay}")' style="width:100%; padding:10px; background:#fff; border:1px solid #2563eb; color:#2563eb; border-radius:6px; cursor:pointer; font-weight:bold;">
                ${btnText}
            </button>
        </div>
        `;
    });
    container.innerHTML = html;
}

window.selectPlan = function(id, name, price) {
    document.getElementById("input-plan-id").value = id;
    document.getElementById("selected-plan-info").innerText = `Paket Dipilih: ${name} (${price})`;
    
    // Ubah Teks Tombol Berdasarkan Harga
    const btn = document.getElementById("btnSubmit");
    if (price === "GRATIS") {
        btn.innerText = "Buat Akun Sekarang";
        btn.style.background = "#16a34a"; // Hijau
    } else {
        btn.innerText = "Lanjut Pembayaran →";
        btn.style.background = "#2563eb"; // Biru
    }

    document.getElementById("step-plans").style.display = "none";
    document.getElementById("step-form").style.display = "block";
}

window.showPlans = function() {
    document.getElementById("step-plans").style.display = "block";
    document.getElementById("step-form").style.display = "none";
}

document.getElementById("tekraSignupForm").addEventListener("submit", async function(e){
    e.preventDefault();
    
    const btn = document.getElementById("btnSubmit");
    const msg = document.getElementById("msgBox");
    const formData = new FormData(this);

    btn.disabled = true;
    const oriText = btn.innerText;
    btn.innerText = "Memproses...";
    msg.innerHTML = "";

    try {
        const res = await fetch("/wp-json/tekra-saas/v1/signup", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (res.ok && data.success) {
            msg.style.color = "green";
            if (data.type === 'payment') {
                msg.innerHTML = "✅ Invoice dibuat! Mengalihkan ke pembayaran...";
            } else {
                msg.innerHTML = "✅ Sukses! Mengalihkan ke dashboard...";
            }
            
            setTimeout(() => {
                window.location.href = data.redirect_url; 
            }, 1500);
        } else {
            throw new Error(data.message || "Terjadi kesalahan.");
        }

    } catch (err) {
        msg.style.color = "red";
        msg.innerHTML = "❌ " + err.message;
        btn.disabled = false;
        btn.innerText = oriText;
    }
});
</script>

<?php }
add_shortcode('tekra_saas_signup', 'tekra_saas_render_signup_form');