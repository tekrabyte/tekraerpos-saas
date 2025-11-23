import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import api from '../../api/client';

export default function PurchaseOrder() {
    const [data, setData] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        loadData(); 
        // Load Supplier List untuk dropdown
        api.get('/tenant/data/suppliers').then(res => {
            if(res.data.data) setSuppliers(res.data.data.map(s => ({ value: s.id, label: s.name })));
        });
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/purchase_orders');
            setData(res.data.data || []);
        } catch(e){} finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tenant/data/purchase_orders', { ...formData, status: 'pending' });
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal membuat PO"); }
    };

    const columns = [
        { header: 'ID', accessor: (i) => i.id },
        { header: 'Supplier ID', accessor: (i) => i.supplier_id },
        { header: 'Tanggal', accessor: (i) => i.date },
        { header: 'Status', render: (i) => (
            <span className={`px-2 py-1 rounded text-xs font-bold ${i.status === 'received' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {i.status}
            </span>
        )},
    ];

    return (
        <div>
            <PageHeader title="Purchase Order" subtitle="Kelola pesanan pembelian" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Buat PO Baru">
                <form onSubmit={handleSubmit}>
                    <FormField label="Supplier" name="supplier_id" type="select" options={suppliers} onChange={e => setFormData({...formData, supplier_id: e.target.value})} required />
                    <FormField label="Tanggal Pesan" name="date" type="date" onChange={e => setFormData({...formData, date: e.target.value})} required />
                    <FormField label="Catatan" name="notes" type="textarea" onChange={e => setFormData({...formData, notes: e.target.value})} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4">Buat Draft PO</button>
                </form>
            </Modal>
        </div>
    );
}