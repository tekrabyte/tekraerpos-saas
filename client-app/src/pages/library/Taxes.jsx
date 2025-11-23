import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Taxes() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ is_active: 1 });

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/taxes');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/taxes/${formData.id}`, formData);
            else await api.post('/tenant/data/taxes', formData);
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const columns = [
        { header: 'Nama Pajak', accessor: (i) => i.name },
        { header: 'Tarif (%)', accessor: (i) => i.rate + '%' },
        { header: 'Status', render: (i) => <span className={`px-2 py-1 rounded text-xs font-bold ${i.is_active == 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{i.is_active == 1 ? 'Aktif' : 'Nonaktif'}</span> },
    ];

    return (
        <div>
            <PageHeader title="Pajak (Taxes)" subtitle="Kelola pajak penjualan" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData({is_active: 1}); setShowModal(true); }} onEdit={(i) => { setFormData(i); setShowModal(true); }} onDelete={async (i) => { if(confirm("Hapus?")) { await api.delete(`/tenant/data/taxes/${i.id}`); loadData(); } }} />
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Pajak">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Pajak" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="PB1 / PPN" />
                    <FormField label="Tarif (%)" name="rate" type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} required />
                    <div className="mb-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.is_active == 1} onChange={e => setFormData({...formData, is_active: e.target.checked ? 1 : 0})} />
                            <span className="text-sm">Aktifkan Pajak Ini</span>
                        </label>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}