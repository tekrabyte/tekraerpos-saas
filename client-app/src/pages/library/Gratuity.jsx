import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, Edit, Trash2, Store } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';

export default function Gratuity() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => { loadData(); }, [filterOutlet]);

    const loadData = async () => {
        try {
            const [resData, resOutlets] = await Promise.all([
                api.get('/tenant/data/gratuity', { params: { outlet_id: filterOutlet !== 'all' ? filterOutlet : '' } }),
                api.get('/tenant/outlets')
            ]);
            setData(resData.data.data || []);
            setOutlets(resOutlets.data.outlets || []);
        } catch (e) {}
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.outlet_id && filterOutlet !== 'all') payload.outlet_id = filterOutlet;
            if (!payload.outlet_id) return alert("Pilih outlet!");

            if (formData.id) await api.put(`/tenant/data/gratuity/${formData.id}`, payload);
            else await api.post('/tenant/data/gratuity', payload);
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus gratuity?")) { await api.delete(`/tenant/data/gratuity/${id}`); loadData(); }
    };

    const handleOpenAdd = () => {
        setFormData({ is_default: 0, outlet_id: filterOutlet !== 'all' ? filterOutlet : outlets[0]?.id });
        setShowModal(true);
    };

    const filtered = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gratuity (Service Charge)</h1>
                <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700"><Plus size={18}/> Tambah</button>
            </div>
            <div className="bg-gray-50 border-b px-6 py-3 flex gap-3">
                <div className="relative"><Store className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <select className="border rounded pl-8 pr-3 py-2 text-sm outline-none bg-white min-w-[160px]" value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}>
                        <option value="all">Semua Outlet</option>{outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>
                <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-2 border rounded outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>
            <div className="flex-1 p-6 overflow-auto"><div className="bg-white rounded shadow border overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold"><tr><th className="p-4">Nama</th><th className="p-4">Rate (%)</th><th className="p-4">Outlet</th><th className="p-4">Default</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody className="divide-y">
                {filtered.map(i => (
                    <tr key={i.id} className="hover:bg-blue-50"><td className="p-4 font-bold">{i.name}</td><td className="p-4 font-mono">{i.rate}%</td><td className="p-4 text-sm">{outlets.find(o=>o.id == i.outlet_id)?.name || '-'}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${i.is_default == 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>{i.is_default == 1 ? 'Ya' : 'Tidak'}</span></td><td className="p-4 text-right flex justify-end gap-2"><button onClick={() => { setFormData(i); setShowModal(true); }} className="text-blue-600 p-1"><Edit size={16}/></button><button onClick={() => handleDelete(i.id)} className="text-red-600 p-1"><Trash2 size={16}/></button></td></tr>
                ))}
            </tbody></table></div></div>
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Form Gratuity">
                <form onSubmit={handleSubmit}>
                    <FormField label="Outlet" name="outlet_id" type="select" options={outlets.map(o => ({ value: o.id, label: o.name }))} value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})} required />
                    <FormField label="Nama" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Service Charge" />
                    <FormField label="Rate (%)" name="rate" type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} required />
                    <div className="mb-4"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_default == 1} onChange={e => setFormData({...formData, is_default: e.target.checked ? 1 : 0})} /><span className="text-sm">Jadikan Default</span></label></div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Simpan</button>
                </form>
            </Modal>
        </div>
    );
}