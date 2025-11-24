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
    
    const defaultForm = { name: '', type: 'percentage', value: 0, apply_to: 'all' };
    const [formData, setFormData] = useState(defaultForm);

    const loadData = async () => {
        setLoading(true);
        try {
            // PERBAIKAN: Endpoint /tenant/data/discounts
            const res = await api.get('/tenant/data/discounts');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/discounts/${formData.id}`, formData);
            else await api.post('/tenant/data/discounts', formData);
            
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus diskon ini?")) {
            await api.delete(`/tenant/data/discounts/${id}`);
            loadData();
        }
    };

    const columns = [
        { header: 'Nama Diskon', accessor: (item) => item.name },
        { header: 'Tipe', accessor: (item) => item.type },
        { header: 'Nilai', accessor: (item) => item.type === 'percentage' ? item.value + '%' : 'Rp ' + parseInt(item.value).toLocaleString() },
        { header: 'Target', accessor: (item) => item.apply_to }
    ];

    return (
        <div>
            <PageHeader title="Discounts" subtitle="Kelola potongan harga manual" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData(defaultForm); setShowModal(true); }} onEdit={(item) => { setFormData(item); setShowModal(true); }} onDelete={(item) => handleDelete(item.id)} />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Diskon">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Diskon" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Tipe" name="type" type="select" options={[{value:'percentage', label:'Persen (%)'}, {value:'fixed', label:'Nominal (Rp)'}]} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} />
                        <FormField label="Nilai" name="value" type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} required />
                    </div>
                    <FormField label="Berlaku Untuk" name="apply_to" type="select" options={[{value:'all', label:'Semua Produk'}, {value:'specific', label:'Produk Tertentu'}]} value={formData.apply_to} onChange={(e) => setFormData({...formData, apply_to: e.target.value})} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}