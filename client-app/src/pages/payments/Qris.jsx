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
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="QRIS Payment" subtitle="Upload QRIS Statis Toko Anda" />

            <div className="px-6 pb-10">
                <div className="flex flex-col md:flex-row gap-8 items-start max-w-5xl">
                    <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full">
                        <h3 className="font-bold text-lg mb-4 text-gray-800">Upload QR Code</h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Upload gambar QRIS yang Anda dapatkan dari penyedia pembayaran (GoPay, Dana, dll). Gambar ini akan muncul di layar kasir saat memilih metode pembayaran QRIS.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer relative group">
                            <input type="file" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors">
                                <Upload size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <span className="text-blue-600 font-bold block mb-1">Klik untuk upload gambar</span>
                            <p className="text-xs text-gray-400">JPG, PNG (Max 2MB)</p>
                        </div>
                    </div>

                    <div className="w-full md:w-80">
                        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 text-center">
                            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Preview di Kasir</h4>
                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 relative">
                                {qrImage ? <img src={qrImage} alt="QRIS Preview" className="w-full h-full object-contain" /> : 
                                <div className="text-gray-400 flex flex-col items-center"><QrCode size={48} className="mb-2 opacity-50" /><span className="text-xs">Belum ada QR</span></div>}
                            </div>
                            <p className="text-xs text-gray-500 mt-4 italic">Pastikan QR Code terlihat jelas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}