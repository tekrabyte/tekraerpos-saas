import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Save, Loader } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const Toggle = ({ label, checked, onChange, description }) => (
    <div className="flex justify-between items-start py-4 border-b border-gray-100 last:border-0">
        <div className="flex-1 pr-4">
            <h4 className="font-bold text-gray-800 text-sm">{label}</h4>
            {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
        </label>
    </div>
);

export default function CheckoutSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enable_tax: false, enable_gratuity: false, include_tax_gratuity: false, tax_discount_preference: 'before',
        enable_rounding: false, auto_start_shift: false, default_starting_cash: 0,
        enable_stock_limit: false, allow_override_stock: false,
        track_server: false, split_payment: false, save_print_bill: false
    });

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            const res = await api.get('/tenant/options/checkout_config');
            if (res.data.success && res.data.data) setSettings(prev => ({ ...prev, ...res.data.data }));
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/tenant/options/checkout_config', settings);
            alert("Pengaturan berhasil disimpan!");
        } catch (e) { alert("Gagal menyimpan pengaturan."); } 
        finally { setSaving(false); }
    };

    const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

    if (loading) return <div className="p-10 text-center"><Loader className="animate-spin inline mr-2 text-blue-600" /> Memuat...</div>;

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Pengaturan Checkout" subtitle="Konfigurasi alur pembayaran kasir">
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-70 shadow-sm transition-colors text-sm">
                    {saving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>} Simpan Perubahan
                </button>
            </PageHeader>

            <div className="flex-1 overflow-y-auto px-6 pb-20 max-w-4xl space-y-6">
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200"><h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Tax & Gratuity</h3></div>
                    <div className="p-6">
                        <Toggle label="Enable Tax" checked={settings.enable_tax} onChange={v => updateSetting('enable_tax', v)} />
                        <Toggle label="Enable Gratuity" checked={settings.enable_gratuity} onChange={v => updateSetting('enable_gratuity', v)} />
                        <Toggle label="Add Tax & Gratuity to Item Price" description="Harga produk sudah termasuk pajak (Inclusive)" checked={settings.include_tax_gratuity} onChange={v => updateSetting('include_tax_gratuity', v)} />
                        <div className="py-4">
                            <label className="block font-bold text-gray-800 text-sm mb-1">Tax Calculation</label>
                            <select className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={settings.tax_discount_preference} onChange={e => updateSetting('tax_discount_preference', e.target.value)}>
                                <option value="before">Calculate Before Discount</option>
                                <option value="after">Calculate After Discount</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200"><h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Shift Settings</h3></div>
                    <div className="p-6">
                        <Toggle label="Auto Start Shift" description="Shift otomatis mulai saat login pertama." checked={settings.auto_start_shift} onChange={v => updateSetting('auto_start_shift', v)} />
                        <div className="py-4">
                            <label className="block font-bold text-gray-800 text-sm mb-1">Default Cash</label>
                            <input type="number" className="w-full md:w-1/2 border rounded-lg px-3 py-2 text-sm" value={settings.default_starting_cash} onChange={e => updateSetting('default_starting_cash', e.target.value)} />
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200"><h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Stock Limit</h3></div>
                    <div className="p-6">
                        <Toggle label="Enable Stock Limit" description="Cegah penjualan jika stok habis." checked={settings.enable_stock_limit} onChange={v => updateSetting('enable_stock_limit', v)} />
                        {settings.enable_stock_limit && (
                            <div className="ml-6 pl-6 border-l-2 border-gray-100">
                                <Toggle label="Allow Override" description="Boleh jual minus (dengan peringatan)." checked={settings.allow_override_stock} onChange={v => updateSetting('allow_override_stock', v)} />
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200"><h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Other</h3></div>
                    <div className="p-6">
                        <Toggle label="Track Waiter/Server" checked={settings.track_server} onChange={v => updateSetting('track_server', v)} />
                        <Toggle label="Split Payment" checked={settings.split_payment} onChange={v => updateSetting('split_payment', v)} />
                        <Toggle label="Save & Print Bill" checked={settings.save_print_bill} onChange={v => updateSetting('save_print_bill', v)} />
                    </div>
                </section>
            </div>
        </div>
    );
}