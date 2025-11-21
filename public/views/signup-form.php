<?php if (!defined('ABSPATH')) exit; ?>

<style>
    .tekra-wizard { max-width: 500px; margin: 40px auto; font-family: 'Inter', sans-serif; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
    .step-header { font-size: 14px; color: #6b7280; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .step-title { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 10px; }
    .step-desc { color: #6b7280; font-size: 14px; margin-bottom: 25px; }
    
    .input-group { margin-bottom: 15px; }
    .input-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
    .input-group input, .input-group select { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: 0.2s; }
    .input-group input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    
    .btn-next { width: 100%; padding: 14px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 15px; margin-top: 10px; }
    .btn-next:disabled { background: #93c5fd; cursor: not-allowed; }

    .otp-inputs { display: flex; gap: 10px; justify-content: center; margin: 20px 0; }
    .otp-inputs input { width: 45px; height: 50px; text-align: center; font-size: 20px; font-weight: bold; border: 1px solid #d1d5db; border-radius: 8px; }
    
    .hidden { display: none; }
    .error-msg { color: #ef4444; font-size: 13px; margin-top: 10px; text-align: center; }
</style>

<div class="tekra-wizard">
    
    <div id="step-1">
        <div class="step-header">Langkah 1 dari 3</div>
        <h2 class="step-title">Buat Akun Baru</h2>
        <p class="step-desc">Daftar gratis 14 hari trial. Tidak perlu kartu kredit.</p>

        <form id="form-step-1">
            <div class="input-group">
                <label>Nama Lengkap</label>
                <input type="text" name="fullname" required placeholder="Jhon Doe">
            </div>
            <div class="input-group">
                <label>No. Handphone (WhatsApp)</label>
                <input type="tel" name="phone" required placeholder="081234567890">
            </div>
            <div class="input-group">
                <label>Email</label>
                <input type="email" name="email" id="email-input" required placeholder="jhon@email.com">
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" name="password" required placeholder="••••••••">
            </div>
            <div class="input-group">
                <label>Kode Referral (Opsional)</label>
                <input type="text" name="referral" placeholder="REF123">
            </div>
            <button type="submit" class="btn-next">Kirim Kode Verifikasi</button>
            <div class="error-msg" id="err-1"></div>
        </form>
    </div>

    <div id="step-2" class="hidden">
        <div class="step-header">Langkah 2 dari 3</div>
        <h2 class="step-title">Verifikasi No. HP</h2>
        <p class="step-desc">Masukkan 6 digit kode yang kami kirim ke WhatsApp/Email Anda.</p>

        <form id="form-step-2">
            <div class="otp-inputs" id="otp-container">
                <input type="text" maxlength="1" class="otp-field">
                <input type="text" maxlength="1" class="otp-field">
                <input type="text" maxlength="1" class="otp-field">
                <input type="text" maxlength="1" class="otp-field">
                <input type="text" maxlength="1" class="otp-field">
                <input type="text" maxlength="1" class="otp-field">
            </div>
            <button type="submit" class="btn-next">Verifikasi</button>
            <div class="error-msg" id="err-2"></div>
            <p style="text-align:center; font-size:13px; margin-top:15px; color:#666;">Tidak terima kode? <a href="#" onclick="resendOTP()">Kirim Ulang</a></p>
        </form>
    </div>

    <div id="step-3" class="hidden">
        <div class="step-header">Langkah Terakhir</div>
        <h2 class="step-title">Informasi Bisnis</h2>
        <p class="step-desc">Ceritakan sedikit tentang bisnis Anda.</p>

        <form id="form-step-3">
            <div class="input-group">
                <label>Nama Bisnis</label>
                <input type="text" name="biz_name" required placeholder="Contoh: Kopi Senja">
            </div>

            <div class="input-group">
                <label>Jenis Bisnis</label>
                <select name="biz_type" required>
                    <option value="">Pilih Tipe Bisnis...</option>
                    <option value="fnb">F&B (Makanan & Minuman)</option>
                    <option value="retail">Retail (Toko Eceran)</option>
                    <option value="service">Jasa / Services</option>
                    <option value="other">Lainnya</option>
                </select>
            </div>

            <div class="input-group">
                <label>Jumlah Outlet</label>
                <select name="outlet_count" required>
                    <option value="1">1 Outlet</option>
                    <option value="2-5">2 - 5 Outlet</option>
                    <option value="5+">Lebih dari 5</option>
                </select>
            </div>

            <div class="input-group">
                <label>Lokasi Bisnis (Kota)</label>
                <input type="text" name="city" required placeholder="Cari Kota (Misal: Jakarta Selatan)">
            </div>

            <button type="submit" class="btn-next">Selesai & Masuk Dashboard</button>
            <div class="error-msg" id="err-3"></div>
        </form>
    </div>

</div>

<script>
// State
let userEmail = "";
let userSlug = ""; // Tambahkan state untuk menyimpan slug bisnis

// --- FUNGSI UTAMA ---

// TAHAP 1: SUBMIT DATA DIRI
document.getElementById('form-step-1').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const err = document.getElementById('err-1');
    
    btn.disabled = true; btn.innerText = "Mengirim OTP..."; err.innerText = "";
    
    const fd = new FormData(this);
    userEmail = fd.get('email');
    
    try {
        const res = await fetch('/wp-json/tekra-saas/v1/signup/init', { method:'POST', body:fd });
        const json = await res.json();
        
        if(res.ok) {
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('step-2').classList.remove('hidden');
            document.querySelector('.otp-field').focus();
        } else {
            throw new Error(json.message);
        }
    } catch(e) {
        err.innerText = e.message;
        btn.disabled = false; btn.innerText = "Kirim Kode Verifikasi";
    }
});


// TAHAP 2: VERIFIKASI OTP LOGIC
const otpContainer = document.getElementById('otp-container');
const otpInputs = document.querySelectorAll('.otp-field');

// PERBAIKAN: Handle Paste Event (Untuk menempel kode 6 digit)
otpContainer.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData).getData('text');
    const pasteCode = pasteData.slice(0, otpInputs.length);

    // Distribusikan kode ke setiap input field
    otpInputs.forEach((input, index) => {
        if (index < pasteCode.length) {
            input.value = pasteCode[index];
        }
    });

    // Pindahkan fokus ke input terakhir
    if (pasteCode.length === otpInputs.length) {
        otpInputs[otpInputs.length - 1].focus();
    }
});


// HANDLE OTP INPUT (Auto Focus)
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

// STEP 2: SUBMIT VERIFIKASI
document.getElementById('form-step-2').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const err = document.getElementById('err-2');
    
    let otpCode = "";
    otpInputs.forEach(i => otpCode += i.value);

    if(otpCode.length < 6) {
        err.innerText = "Masukkan 6 digit kode."; return;
    }

    btn.disabled = true; btn.innerText = "Memeriksa..."; err.innerText = "";

    const fd = new FormData();
    fd.append('email', userEmail);
    fd.append('otp', otpCode);

    try {
        const res = await fetch('/wp-json/tekra-saas/v1/signup/verify', { method:'POST', body:fd });
        const json = await res.json();
        
        if(res.ok) {
            document.getElementById('step-2').classList.add('hidden');
            document.getElementById('step-3').classList.remove('hidden');
        } else {
            throw new Error(json.message);
        }
    } catch(e) {
        err.innerText = e.message;
        btn.disabled = false; btn.innerText = "Verifikasi";
    }
});

// STEP 3: BUSINESS INFO & FINALISASI
document.getElementById('form-step-3').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const err = document.getElementById('err-3');
    
    btn.disabled = true; btn.innerText = "Menyiapkan Toko..."; err.innerText = "";

    const fd = new FormData(this);
    fd.append('email', userEmail); // Kirim email lagi sebagai ID

    try {
        const res = await fetch('/wp-json/tekra-saas/v1/signup/complete', { method:'POST', body:fd });
        const json = await res.json();
        
        if(res.ok) {
            const redirectPath = `/${json.slug}/dashboard`; // <-- Redirect ke /dashboard
            
            btn.innerText = "✅ Berhasil! Mengalihkan...";
            setTimeout(() => {
                // Redirect ke Dashboard Tenant: dashboard.tekrabyte.id/slug/dashboard
                window.location.href = json.redirect_url.replace('/login', '../../'); // Fix path redirect
            }, 1500);
        } else {
            throw new Error(json.message);
        }
    } catch(e) {
        err.innerText = e.message;
        btn.disabled = false; btn.innerText = "Selesai & Masuk Dashboard";
    }
});
</script>