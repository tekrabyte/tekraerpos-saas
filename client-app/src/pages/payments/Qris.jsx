import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { QrCode, Upload } from 'lucide-react';

export default function Qris() {
    const [qrImage, setQrImage] = useState(null);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setQrImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <PageHeader title="QRIS Payment" subtitle="Upload QRIS Statis Toko Anda" />

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Upload QR Code</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Upload gambar QRIS yang Anda dapatkan dari penyedia pembayaran (GoPay, Dana, ShopeePay, atau Bank). Gambar ini akan muncul di layar kasir saat memilih metode pembayaran QRIS.
                    </p>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                        <input type="file" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                        <span className="text-blue-600 font-medium">Klik untuk upload gambar</span>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG (Max 2MB)</p>
                    </div>
                </div>

                {/* Preview */}
                <div className="w-full md:w-80">
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
                        <h4 className="font-bold text-gray-800 mb-4">Tampilan di Kasir</h4>
                        
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                            {qrImage ? (
                                <img src={qrImage} alt="QRIS Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <QrCode size={48} className="mb-2 opacity-50" />
                                    <span className="text-sm">Belum ada QR</span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Pastikan QR Code terlihat jelas dan dapat discan.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}