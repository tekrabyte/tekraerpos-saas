import React from 'react';
import PageHeader from '../../components/PageHeader';
import { Clock, Users, TrendingUp } from 'lucide-react';

export default function Report() {
    return (
        <div>
            <PageHeader title="Laporan Meja" subtitle="Statistik penggunaan meja dan okupansi" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded text-blue-600"><TrendingUp size={20} /></div>
                        <h3 className="text-sm text-gray-500">Okupansi Rata-rata</h3>
                    </div>
                    <p className="text-2xl font-bold">65%</p>
                    <p className="text-xs text-green-600 mt-1">↑ 5% dari minggu lalu</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-100 p-2 rounded text-orange-600"><Clock size={20} /></div>
                        <h3 className="text-sm text-gray-500">Durasi Makan (Avg)</h3>
                    </div>
                    <p className="text-2xl font-bold">45 Menit</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 p-2 rounded text-green-600"><Users size={20} /></div>
                        <h3 className="text-sm text-gray-500">Turnover Rate</h3>
                    </div>
                    <p className="text-2xl font-bold">3.2x</p>
                    <p className="text-xs text-gray-400 mt-1">Per meja / hari</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold mb-4">Meja Terpopuler</h3>
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3">Nama Meja</th>
                            <th className="p-3">Total Tamu</th>
                            <th className="p-3">Total Durasi</th>
                            <th className="p-3">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr><td className="p-3">Meja 01 (Window)</td><td className="p-3">45</td><td className="p-3">32 Jam</td><td className="p-3 font-bold">Rp 2.500.000</td></tr>
                        <tr><td className="p-3">Meja 05 (Sofa)</td><td className="p-3">38</td><td className="p-3">40 Jam</td><td className="p-3 font-bold">Rp 3.100.000</td></tr>
                        <tr><td className="p-3">Meja 02</td><td className="p-3">20</td><td className="p-3">15 Jam</td><td className="p-3 font-bold">Rp 1.200.000</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}