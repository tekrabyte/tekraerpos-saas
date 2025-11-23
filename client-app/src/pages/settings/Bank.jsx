import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { CreditCard, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import api from '../../api/client'; // Import API

export default function Bank() {
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ bank: '', number: '', name: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/tenant/data/bank_accounts');
            setAccounts(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/tenant/data/bank_accounts', formData);
            setShowModal(false);
            setFormData({ bank: '', number: '', name: '' });
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if(!confirm("Hapus rekening ini?")) return;
        try {
            await api.delete(`/tenant/data/bank_accounts/${id}`);
            loadData();
        } catch (e) { alert("Gagal menghapus."); }
    };

    return (
        <div>
            <PageHeader title="Rekening Bank" subtitle="Daftar rekening untuk settlement" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((acc) => (
                    <div key={acc.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                <CreditCard size={24} />
                            </div>
                            <button onClick={() => handleDelete(acc.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{acc.bank}</h3>
                        <p className="text-gray-500 text-sm mt-1">A/N {acc.name}</p>
                        <p className="text-xl font-mono font-bold mt-3 tracking-wider text-blue-600">{acc.number}</p>
                    </div>
                ))}

                <button onClick={() => setShowModal(true)} className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all min-h-[180px]">
                    <span className="text-4xl font-light mb-2">+</span>
                    <span className="font-medium">Tambah Rekening</span>
                </button>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Rekening Bank">
                <form onSubmit={handleSubmit}>
                    <FormField label="Nama Bank" name="bank" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} required />
                    <FormField label="Nomor Rekening" name="number" type="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required />
                    <FormField label="Atas Nama" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 font-bold">
                        {loading ? 'Menyimpan...' : 'Simpan Rekening'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}