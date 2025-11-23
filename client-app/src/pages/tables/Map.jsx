import React from 'react';
import PageHeader from '../../components/PageHeader';

export default function Map() {
    // Mockup data meja
    const tables = [
        { id: 1, name: 'T1', status: 'available', x: 0, y: 0 },
        { id: 2, name: 'T2', status: 'occupied', x: 1, y: 0 },
        { id: 3, name: 'T3', status: 'available', x: 2, y: 0 },
        { id: 4, name: 'T4', status: 'available', x: 0, y: 1 },
        { id: 5, name: 'T5', status: 'reserved', x: 1, y: 1 },
        { id: 6, name: 'VIP', status: 'available', x: 2, y: 1, type: 'long' },
    ];

    const getStatusColor = (status) => {
        switch(status) {
            case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
            case 'reserved': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            default: return 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50';
        }
    };

    return (
        <div>
            <PageHeader title="Denah Meja" subtitle="Visualisasi status meja saat ini" />

            <div className="mb-6 flex gap-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white border border-gray-300 rounded"></div> Kosong</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div> Terisi</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div> Reservasi</div>
            </div>

            <div className="bg-gray-100 p-8 rounded-xl border border-gray-300 min-h-[400px] relative overflow-hidden">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {tables.map(table => (
                        <div 
                            key={table.id}
                            className={`
                                h-24 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm
                                ${getStatusColor(table.status)}
                                ${table.type === 'long' ? 'col-span-2' : ''}
                            `}
                            onClick={() => alert(`Meja ${table.name}: ${table.status}`)}
                        >
                            <span className="font-bold text-lg">{table.name}</span>
                            <span className="text-xs uppercase mt-1 font-medium opacity-70">{table.status}</span>
                        </div>
                    ))}
                </div>
                
                <div className="absolute bottom-4 right-4 text-gray-400 text-xs font-mono border p-2 rounded bg-white/50">
                    Lantai 1 - Indoor
                </div>
            </div>
        </div>
    );
}