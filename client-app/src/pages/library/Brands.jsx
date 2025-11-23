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
    const [editData, setEditData] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', website: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/library/brands');
            setData(res.data.brands || []);
        } catch (error) { console.error('Failed to load brands:', error); setData([]); } finally { setLoading(false); }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editData) { await api.put(`/library/brands/${editData.id}`, formData); } else { await api.post('/library/brands', formData); }
            setShowModal(false); setFormData({ name: '', description: '', website: '' }); setEditData(null); loadData();
        } catch (error) { alert('Gagal menyimpan data: ' + error.message); }
    };

    const columns = [
        { header: 'Nama Brand', accessor: (item) => item.name || '-' },
        { header: 'Deskripsi', accessor: (item) => item.description || '-' },
        { header: 'Website', accessor: (item) => item.website || '-' }
    ];

    return (
        <div>
            <PageHeader title="Brands" subtitle="Kelola brand produk" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} onEdit={(item) => { setEditData(item); setFormData({ name: item.name, description: item.description || '', website: item.website || '' }); setShowModal(true); }} onDelete={async (item) => { if (confirm(`Hapus brand "${item.name}"?`)) { await api.delete(`/library/brands/${item.id}`); loadData(); } }} searchPlaceholder="Cari brand..." />

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditData(null); }} title={editData ? 'Edit Brand' : 'Tambah Brand'}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Brand" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Contoh: Samsung, Apple" />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi brand" />
                    <FormField label="Website" name="website" type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://example.com" />
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}