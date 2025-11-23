import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import api from '../../api/client';

export default function Inventory() {
    const [config, setConfig] = useState({
        low_stock_alert: 5,
        allow_negative: false,
        auto_po: false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/tenant/options/inventory_config').then(res => {
            if(res.data.data) setConfig(res.data.data);
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.post('/tenant/options/inventory_config', config);
            alert("Konfigurasi Inventaris tersimpan.");
        } catch (e) { alert("Gagal menyimpan."); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    return (
        <div>
            <PageHeader title="Pengaturan Inventaris" subtitle="Konfigurasi sistem stok" />

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">Peringatan Stok</h3>
                        <FormField label="Batas Minimum Stok (Global)" name="low_stock_alert" type="number" value={config.low_stock_alert} onChange={handleChange} />
                        <p className="text-xs text-gray-500 -mt-3">Notifikasi jika stok produk di bawah angka ini.</p>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-bold text-gray-800 mb-3">Kebijakan Stok</h3>
                        
                        <label className="flex items-start gap-3 mb-4 cursor-pointer">
                            <input type="checkbox" name="allow_negative" checked={config.allow_negative} onChange={handleChange} className="mt-1 w-4 h-4" />
                            <div>
                                <span className="block text-sm font-medium">Izinkan Stok Negatif</span>
                                <span className="text-xs text-gray-500">Kasir tetap bisa transaksi meskipun stok sistem habis.</span>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" name="auto_po" checked={config.auto_po} onChange={handleChange} className="mt-1 w-4 h-4" />
                            <div>
                                <span className="block text-sm font-medium">Saran PO Otomatis</span>
                                <span className="text-xs text-gray-500">Buat draft PO otomatis saat stok menipis.</span>
                            </div>
                        </label>
                    </div>

                    <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                    </button>
                </div>
            </div>
        </div>
    );
}