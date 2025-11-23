import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import api from '../../api/client';

export default function Adjustment() {
    const [history, setHistory] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ product_id: '', type: 'add', qty: '', reason: 'opname', user: 'Admin' });

    useEffect(() => {
        loadData();
        // Load produk untuk dropdown
        api.get('/tenant/products').then(res => setProducts(res.data.products || []));
    }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/tenant/data/stock_adjustments');
            setHistory(res.data.data || []);
        } catch (e) {}
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Hitung qty (positif/negatif)
        const finalQty = formData.type === 'sub' ? -Math.abs(formData.qty) : Math.abs(formData.qty);
        
        try {
            await api.post('/tenant/data/stock_adjustments', {
                ...formData,
                qty: finalQty,
                date: new Date().toISOString().split('T')[0]
            });
            
            // TODO: Update stok produk di tabel products juga (logika backend)
            
            setShowModal(false);
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const columns = [
        { header: 'Tanggal', accessor: (i) => i.date },
        { header: 'Produk ID', accessor: (i) => i.product_id },
        { header: 'Penyesuaian', render: (i) => (
            <span className={`font-bold ${parseInt(i.qty) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseInt(i.qty) > 0 ? `+${i.qty}` : i.qty}
            </span>
        )},
        { header: 'Alasan', accessor: (i) => i.reason },
        { header: 'Oleh', accessor: (i) => i.user },
    ];

    const productOptions = products.map(p => ({ value: p.id, label: p.name }));

    return (
        <div>
            <PageHeader title="Stock Adjustment" subtitle="Penyesuaian stok manual" />
            <DataTable columns={columns} data={history} onAdd={() => setShowModal(true)} />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Penyesuaian Stok">
                <form onSubmit={handleSubmit}>
                    <FormField label="Pilih Produk" name="product_id" type="select" options={productOptions} value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Jenis" name="type" type="select" options={[{value:'add', label: 'Tambah (+)'}, {value:'sub', label: 'Kurang (-)'}]} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required />
                        <FormField label="Jumlah" name="qty" type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} required />
                    </div>
                    <FormField label="Alasan" name="reason" type="select" options={[
                        {value:'opname', label: 'Stok Opname'}, {value:'damage', label: 'Rusak'}, {value:'loss', label: 'Hilang'}
                    ]} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} required />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}