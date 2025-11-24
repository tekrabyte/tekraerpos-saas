import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Gratuity() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const defaultForm = { name: '', rate: 0, is_default: 0 };
    const [formData, setFormData] = useState(defaultForm);

    const loadData = async () => {
        setLoading(true);
        try {
            // PERBAIKAN: Endpoint /tenant/data/gratuity
            const res = await api.get('/tenant/data/gratuity');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/gratuity/${formData.id}`, formData);
            else await api.post('/tenant/data/gratuity', formData);
            
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus data ini?")) {
            await api.delete(`/tenant/data/gratuity/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama', accessor: (item) => item.name },
        { header: 'Rate (%)', accessor: (item) => item.rate + '%' },
        { header: 'Default', render: (item) => <span className={`px-2 py-1 rounded text-xs font-bold ${item.is_default == 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>{item.is_default == 1 ? 'Ya' : 'Tidak'}</span> }
    ];

    return (
        <div>
            <PageHeader title="Gratuity" subtitle="Kelola service charge / tips" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData(defaultForm); setShowModal(true); }} onEdit={(item) => { setFormData(item); setShowModal(true); }} onDelete={(item) => handleDelete(item.id)} />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Gratuity">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Service Charge" />
                    <FormField label="Rate (%)" name="rate" type="number" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} required />
                    <div className="mb-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.is_default == 1} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })} />
                            <span className="text-sm">Jadikan Default</span>
                        </label>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}