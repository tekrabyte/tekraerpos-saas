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
    
    const defaultForm = { name: '', description: '', price: 0, items: '', sku: '' };
    const [formData, setFormData] = useState(defaultForm);

    const loadData = async () => {
        setLoading(true);
        try {
            // PERBAIKAN: Endpoint /tenant/data/bundles
            const res = await api.get('/tenant/data/bundles');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/bundles/${formData.id}`, formData);
            else await api.post('/tenant/data/bundles', formData);
            
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus paket bundle ini?")) {
            await api.delete(`/tenant/data/bundles/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama Paket', accessor: (item) => item.name },
        { header: 'Harga Jual', accessor: (item) => `Rp ${parseInt(item.price).toLocaleString()}` },
        { header: 'SKU Bundle', accessor: (item) => item.sku || '-' }
    ];

    return (
        <div>
            <PageHeader title="Bundle Packages" subtitle="Kelola paket bundling produk" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData(defaultForm); setShowModal(true); }} onEdit={(item) => { setFormData(item); setShowModal(true); }} onDelete={(item) => handleDelete(item.id)} />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Bundle">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Paket" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Harga Paket" name="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                        <FormField label="SKU Bundle" name="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    
                    <p className="text-xs text-gray-500 mt-2 mb-4">*Fitur pemilihan item produk dalam bundle akan segera hadir.</p>

                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}