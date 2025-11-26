import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';

export default function Receipt() {
    const [config, setConfig] = useState({
        header_text: 'Selamat Datang di TekraCafe',
        footer_text: 'Terima kasih atas kunjungan Anda\nPassword Wifi: kopi123',
        show_logo: true,
        show_customer: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Pengaturan Struk" subtitle="Kustomisasi tampilan struk belanja" />
            
            <div className="flex-1 px-6 pb-10 overflow-y-auto">
                <div className="flex flex-col md:flex-row gap-8 max-w-5xl">
                    {/* Form */}
                    <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                        <h3 className="font-bold mb-4 border-b pb-2 text-gray-800">Konten Struk</h3>
                        <FormField label="Header Text" name="header_text" value={config.header_text} onChange={handleChange} />
                        <FormField label="Footer Text" name="footer_text" type="textarea" rows={3} value={config.footer_text} onChange={handleChange} />
                        <div className="mt-4 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="show_logo" checked={config.show_logo} onChange={handleChange} className="rounded text-blue-600"/> <span className="text-sm text-gray-700">Tampilkan Logo Toko</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="show_customer" checked={config.show_customer} onChange={handleChange} className="rounded text-blue-600"/> <span className="text-sm text-gray-700">Tampilkan Nama Pelanggan</span></label>
                        </div>
                        <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm w-full md:w-auto">Simpan Pengaturan</button>
                    </div>

                    {/* Preview */}
                    <div className="w-full md:w-80 bg-gray-200 p-4 rounded-lg border border-gray-300 flex flex-col items-center">
                        <h3 className="text-sm text-gray-500 mb-3 font-bold uppercase">Preview</h3>
                        <div className="bg-white p-4 shadow-md text-sm font-mono w-full relative" style={{ minHeight: '350px' }}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800"></div>
                            {config.show_logo && <div className="w-12 h-12 bg-gray-100 mx-auto mb-3 rounded-full flex items-center justify-center text-[8px] border border-dashed border-gray-400">LOGO</div>}
                            <div className="text-center font-bold mb-1">NAMA TOKO</div>
                            <div className="text-center text-xs mb-4 text-gray-500">{config.header_text}</div>
                            <div className="border-b border-dashed my-2 border-gray-300"></div>
                            <div className="flex justify-between mb-1"><span>Kopi Latte</span><span>25.000</span></div>
                            <div className="flex justify-between mb-1"><span>Roti Bakar</span><span>15.000</span></div>
                            <div className="border-b border-dashed my-2 border-gray-300"></div>
                            <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>40.000</span></div>
                            {config.show_customer && <div className="mt-2 text-xs text-gray-500">Pelanggan: Budi Santoso</div>}
                            <div className="mt-6 text-center text-xs text-gray-400 whitespace-pre-wrap">{config.footer_text}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}