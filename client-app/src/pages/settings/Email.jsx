import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Mail } from 'lucide-react';

export default function Email() {
    const [emails, setEmails] = useState('owner@kopisenja.com');
    const [reports, setReports] = useState({
        daily_sales: true,
        monthly_sales: true,
        low_stock: false,
        shift_summary: false
    });

    const toggle = (key) => {
        setReports(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div>
            <PageHeader title="Notifikasi Email" subtitle="Atur pengiriman laporan otomatis ke email" />

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-2xl">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Email Penerima</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                value={emails} 
                                onChange={e => setEmails(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                            />
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Update</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma untuk lebih dari satu email.</p>
                </div>

                <h3 className="font-bold text-gray-800 mb-4 border-t pt-4">Jenis Laporan</h3>
                <div className="space-y-3">
                    {Object.keys(reports).map((key) => (
                        <label key={key} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                            <span className="capitalize text-gray-700">{key.replace('_', ' ')} Report</span>
                            <input type="checkbox" checked={reports[key]} onChange={() => toggle(key)} className="w-5 h-5 text-blue-600" />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}