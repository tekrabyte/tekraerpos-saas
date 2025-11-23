import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import api from '../../api/client'; // Pastikan import api

export default function Suppliers() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

    // Simulasi Load Data
    useEffect(() => {
        // Ganti dengan api.get('/inventory/suppliers') jika endpoint sudah ada
        setData([
            { id: 1, name: 'PT Kopi Indonesia', phone: '08123456789', email: 'sales@kopindo.com', address: 'Jakarta' },
            { id: 2, name: 'CV Susu Segar', phone: '08987654321', email: 'order@sususegar.com', address: 'Bogor' },
        ]);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Simpan data (Integrasikan dengan API): " + JSON.stringify(formData));
        setShowModal(false);
    };

    const columns = [
        { header: 'Nama Supplier', accessor: (i) => i.name },
        { header: 'Kontak', accessor: (i) => i.phone },
        { header: 'Email', accessor: (i) => i.email },
        { header: 'Alamat', accessor: (i) => i.address },
    ];

    return (
        <div>
            <PageHeader title="Suppliers" subtitle="Kelola data pemasok barang" />
            <DataTable 
                columns={columns} 
                data={data} 
                loading={loading} 
                onAdd={() => { setFormData({}); setShowModal(true); }}
                onEdit={(item) => { setFormData(item); setShowModal(true); }}
                onDelete={(item) => alert('Hapus: ' + item.name)}
            />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Supplier">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Perusahaan" name="name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <FormField label="No. Telepon" name="phone" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <FormField label="Email" name="email" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <FormField label="Alamat" name="address" type="textarea" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}