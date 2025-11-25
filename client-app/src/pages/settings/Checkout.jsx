import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Save, Loader } from 'lucide-react';

// Komponen Switch Toggle Sederhana
const Toggle = ({ label, checked, onChange, description }) => (
    <div className="flex justify-between items-start py-4 border-b border-gray-100 last:border-0">
        <div className="flex-1 pr-4">
            <h4 className="font-bold text-gray-800 text-sm">{label}</h4>
            {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={checked} 
                onChange={e => onChange(e.target.checked)} 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
            <span className="ml-2 text-xs font-bold text-gray-500 w-6">{checked ? 'ON' : 'OFF'}</span>
        </label>
    </div>
);

export default function CheckoutSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // State Default
    const [settings, setSettings] = useState({
        // Tax & Gratuity
        enable_tax: false,
        enable_gratuity: false,
        include_tax_gratuity: false, // Include to item price
        tax_discount_preference: 'before', // before/after
        
        // Rounding
        enable_rounding: false,
        
        // Shift
        auto_start_shift: false,
        default_starting_cash: 0,
        
        // Stock Limit
        enable_stock_limit: false,
        allow_override_stock: false,
        
        // Other
        track_server: false,
        split_payment: false,
        save_print_bill: false
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await api.get('/tenant/options/checkout_config');
            if (res.data.success && res.data.data) {
                // Merge data dari server dengan default state
                setSettings(prev => ({ ...prev, ...res.data.data }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/tenant/options/checkout_config', settings);
            alert("Pengaturan berhasil disimpan!");
        } catch (e) {
            alert("Gagal menyimpan pengaturan.");
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-8 text-center"><Loader className="animate-spin inline mr-2 text-blue-600" /> Memuat pengaturan...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto pb-20">
            {/* Header Page */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pengaturan Checkout</h1>
                    <p className="text-sm text-gray-500 mt-1">Konfigurasi alur pembayaran dan kasir.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-70 shadow-sm transition-colors"
                >
                    {saving ? <Loader size={18} className="animate-spin"/> : <Save size={18}/>}
                    Simpan Perubahan
                </button>
            </div>

            <div className="space-y-6">
                
                {/* 1. Tax and Gratuity Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Tax and Gratuity Settings</h3>
                    </div>
                    <div className="p-6">
                        <Toggle 
                            label="Enable Tax" 
                            checked={settings.enable_tax} 
                            onChange={v => updateSetting('enable_tax', v)} 
                        />
                        
                        <Toggle 
                            label="Enable Gratuity" 
                            checked={settings.enable_gratuity} 
                            onChange={v => updateSetting('enable_gratuity', v)} 
                        />
                        
                        <Toggle 
                            label="Add Tax and Gratuity to Item Price" 
                            description="Include Tax and Gratuity to Item Price (Harga produk sudah termasuk pajak/servis)"
                            checked={settings.include_tax_gratuity} 
                            onChange={v => updateSetting('include_tax_gratuity', v)} 
                        />

                        <div className="py-4 border-b border-gray-100 last:border-0">
                            <label className="block font-bold text-gray-800 text-sm mb-1">Outlet's Tax-Discount Preference</label>
                            <p className="text-xs text-gray-500 mb-2">Settings for applying tax before/after discount. Gratuity will follow tax setting.</p>
                            <select 
                                className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={settings.tax_discount_preference}
                                onChange={e => updateSetting('tax_discount_preference', e.target.value)}
                            >
                                <option value="before">Calculate Tax Before Discount</option>
                                <option value="after">Calculate Tax After Discount</option>
                            </select>
                            <p className="text-[10px] text-orange-500 mt-2 italic flex items-center gap-1">
                                * This feature currently only works on iOS (v26.5 the least), coming soon on Android
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2. Rounding Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Rounding Settings</h3>
                    </div>
                    <div className="p-6">
                        <Toggle 
                            label="Enable Rounding" 
                            description="Otomatis bulatkan total transaksi (misal ke ratusan terdekat)."
                            checked={settings.enable_rounding} 
                            onChange={v => updateSetting('enable_rounding', v)} 
                        />
                    </div>
                </section>

                {/* 3. Shift Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Shift Settings</h3>
                    </div>
                    <div className="p-6">
                        <Toggle 
                            label="Start Shift Automatically" 
                            description="Shift kasir otomatis dimulai saat login pertama hari itu."
                            checked={settings.auto_start_shift} 
                            onChange={v => updateSetting('auto_start_shift', v)} 
                        />

                        <div className="py-4">
                            <label className="block font-bold text-gray-800 text-sm mb-1">Default starting cash</label>
                            <div className="relative w-full md:w-1/2">
                                <span className="absolute left-3 top-2 text-gray-500 text-sm">Rp</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={settings.default_starting_cash}
                                    onChange={e => updateSetting('default_starting_cash', e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 bg-blue-50 p-2 rounded text-blue-800">
                                Shift enables you to track the cash, card and other payment flow that goes in and out of your drawer.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. Stock Limit */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Stock Limit</h3>
                    </div>
                    <div className="p-6">
                        <Toggle 
                            label="Enable stock limit" 
                            description="When turned on, cashiers are not able to sell items with stock under or equal to 0."
                            checked={settings.enable_stock_limit} 
                            onChange={v => updateSetting('enable_stock_limit', v)} 
                        />
                        
                        {/* Sub-setting: Muncul hanya jika Stock Limit ON */}
                        {settings.enable_stock_limit && (
                            <div className="ml-6 pl-6 border-l-2 border-gray-100 mt-2">
                                <Toggle 
                                    label="Allow Override" 
                                    description="When turned on, cashiers will be able to sell items with stock under or equal to 0. This feature will act as warning only."
                                    checked={settings.allow_override_stock} 
                                    onChange={v => updateSetting('allow_override_stock', v)} 
                                />
                            </div>
                        )}
                    </div>
                </section>

                {/* 5. Other Settings */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Other Settings</h3>
                    </div>
                    <div className="p-6">
                        <Toggle 
                            label="Track Server (Waiter)" 
                            description="Catat nama pelayan yang melayani pesanan."
                            checked={settings.track_server} 
                            onChange={v => updateSetting('track_server', v)} 
                        />
                        
                        <Toggle 
                            label="Split Payment" 
                            description="Izinkan pembayaran dibagi ke beberapa metode (misal: sebagian Tunai, sebagian Kartu)."
                            checked={settings.split_payment} 
                            onChange={v => updateSetting('split_payment', v)} 
                        />
                        
                        <Toggle 
                            label="Save Bill and Print Bill" 
                            description="Enable this feature to allow cashiers to save and print bills (Hold Bill). If disabled, incomplete bills cannot be saved."
                            checked={settings.save_print_bill} 
                            onChange={v => updateSetting('save_print_bill', v)} 
                        />
                    </div>
                </section>

            </div>
        </div>
    );
}