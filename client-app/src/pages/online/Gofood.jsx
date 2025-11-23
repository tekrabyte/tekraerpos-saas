import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function Gofood() {
    const [isConnected, setIsConnected] = useState(false);

    return (
        <div>
            <PageHeader title="Integrasi Gofood" subtitle="Hubungkan toko Anda dengan Gofood" />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 text-center border-b border-gray-100">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {/* Icon Gofood placeholder */}
                        <span className="text-2xl font-bold text-green-600">Go</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Gofood Integration</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Sinkronisasi menu, harga, dan terima pesanan Gofood langsung di dashboard POS Anda tanpa tablet terpisah.
                    </p>
                    
                    {isConnected ? (
                        <div className="flex flex-col items-center gap-4">
                            <span className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full">
                                <CheckCircle size={20} /> Terhubung: Kopi Senja Pusat
                            </span>
                            <button onClick={() => setIsConnected(false)} className="text-red-500 hover:underline text-sm">Putuskan Sambungan</button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsConnected(true)}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-600/20"
                        >
                            Hubungkan Sekarang
                        </button>
                    )}
                </div>

                {isConnected && (
                    <div className="p-6 bg-gray-50">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <RefreshCw size={18} /> Pengaturan Sinkronisasi
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white p-3 rounded border">
                                <span>Sync Menu & Harga</span>
                                <input type="checkbox" defaultChecked className="toggle" />
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded border">
                                <span>Sync Stok Otomatis</span>
                                <input type="checkbox" defaultChecked className="toggle" />
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded border">
                                <span>Terima Pesanan Otomatis</span>
                                <input type="checkbox" className="toggle" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}