import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';

export default function Settings() {
    const [config, setConfig] = useState({
        welcome_text: 'Selamat Datang di Kopi Senja',
        running_text: 'Promo Spesial: Beli 1 Gratis 1 Kopi Susu Gula Aren setiap Senin!',
        theme_color: 'dark', // light, dark
        show_qr: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div>
            <PageHeader title="Pengaturan CDS" subtitle="Konfigurasi layar kedua (Customer Display)" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4">Tampilan Umum</h3>
                    <FormField label="Teks Sambutan" name="welcome_text" value={config.welcome_text} onChange={handleChange} />
                    <FormField label="Running Text (Info Berjalan)" name="running_text" type="textarea" value={config.running_text} onChange={handleChange} />
                    
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tema Warna</label>
                        <div className="flex gap-4">
                            <label className={`border p-3 rounded cursor-pointer ${config.theme_color === 'light' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                                <input type="radio" name="theme_color" value="light" checked={config.theme_color === 'light'} onChange={handleChange} className="hidden" />
                                <div className="w-20 h-10 bg-white border rounded mb-1"></div>
                                <span className="text-xs text-center block">Light Mode</span>
                            </label>
                            <label className={`border p-3 rounded cursor-pointer ${config.theme_color === 'dark' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                                <input type="radio" name="theme_color" value="dark" checked={config.theme_color === 'dark'} onChange={handleChange} className="hidden" />
                                <div className="w-20 h-10 bg-slate-800 border rounded mb-1"></div>
                                <span className="text-xs text-center block">Dark Mode</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="show_qr" checked={config.show_qr} onChange={handleChange} className="w-4 h-4" />
                            <span className="text-sm text-gray-700">Tampilkan QR Member saat Idle</span>
                        </label>
                    </div>

                    <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full">Simpan</button>
                </div>

                {/* Preview */}
                <div className="border-4 border-gray-800 rounded-xl overflow-hidden bg-gray-900 h-64 flex items-center justify-center relative shadow-xl">
                    <div className="text-center text-white">
                        <h2 className="text-2xl font-bold mb-2">{config.welcome_text}</h2>
                        <p className="text-sm opacity-70">Silakan pesan di kasir</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                        <p className="text-white text-xs whitespace-nowrap overflow-hidden">{config.running_text}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}