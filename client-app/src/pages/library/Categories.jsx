import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Categories() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/categories');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/categories/${formData.id}`, formData);
            else await api.post('/tenant/data/categories', formData);
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus kategori?")) {
            await api.delete(`/tenant/data/categories/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama', accessor: (i) => i.name },
        { header: 'Deskripsi', accessor: (i) => i.description || '-' },
        { header: 'Urutan', accessor: (i) => i.sort_order || 0 },
    ];

    return (
        <div>
            <PageHeader title="Kategori Produk" subtitle="Kelola kategori produk" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData({}); setShowModal(true); }} onEdit={(i) => { setFormData(i); setShowModal(true); }} onDelete={(i) => handleDelete(i.id)} />
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Kategori">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Kategori" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <FormField label="Urutan" name="sort_order" type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: e.target.value})} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}