import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

export default function CustomerList() {
    const [data] = useState([
        { id: 1, name: 'Budi Santoso', phone: '081299998888', points: 150, last_visit: '2023-11-20' },
        { id: 2, name: 'Siti Aminah', phone: '081377776666', points: 340, last_visit: '2023-11-22' },
    ]);
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { header: 'Nama', accessor: (i) => i.name },
        { header: 'No. HP', accessor: (i) => i.phone },
        { header: 'Poin Loyalty', accessor: (i) => <span className="font-bold text-blue-600">{i.points} pts</span> },
        { header: 'Terakhir Berkunjung', accessor: (i) => i.last_visit },
    ];

    return (
        <div>
            <PageHeader title="Daftar Pelanggan" subtitle="Database pelanggan & member" />
            <DataTable columns={columns} data={data} onAdd={() => setShowModal(true)} searchPlaceholder="Cari pelanggan..." />
            
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Pelanggan Manual">
                <form>
                    <FormField label="Nama Lengkap" name="name" required />
                    <FormField label="No. Handphone" name="phone" required />
                    <FormField label="Email (Opsional)" name="email" type="email" />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}