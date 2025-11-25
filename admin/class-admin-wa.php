<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_WA {

    public static function render() {
        // GANTI DENGAN URL RAILWAY ANDA (Tanpa slash di akhir)
        $api_url = 'https://dabewa-production.up.railway.app'; 
        
        ?>
        <div class="wrap">
            <h1 style="margin-bottom: 20px;">WhatsApp Gateway Connection</h1>

            <div class="card" style="max-width: 600px; padding: 30px; text-align: center; margin-top: 20px;">
                
                <!-- Status Indicator -->
                <div id="wa-status-indicator" style="margin-bottom: 25px; font-size: 16px;">
                    Status: <span id="status-text" style="font-weight: bold; color: #f59e0b;">Connecting to Bot...</span>
                </div>

                <!-- Debug Info (Hidden by default, show if error) -->
                <div id="wa-debug" style="display:none; margin-bottom: 15px; padding: 10px; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; font-size: 12px; text-align: left;"></div>

                <!-- QR Code Area -->
                <div id="wa-qr-area" style="display: none;">
                    <h3 style="margin-top: 0;">Scan QR Code</h3>
                    <p class="description" style="margin-bottom: 15px;">
                        Buka WhatsApp di HP > Menu > Perangkat Tertaut > Tautkan Perangkat
                    </p>
                    <div style="background: #fff; padding: 15px; display: inline-block; border: 1px solid #ddd; border-radius: 8px;">
                        <div id="qrcode-canvas"></div>
                    </div>
                    <p style="margin-top: 10px; color: #666; font-size: 12px;">QR Code akan refresh otomatis.</p>
                </div>

                <!-- Connected Area -->
                <div id="wa-connected-area" style="display: none;">
                    <div style="color: #10b981; margin-bottom: 15px;">
                        <span class="dashicons dashicons-yes-alt" style="font-size: 80px; width: 80px; height: 80px;"></span>
                    </div>
                    <h2 style="margin: 0; color: #10b981;">Device Connected!</h2>
                    <p style="font-size: 14px; color: #374151; margin-top: 10px;">
                        Bot WhatsApp siap digunakan untuk mengirim OTP & Notifikasi.
                    </p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        <button id="btn-wa-logout" class="button button-link delete" style="color: #ef4444;">
                            Putuskan Koneksi (Logout)
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- QRCode.js Library -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

        <script>
        jQuery(document).ready(function($) {
            const API_BASE = '<?php echo $api_url; ?>';
            
            function checkBotStatus() {
                $.ajax({
                    url: API_BASE + '/status',
                    method: 'GET',
                    timeout: 10000, // 10 detik timeout
                    success: function(res) {
                        handleResponse(res);
                    },
                    error: function(xhr, status, error) {
                        console.log('Poll error:', error);
                        $('#status-text').text('Connection Error').css('color', 'red');
                        $('#wa-debug').show().text('Error: Tidak bisa terhubung ke ' + API_BASE + '. Pastikan URL benar dan Server Railway aktif. (' + error + ')');
                        $('#wa-qr-area').hide();
                    }
                });
            }

            function handleResponse(res) {
                const status = res.status; // CONNECTED, QR_READY, DISCONNECTED
                const qrCode = res.qr;

                $('#wa-debug').hide();

                // Update Text Status
                let color = '#f59e0b'; // orange
                if (status === 'CONNECTED') color = '#10b981'; // green
                if (status === 'DISCONNECTED') color = '#ef4444'; // red
                
                $('#status-text').text(status).css('color', color);

                // Logic Display
                if (status === 'CONNECTED' || status === 'AUTHENTICATED') {
                    $('#wa-qr-area').hide();
                    $('#wa-connected-area').show();
                } 
                else if ((status === 'QR_READY' || status === 'DISCONNECTED') && qrCode) {
                    $('#wa-connected-area').hide();
                    $('#wa-qr-area').show();
                    
                    // Render QR
                    const qrContainer = document.getElementById("qrcode-canvas");
                    if (qrContainer) {
                        qrContainer.innerHTML = ""; // Clear previous
                        new QRCode(qrContainer, {
                            text: qrCode,
                            width: 260,
                            height: 260,
                            colorDark : "#000000",
                            colorLight : "#ffffff",
                            correctLevel : QRCode.CorrectLevel.L
                        });
                    }
                } else {
                    // Loading state (Initializing)
                    $('#wa-connected-area').hide();
                    $('#wa-qr-area').hide();
                    $('#status-text').text('Initializing Client... (Tunggu sebentar)');
                }
            }

            // Poll every 3 seconds
            setInterval(checkBotStatus, 3000);
            checkBotStatus(); // First run

            // Logout Handler
            $('#btn-wa-logout').click(function(e) {
                e.preventDefault();
                if (!confirm("Yakin ingin logout? Bot akan berhenti bekerja sampai di-scan ulang.")) return;
                
                $(this).text('Logging out...').attr('disabled', true);
                
                $.post(API_BASE + '/logout', function(res) {
                    alert('Logout berhasil. Halaman akan direfresh.');
                    location.reload();
                }).fail(function() {
                    alert('Gagal menghubungi server untuk logout.');
                });
            });
        });
        </script>
        <?php
    }
}