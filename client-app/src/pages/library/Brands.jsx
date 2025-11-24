import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Brands() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const defaultForm = { name: '', description: '', website: '' };
    const [formData, setFormData] = useState(defaultForm);

    const loadData = async () => {
        setLoading(true);
        try {
            // PERBAIKAN: Endpoint /tenant/data/brands
            const res = await api.get('/tenant/data/brands');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/brands/${formData.id}`, formData);
            else await api.post('/tenant/data/brands', formData);
            
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus brand ini?")) {
            await api.delete(`/tenant/data/brands/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama Brand', accessor: (item) => item.name || '-' },
        { header: 'Deskripsi', accessor: (item) => item.description || '-' },
        { header: 'Website', accessor: (item) => item.website || '-' }
    ];

    return (
        <div>
            <PageHeader title="Brands" subtitle="Kelola merk produk" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData(defaultForm); setShowModal(true); }} onEdit={(item) => { setFormData(item); setShowModal(true); }} onDelete={(item) => handleDelete(item.id)} />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Brand">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Brand" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <FormField label="Website" name="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}