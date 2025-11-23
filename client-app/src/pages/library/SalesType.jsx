import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function SalesType() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/library/sales-type');
            setData(res.data.sales_types || []);
        } catch (error) { console.error('Failed to load sales types:', error); setData([]); } finally { setLoading(false); }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editData) { await api.put(`/library/sales-type/${editData.id}`, formData); } else { await api.post('/library/sales-type', formData); }
            setShowModal(false); setFormData({ name: '', description: '' }); setEditData(null); loadData();
        } catch (error) { alert('Gagal menyimpan data: ' + error.message); }
    };

    const columns = [
        { header: 'Nama Tipe Penjualan', accessor: (item) => item.name || '-' },
        { header: 'Deskripsi', accessor: (item) => item.description || '-' }
    ];

    return (
        <div>
            <PageHeader title="Sales Type" subtitle="Kelola tipe penjualan (Dine In, Takeaway, Delivery)" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} onEdit={(item) => { setEditData(item); setFormData({ name: item.name, description: item.description || '' }); setShowModal(true); }} onDelete={async (item) => { if (confirm(`Hapus sales type "${item.name}"?`)) { await api.delete(`/library/sales-type/${item.id}`); loadData(); } }} searchPlaceholder="Cari tipe penjualan..." />

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditData(null); }} title={editData ? 'Edit Tipe Penjualan' : 'Tambah Tipe Penjualan'}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Tipe Penjualan" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Contoh: Dine In, Takeaway" />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi tipe penjualan" />
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}