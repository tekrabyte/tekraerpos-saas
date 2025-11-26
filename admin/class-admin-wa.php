<?php
if (!defined('ABSPATH')) exit;

class TEKRAERPOS_Admin_WA {

    public static function render() {
        // Pastikan URL ini sesuai dengan Railway Anda
        $api_url = 'https://dabewa-production.up.railway.app'; 
        
        ?>
        <div class="wrap">
            <h1 style="margin-bottom: 20px;">WhatsApp Gateway Connection</h1>

            <div class="card" style="max-width: 800px; padding: 30px; text-align: center; margin-top: 20px;">
                
                <div id="wa-status-indicator" style="margin-bottom: 25px; font-size: 16px;">
                    Status: <span id="status-text" style="font-weight: bold; color: #f59e0b;">Connecting...</span>
                </div>

                <div id="wa-debug" style="display:none; margin-bottom: 15px; padding: 10px; background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; font-size: 12px; text-align: left;"></div>

                <div id="wa-qr-area" style="display: none;">
                    <h3 style="margin-top: 0;">Scan QR Code</h3>
                    <p class="description" style="margin-bottom: 15px;">
                        Buka WhatsApp > Menu > Perangkat Tertaut > Tautkan Perangkat
                    </p>
                    <div style="background: #fff; padding: 15px; display: inline-block; border: 1px solid #ddd; border-radius: 8px;">
                        <div id="qrcode-canvas"></div>
                    </div>
                </div>

                <div id="wa-connected-area" style="display: none;">
                    <div style="color: #10b981; margin-bottom: 15px;">
                        <span class="dashicons dashicons-yes-alt" style="font-size: 80px; width: 80px; height: 80px;"></span>
                    </div>
                    <h2 style="margin: 0; color: #10b981;">Device Connected!</h2>
                    <p style="font-size: 14px; color: #374151;">Bot WhatsApp siap digunakan.</p>
                    
                    <div style="margin-top: 20px;">
                        <button id="btn-wa-logout" class="button button-link delete" style="color: #ef4444;">Logout Device</button>
                    </div>
                </div>

            </div>

            <div class="card" style="max-width: 800px; padding: 0; margin-top: 20px; overflow: hidden;">
                <div style="padding: 15px 20px; background: #f9fafb; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: 600;">History Logs (Terakhir 50 Aktivitas)</h3>
                    <button id="btn-refresh-logs" class="button button-small">Refresh Logs</button>
                </div>
                <div style="max-height: 300px; overflow-y: auto;">
                    <table class="wp-list-table widefat fixed striped" style="border: none;">
                        <thead>
                            <tr>
                                <th style="width: 160px;">Waktu</th>
                                <th style="width: 100px;">Tipe</th>
                                <th>Pesan</th>
                            </tr>
                        </thead>
                        <tbody id="wa-logs-body">
                            <tr><td colspan="3" style="text-align:center; color:#666;">Memuat logs...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

        <script>
        jQuery(document).ready(function($) {
            const API_BASE = '<?php echo $api_url; ?>';
            
            // Fungsi Utama: Cek Status
            function checkBotStatus() {
                $.ajax({
                    url: API_BASE + '/status',
                    method: 'GET',
                    timeout: 10000,
                    success: function(res) {
                        updateUI(res);
                    },
                    error: function(xhr, status, error) {
                        $('#status-text').text('Connection Error').css('color', 'red');
                        $('#wa-debug').show().text('Error koneksi ke Bot: ' + error);
                    }
                });
            }

            function updateUI(res) {
                const status = res.status;
                const qrCode = res.qr;
                $('#wa-debug').hide();

                let color = '#f59e0b';
                if (status === 'CONNECTED') color = '#10b981';
                if (status === 'DISCONNECTED') color = '#ef4444';
                
                $('#status-text').text(status).css('color', color);

                if (status === 'CONNECTED') {
                    $('#wa-qr-area').hide();
                    $('#wa-connected-area').show();
                } 
                else if (status === 'READY' && qrCode) {
                    $('#wa-connected-area').hide();
                    $('#wa-qr-area').show();
                    const qrContainer = document.getElementById("qrcode-canvas");
                    if (qrContainer) {
                        qrContainer.innerHTML = "";
                        new QRCode(qrContainer, { text: qrCode, width: 200, height: 200 });
                    }
                } else {
                    $('#wa-connected-area').hide();
                    $('#wa-qr-area').hide();
                }
            }

            // Fungsi Baru: Ambil Logs
            function fetchLogs() {
                $.get(API_BASE + '/logs', function(res) {
                    const tbody = $('#wa-logs-body');
                    tbody.empty();

                    if (res.data && res.data.length > 0) {
                        res.data.forEach(log => {
                            let badgeColor = '#999';
                            if (log.type === 'ERROR') badgeColor = '#dc2626';
                            else if (log.type === 'OTP') badgeColor = '#2563eb';
                            else if (log.type === 'SYSTEM') badgeColor = '#059669';

                            const row = `
                                <tr>
                                    <td style="color:#555;">${log.time}</td>
                                    <td><span style="background:${badgeColor}; color:#fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">${log.type}</span></td>
                                    <td style="color:#333;">${log.message}</td>
                                </tr>
                            `;
                            tbody.append(row);
                        });
                    } else {
                        tbody.append('<tr><td colspan="3" style="text-align:center;">Belum ada log aktivitas.</td></tr>');
                    }
                }).fail(function() {
                    $('#wa-logs-body').html('<tr><td colspan="3" style="text-align:center; color:red;">Gagal mengambil logs.</td></tr>');
                });
            }

            // Polling & Event Listeners
            setInterval(checkBotStatus, 5000); // Cek status tiap 5 detik
            checkBotStatus();
            fetchLogs(); // Ambil log saat pertama load

            $('#btn-refresh-logs').click(function(e) {
                e.preventDefault();
                $(this).text('Loading...');
                fetchLogs();
                setTimeout(() => $(this).text('Refresh Logs'), 1000);
            });

            $('#btn-wa-logout').click(function(e) {
                if (!confirm("Logout dari WhatsApp?")) return;
                $(this).text('Processing...').attr('disabled', true);
                $.post(API_BASE + '/logout', function(res) {
                    alert('Logout berhasil. Halaman akan refresh.');
                    location.reload();
                });
            });
        });
        </script>
        <?php
    }
}