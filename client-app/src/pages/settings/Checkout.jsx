import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import api from '../../api/client';

export default function Checkout() {
    const [settings, setSettings] = useState({
        enable_tax: false, tax_rate: 10, tax_name: 'PPN',
        enable_service: false, service_rate: 5, rounding: 'none'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/tenant/options/checkout_config').then(res => {
            if(res.data.data) setSettings(res.data.data);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/tenant/options/checkout_config', settings);
            alert("Pengaturan Checkout tersimpan.");
        } catch (e) { alert("Gagal menyimpan."); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div>
            <PageHeader title="Pengaturan Checkout" subtitle="Konfigurasi pajak, servis, dan pembulatan" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-lg text-gray-800">Pajak (Tax)</h3>
                        <input type="checkbox" name="enable_tax" checked={settings.enable_tax} onChange={handleChange} className="w-5 h-5" />
                    </div>
                    <div className={`space-y-4 ${!settings.enable_tax && 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nama Pajak</label>
                            <input type="text" name="tax_name" value={settings.tax_name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Persentase (%)</label>
                            <input type="number" name="tax_rate" value={settings.tax_rate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="font-bold text-lg text-gray-800">Service Charge</h3>
                        <input type="checkbox" name="enable_service" checked={settings.enable_service} onChange={handleChange} className="w-5 h-5" />
                    </div>
                    <div className={`space-y-4 ${!settings.enable_service && 'opacity-50 pointer-events-none'}`}>
                        <div>
                            <label className="block text-sm font-medium mb-1">Persentase (%)</label>
                            <input type="number" name="service_rate" value={settings.service_rate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">Pembulatan Total</h3>
                    <div className="flex gap-4">
                        {['none', 'down', 'up', 'nearest'].map(opt => (
                            <label key={opt} className={`flex-1 border p-3 rounded-lg cursor-pointer text-center ${settings.rounding === opt ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}>
                                <input type="radio" name="rounding" value={opt} checked={settings.rounding === opt} onChange={handleChange} className="hidden" />
                                <span className="capitalize">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
        </div>
    );
}