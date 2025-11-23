import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Gift, Award } from 'lucide-react';

export default function Loyalty() {
    const [enabled, setEnabled] = useState(true);
    const [config, setConfig] = useState({
        earn_rate: 10000, // Belanja 10rb dapat 1 poin
        redeem_rate: 100,  // 1 Poin bernilai 100 rupiah
        min_redeem: 50     // Minimal tukar 50 poin
    });

    return (
        <div>
            <PageHeader title="Loyalty Program" subtitle="Atur sistem poin reward untuk pelanggan setia" />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Status Program Loyalty</h2>
                            <p className="text-purple-100 text-sm">Berikan poin setiap transaksi untuk meningkatkan retensi.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} className="sr-only peer" />
                        <div className="w-14 h-7 bg-purple-900/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-400"></div>
                    </label>
                </div>

                {enabled && (
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Rule 1: Earning */}
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="font-bold">1</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Perolehan Poin</h3>
                            <p className="text-sm text-gray-500 mb-3">Pelanggan mendapat 1 Poin setiap belanja kelipatan:</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-gray-600">Rp</span>
                                <input 
                                    type="number" 
                                    value={config.earn_rate} 
                                    onChange={e => setConfig({...config, earn_rate: e.target.value})}
                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-center font-bold" 
                                />
                            </div>
                        </div>

                        {/* Rule 2: Value */}
                        <div className="text-center border-l border-r border-gray-100">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="font-bold">2</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Nilai Tukar</h3>
                            <p className="text-sm text-gray-500 mb-3">1 Poin bernilai diskon sebesar:</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-bold text-gray-600">Rp</span>
                                <input 
                                    type="number" 
                                    value={config.redeem_rate} 
                                    onChange={e => setConfig({...config, redeem_rate: e.target.value})}
                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-center font-bold" 
                                />
                            </div>
                        </div>

                        {/* Rule 3: Minimum */}
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="font-bold">3</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Syarat Tukar</h3>
                            <p className="text-sm text-gray-500 mb-3">Minimal poin untuk bisa ditukar:</p>
                            <div className="flex items-center justify-center gap-2">
                                <input 
                                    type="number" 
                                    value={config.min_redeem} 
                                    onChange={e => setConfig({...config, min_redeem: e.target.value})}
                                    className="w-20 border border-gray-300 rounded px-2 py-1 text-center font-bold" 
                                />
                                <span className="font-bold text-gray-600">Poin</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {enabled && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Simpan Pengaturan</button>
                    </div>
                )}
            </div>
        </div>
    );
}