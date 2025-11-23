import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { ArrowRightLeft } from 'lucide-react';

export default function Transfer() {
    const [history] = useState([
        { id: 'TRF-001', date: '2023-11-10', from: 'Gudang Pusat', to: 'Outlet Sudirman', status: 'completed', items: 15 },
        { id: 'TRF-002', date: '2023-11-12', from: 'Outlet Sudirman', to: 'Outlet Tebet', status: 'pending', items: 5 },
    ]);
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { header: 'No. Transfer', accessor: (i) => i.id },
        { header: 'Tanggal', accessor: (i) => i.date },
        { header: 'Rute', render: (i) => (
            <div className="flex items-center gap-2 text-sm">
                <span>{i.from}</span>
                <ArrowRightLeft size={14} className="text-gray-400" />
                <span>{i.to}</span>
            </div>
        )},
        { header: 'Total Item', accessor: (i) => i.items },
        { header: 'Status', render: (i) => (
            <span className={`px-2 py-1 rounded text-xs font-bold ${i.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {i.status.toUpperCase()}
            </span>
        )},
    ];

    return (
        <div>
            <PageHeader title="Transfer Stock" subtitle="Pindahkan stok antar outlet atau gudang" />
            
            <DataTable 
                columns={columns} 
                data={history} 
                onAdd={() => setShowModal(true)} 
                searchPlaceholder="Cari ID transfer..."
            />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Transfer Stok Baru">
                <form>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Dari (Asal)" name="from_outlet" type="select" options={[{value:1, label:'Gudang Pusat'}, {value:2, label:'Outlet Sudirman'}]} required />
                        <FormField label="Ke (Tujuan)" name="to_outlet" type="select" options={[{value:2, label:'Outlet Sudirman'}, {value:3, label:'Outlet Tebet'}]} required />
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded border mb-4">
                        <h4 className="text-sm font-bold mb-2">Item yang dipindahkan</h4>
                        <div className="flex gap-2 mb-2">
                            <input placeholder="Cari Barang..." className="flex-1 border rounded px-2 py-1 text-sm" />
                            <input type="number" placeholder="Qty" className="w-20 border rounded px-2 py-1 text-sm" />
                            <button type="button" className="bg-gray-200 px-3 py-1 rounded text-sm">+</button>
                        </div>
                        <p className="text-xs text-gray-500 italic">Belum ada item dipilih.</p>
                    </div>

                    <FormField label="Catatan" name="notes" type="textarea" />

                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-2 font-bold">Proses Transfer</button>
                </form>
            </Modal>
        </div>
    );
}