import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import api from '../../api/client';

export default function Config() {
    const [methods, setMethods] = useState([
        { id: 'cash', name: 'Tunai (Cash)', icon: 'Banknote', active: true },
        { id: 'card', name: 'Kartu Debit/Kredit', icon: 'CreditCard', active: false },
        { id: 'qris', name: 'QRIS Statis', icon: 'Smartphone', active: false },
        { id: 'transfer', name: 'Transfer Bank', icon: 'Banknote', active: false },
    ]);

    useEffect(() => {
        api.get('/tenant/options/payment_methods').then(res => {
            if(res.data.data && res.data.data.length > 0) setMethods(res.data.data);
        });
    }, []);

    const toggle = (id) => {
        const updated = methods.map(m => m.id === id ? { ...m, active: !m.active } : m);
        setMethods(updated);
        api.post('/tenant/options/payment_methods', updated).catch(e => console.error("Auto-save failed"));
    };

    const getIcon = (name) => {
        if(name === 'CreditCard') return <CreditCard size={24} />;
        if(name === 'Smartphone') return <Smartphone size={24} />;
        return <Banknote size={24} />;
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Metode Pembayaran" subtitle="Atur metode pembayaran aktif di kasir" />
            
            <div className="px-6 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    {methods.map((method) => (
                        <div key={method.id} className={`p-5 rounded-xl shadow-sm border flex justify-between items-center transition-all ${method.active ? 'bg-white border-blue-200 ring-1 ring-blue-100' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${method.active ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {getIcon(method.icon)}
                                </div>
                                <h4 className="font-bold text-gray-800">{method.name}</h4>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={method.active} onChange={() => toggle(method.id)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}