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
    
    // Default value agar tidak error "Uncontrolled Input"
    const defaultForm = { name: '', description: '' };
    const [formData, setFormData] = useState(defaultForm);

    const loadData = async () => {
        setLoading(true);
        try {
            // PERBAIKAN: Endpoint disesuaikan ke /tenant/data/sales_types
            const res = await api.get('/tenant/data/sales_types');
            setData(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/sales_types/${formData.id}`, formData);
            else await api.post('/tenant/data/sales_types', formData);
            
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan data."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus tipe penjualan ini?")) {
            await api.delete(`/tenant/data/sales_types/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama Tipe', accessor: (item) => item.name || '-' },
        { header: 'Deskripsi', accessor: (item) => item.description || '-' }
    ];

    return (
        <div>
            <PageHeader title="Sales Type" subtitle="Kelola tipe penjualan (Dine In, Takeaway, Delivery)" />
            <DataTable 
                columns={columns} 
                data={data} 
                loading={loading} 
                onAdd={() => { setFormData(defaultForm); setShowModal(true); }} 
                onEdit={(item) => { setFormData(item); setShowModal(true); }} 
                onDelete={(item) => handleDelete(item.id)} 
            />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Sales Type">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Tipe" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Contoh: Dine In" />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}