import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Globe, Copy, ExternalLink } from 'lucide-react';

export default function TekraPos() {
    const [active, setActive] = useState(true);
    const storeUrl = "https://order.tekrapos.com/kopisenja";

    return (
        <div>
            <PageHeader title="TekraPOS Online" subtitle="Halaman pemesanan online untuk pelanggan" />

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Status Toko Online</h3>
                        <p className="text-sm text-gray-500">Izinkan pelanggan memesan lewat QR Code atau Link</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={active} onChange={() => setActive(!active)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                {active && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <label className="text-xs font-bold text-blue-800 uppercase">Link Toko Anda</label>
                        <div className="flex gap-2 mt-1">
                            <input readOnly value={storeUrl} className="flex-1 bg-white border border-blue-200 px-3 py-2 rounded text-sm text-gray-600" />
                            <button className="p-2 bg-white border border-blue-200 rounded hover:bg-blue-100" title="Copy"><Copy size={18} className="text-blue-600"/></button>
                            <a href="#" className="p-2 bg-blue-600 border border-blue-600 rounded text-white hover:bg-blue-700" title="Open"><ExternalLink size={18} /></a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}