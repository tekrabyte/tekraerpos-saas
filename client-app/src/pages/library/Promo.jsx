import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function Promo() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/promos');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) await api.put(`/tenant/data/promos/${formData.id}`, formData);
            else await api.post('/tenant/data/promos', formData);
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const columns = [
        { header: 'Nama Promo', accessor: (i) => i.name },
        { header: 'Kode', accessor: (i) => <span className="font-mono bg-gray-100 px-2 py-1 rounded">{i.code}</span> },
        { header: 'Diskon', accessor: (i) => i.discount_type === 'percent' ? `${i.discount_value}%` : `Rp ${parseInt(i.discount_value).toLocaleString()}` },
        { header: 'Periode', accessor: (i) => `${i.start_date} s/d ${i.end_date}` },
    ];

    return (
        <div>
            <PageHeader title="Promo & Voucher" subtitle="Kelola kode promo" />
            <DataTable columns={columns} data={data} loading={loading} onAdd={() => { setFormData({discount_type: 'percent'}); setShowModal(true); }} onEdit={(i) => { setFormData(i); setShowModal(true); }} onDelete={async (i) => { if(confirm("Hapus?")) { await api.delete(`/tenant/data/promos/${i.id}`); loadData(); } }} />
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Promo">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Promo" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <FormField label="Kode Voucher" name="code" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Tipe Diskon" name="discount_type" type="select" options={[{value:'percent', label:'Persen (%)'}, {value:'fixed', label:'Nominal (Rp)'}]} value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})} />
                        <FormField label="Nilai" name="discount_value" type="number" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Mulai" name="start_date" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                        <FormField label="Berakhir" name="end_date" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}