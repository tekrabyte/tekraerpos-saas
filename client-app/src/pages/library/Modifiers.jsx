import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Modifiers() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/modifiers');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/modifiers/${formData.id}`, formData);
            else await api.post('/tenant/data/modifiers', formData);
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const columns = [
        { header: 'Nama', accessor: (i) => i.name },
        { header: 'Tipe', accessor: (i) => i.type === 'add' ? 'Tambahan (+)' : 'Pengurangan (-)' },
        { header: 'Harga', accessor: (i) => `Rp ${parseInt(i.price_adjustment).toLocaleString()}` },
    ];

    return (
        <div>
            <PageHeader title="Modifiers" subtitle="Kelola topping & varian" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData({type: 'add'}); setShowModal(true); }} onEdit={(i) => { setFormData(i); setShowModal(true); }} onDelete={async (i) => { if(confirm("Hapus?")) { await api.delete(`/tenant/data/modifiers/${i.id}`); loadData(); } }} />
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Modifier">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Modifier" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <FormField label="Tipe" name="type" type="select" options={[{value:'add', label:'Tambah Harga'}, {value:'sub', label:'Kurangi Harga'}]} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                    <FormField label="Nominal (Rp)" name="price_adjustment" type="number" value={formData.price_adjustment} onChange={e => setFormData({...formData, price_adjustment: e.target.value})} required />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}