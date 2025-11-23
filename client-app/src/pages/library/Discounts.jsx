import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Discounts() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: 'percentage', value: '0', apply_to: 'all' });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/library/discounts');
            setData(res.data.discounts || []);
        } catch (error) { console.error('Failed to load discounts:', error); setData([]); }
        finally { setLoading(false); }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editData) { await api.put(`/library/discounts/${editData.id}`, formData); }
            else { await api.post('/library/discounts', formData); }
            setShowModal(false); setFormData({ name: '', type: 'percentage', value: '0', apply_to: 'all' }); setEditData(null); loadData();
        } catch (error) { alert('Gagal menyimpan data: ' + error.message); }
    };

    const columns = [
        { header: 'Nama Diskon', accessor: (item) => item.name || '-' },
        { header: 'Tipe', accessor: (item) => item.type === 'percentage' ? 'Persentase' : 'Nominal' },
        { header: 'Nilai', accessor: (item) => item.type === 'percentage' ? `${item.value}%` : `Rp ${parseInt(item.value || 0).toLocaleString()}` },
        { header: 'Diterapkan Ke', accessor: (item) => item.apply_to === 'all' ? 'Semua Produk' : 'Produk Tertentu' }
    ];

    return (
        <div>
            <PageHeader title="Discounts" subtitle="Kelola diskon produk" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} onEdit={(item) => { setEditData(item); setFormData({ name: item.name, type: item.type, value: item.value, apply_to: item.apply_to }); setShowModal(true); }} onDelete={async (item) => { if (confirm(`Hapus diskon "${item.name}"?`)) { await api.delete(`/library/discounts/${item.id}`); loadData(); } }} searchPlaceholder="Cari diskon..." />

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditData(null); }} title={editData ? 'Edit Diskon' : 'Tambah Diskon'}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Diskon" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <FormField label="Tipe Diskon" name="type" type="select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} options={[{ value: 'percentage', label: 'Persentase (%)' }, { value: 'fixed', label: 'Nominal (Rp)' }]} required />
                    <FormField label="Nilai Diskon" name="value" type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} required />
                    <FormField label="Diterapkan Ke" name="apply_to" type="select" value={formData.apply_to} onChange={(e) => setFormData({ ...formData, apply_to: e.target.value })} options={[{ value: 'all', label: 'Semua Produk' }, { value: 'specific', label: 'Produk Tertentu' }]} required />
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}