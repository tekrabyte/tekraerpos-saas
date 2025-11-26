import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, Edit, Trash2, Store, Loader } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';

export default function Bundles() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, [filterOutlet]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resData, resOutlets] = await Promise.all([
                api.get('/tenant/data/bundles', { params: { outlet_id: filterOutlet !== 'all' ? filterOutlet : '' } }),
                api.get('/tenant/outlets')
            ]);
            setData(resData.data.data || []);
            setOutlets(resOutlets.data.outlets || []);
        } catch (e) {} finally { setLoading(false); }
    };

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
            if (formData.id) await api.put(`/tenant/data/bundles/${formData.id}`, payload);
            else await api.post('/tenant/data/bundles', payload);
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus bundle?")) { await api.delete(`/tenant/data/bundles/${id}`); loadData(); }
    };

    const filtered = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Bundle Packages" subtitle="Paket bundling produk hemat" />
            
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
                            <input type="text" placeholder="Cari bundle..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18}/> <span className="hidden md:inline">Bundle Baru</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold"><tr><th className="p-4">Nama Paket</th><th className="p-4">Harga</th><th className="p-4">SKU</th><th className="p-4">Outlet</th><th className="p-4 text-right">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="5" className="p-8 text-center"><Loader className="animate-spin inline mr-2"/> Memuat...</td></tr> :
                            filtered.map(i => (
                                <tr key={i.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-800">{i.name}</td>
                                    <td className="p-4 font-mono text-sm">Rp {parseInt(i.price).toLocaleString()}</td>
                                    <td className="p-4 text-sm text-gray-600">{i.sku || '-'}</td>
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? "Edit Bundle" : "Tambah Bundle"}>
                <form onSubmit={handleSubmit}>
                    <FormField label="Outlet" name="outlet_id" type="select" options={outlets.map(o => ({ value: o.id, label: o.name }))} value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})} required disabled={isOutletLocked} />
                    <FormField label="Nama Paket" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Harga Paket" name="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                        <FormField label="SKU Bundle" name="sku" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    </div>
                    <FormField label="Deskripsi" name="description" type="textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4 font-bold hover:bg-blue-700 transition">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}