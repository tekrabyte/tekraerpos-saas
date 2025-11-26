import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, Edit, Trash2, Store, Loader } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';

export default function Categories() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => { loadData(); }, [filterOutlet]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resData, resOutlets] = await Promise.all([
                api.get('/tenant/data/categories', { params: { outlet_id: filterOutlet !== 'all' ? filterOutlet : '' } }),
                api.get('/tenant/outlets')
            ]);
            setData(resData.data.data || []);
            setOutlets(resOutlets.data.outlets || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // Logic Lock
    const isOutletLocked = filterOutlet !== 'all';

    const handleOpenAdd = () => {
        setFormData({ outlet_id: isOutletLocked ? filterOutlet : (outlets[0]?.id || '') });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.outlet_id) return alert("Pilih outlet!");
            if (formData.id) await api.put(`/tenant/data/categories/${formData.id}`, payload);
            else await api.post('/tenant/data/categories', payload);
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus kategori?")) { await api.delete(`/tenant/data/categories/${id}`); loadData(); }
    };

    const filtered = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Categories" subtitle="Kelompokkan produk Anda" />
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-auto">
                        <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
                            value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}>
                            <option value="all">Semua Outlet</option>
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari kategori..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18}/> <span className="hidden md:inline">Kategori Baru</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold"><tr><th className="p-4">Nama Kategori</th><th className="p-4">Deskripsi</th><th className="p-4">Outlet</th><th className="p-4 text-right">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="4" className="p-8 text-center"><Loader className="animate-spin inline mr-2"/> Memuat...</td></tr> :
                            filtered.map(i => (
                                <tr key={i.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-800">{i.name}</td>
                                    <td className="p-4 text-sm text-gray-600">{i.description || '-'}</td>
                                    <td className="p-4 text-sm text-gray-600">{outlets.find(o=>o.id == i.outlet_id)?.name || '-'}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setFormData(i); setShowModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(i.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? "Edit Kategori" : "Tambah Kategori"}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Outlet" name="outlet_id" type="select" options={outlets.map(o => ({ value: o.id, label: o.name }))} value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})} required disabled={isOutletLocked} />
                    <FormField label="Nama Kategori" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 font-bold hover:bg-blue-700 transition">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}