import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Bundles() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '0', items: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/library/bundles');
            setData(res.data.bundles || []);
        } catch (error) {
            console.error('Failed to load bundles:', error);
            setData([]);
        } finally { setLoading(false); }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editData) {
                await api.put(`/library/bundles/${editData.id}`, formData);
            } else {
                await api.post('/library/bundles', formData);
            }
            setShowModal(false);
            setFormData({ name: '', description: '', price: '0', items: '' });
            setEditData(null);
            loadData();
        } catch (error) {
            alert('Gagal menyimpan data: ' + error.message);
        }
    };

    const handleEdit = (item) => {
        setEditData(item);
        setFormData({ name: item.name, description: item.description || '', price: item.price, items: item.items || '' });
        setShowModal(true);
    };

    const handleDelete = async (item) => {
        if (confirm(`Hapus paket "${item.name}"?`)) {
            try {
                await api.delete(`/library/bundles/${item.id}`);
                loadData();
            } catch (error) {
                alert('Gagal menghapus: ' + error.message);
            }
        }
    };

    const columns = [
        { header: 'Nama Paket', accessor: (item) => item.name || '-' },
        { header: 'Deskripsi', accessor: (item) => item.description || '-' },
        { header: 'Harga Paket', accessor: (item) => `Rp ${parseInt(item.price || 0).toLocaleString()}` },
        { header: 'Jumlah Item', accessor: (item) => item.item_count || '0' }
    ];

    return (
        <div>
            <PageHeader title="Bundle Package" subtitle="Kelola paket bundling produk" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Cari paket..." />

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditData(null); }} title={editData ? 'Edit Paket' : 'Tambah Paket'}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Paket" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Contoh: Paket Hemat 1" />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi paket" />
                    <FormField label="Harga Paket" name="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required placeholder="0" />
                    <FormField label="Item dalam Paket" name="items" type="textarea" value={formData.items} onChange={(e) => setFormData({ ...formData, items: e.target.value })} placeholder="ID produk, pisahkan dengan koma" />
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}