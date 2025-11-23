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
    const [editData, setEditData] = useState(null);
    const [formData, setFormData] = useState({ name: '', rate: '0', is_default: false });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/library/gratuity');
            setData(res.data.gratuities || []);
        } catch (error) { console.error('Failed to load gratuity:', error); setData([]); } finally { setLoading(false); }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editData) { await api.put(`/library/gratuity/${editData.id}`, formData); } else { await api.post('/library/gratuity', formData); }
            setShowModal(false); setFormData({ name: '', rate: '0', is_default: false }); setEditData(null); loadData();
        } catch (error) { alert('Gagal menyimpan data: ' + error.message); }
    };

    const columns = [
        { header: 'Nama Gratuity', accessor: (item) => item.name || '-' },
        { header: 'Tarif', accessor: (item) => `${item.rate}%` },
        { header: 'Default', render: (item) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.is_default ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{item.is_default ? 'Ya' : 'Tidak'}</span> }
    ];

    return (
        <div>
            <PageHeader title="Gratuity" subtitle="Kelola tip atau gratuitas" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} onEdit={(item) => { setEditData(item); setFormData({ name: item.name, rate: item.rate, is_default: item.is_default }); setShowModal(true); }} onDelete={async (item) => { if (confirm(`Hapus gratuity "${item.name}"?`)) { await api.delete(`/library/gratuity/${item.id}`); loadData(); } }} searchPlaceholder="Cari gratuity..." />

            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditData(null); }} title={editData ? 'Edit Gratuity' : 'Tambah Gratuity'}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Gratuity" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Contoh: Tip 10%" />
                    <FormField label="Tarif (%)" name="rate" type="number" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} required placeholder="10" />
                    <div className="flex items-center mb-4">
                        <input type="checkbox" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} className="mr-2" />
                        <label className="text-sm text-gray-700">Jadikan default</label>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}