import React from 'react';
import PageHeader from '../../components/PageHeader';
import { Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

export default function Summary() {
    const stats = [
        { title: 'Total Item', value: '1,240', icon: Package, color: 'bg-blue-500' },
        { title: 'Stok Menipis', value: '12', icon: AlertTriangle, color: 'bg-orange-500' },
        { title: 'Barang Masuk (Bulan Ini)', value: '450', icon: ArrowDown, color: 'bg-green-500' },
        { title: 'Barang Keluar (Bulan Ini)', value: '320', icon: ArrowUp, color: 'bg-red-500' },
    ];

    return (
        <div>
            <PageHeader title="Inventory Summary" subtitle="Ringkasan status persediaan" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                        <div className={`p-3 rounded-full text-white ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">Stok Hampir Habis</h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b"><th className="py-2">Nama Produk</th><th className="py-2">SKU</th><th className="py-2">Sisa Stok</th><th className="py-2">Status</th></tr>
                    </thead>
                    <tbody>
                        <tr className="border-b"><td className="py-3">Kopi Arabika 200g</td><td className="text-gray-500">BEAN-001</td><td className="font-bold text-red-600">2</td><td><span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Low</span></td></tr>
                        <tr className="border-b"><td className="py-3">Susu UHT 1L</td><td className="text-gray-500">MILK-FULL</td><td className="font-bold text-red-600">5</td><td><span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Low</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}