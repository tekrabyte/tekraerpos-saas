import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import api from '../../api/client';

export default function Groups() {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/table_groups');
            setData(res.data.data || []);
        } catch(e){} finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tenant/data/table_groups', formData);
            setShowModal(false);
            setFormData({ name: '' });
            loadData();
        } catch (e) { alert("Gagal menyimpan"); }
    };

    const handleDelete = async (id) => {
        if(confirm("Hapus area ini?")) {
            await api.delete(`/tenant/data/table_groups/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama Area', accessor: (i) => i.name },
        { header: 'ID', accessor: (i) => i.id },
        { header: 'Aksi', render: (i) => <button onClick={() => handleDelete(i.id)} className="text-red-500 text-sm">Hapus</button> }
    ];

    return (
        <div>
            <PageHeader title="Group Meja (Area)" subtitle="Kelola area restoran" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => setShowModal(true)} />
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Area Baru">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Area" name="name" value={formData.name} onChange={e => setFormData({name: e.target.value})} placeholder="Contoh: VIP Room" required />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}