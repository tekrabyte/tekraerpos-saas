import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';

export default function Suppliers() {
    const [data, setData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/suppliers');
            setData(res.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Gabungkan alamat detail ke satu field 'address' untuk disimpan di DB (jika struktur DB sederhana)
            // Atau simpan terpisah jika sudah ada kolomnya. Disini kita gabung ke text address.
            const fullPayload = {
                ...formData,
                address: `${formData.street_address || ''}, ${formData.city || ''}, ${formData.state || ''} ${formData.zip || ''}`
            };

            if (formData.id) await api.put(`/tenant/data/suppliers/${formData.id}`, fullPayload);
            else await api.post('/tenant/data/suppliers', fullPayload);
            
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus supplier?")) { await api.delete(`/tenant/data/suppliers/${id}`); loadData(); }
    };

    const handleOpenAdd = () => { setFormData({}); setShowModal(true); };

    const filtered = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
                <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700"><Plus size={18}/> Tambah Supplier</button>
            </div>
            <div className="bg-gray-50 border-b px-6 py-3">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari supplier..." className="w-full pl-10 pr-4 py-2 border rounded outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(s => (
                        <div key={s.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-800">{s.name}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => { setFormData(s); setShowModal(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 space-y-2 mt-3">
                                <div className="flex items-center gap-2"><Phone size={14}/> {s.phone || '-'}</div>
                                <div className="flex items-center gap-2"><Mail size={14}/> {s.email || '-'}</div>
                                <div className="flex items-start gap-2"><MapPin size={14} className="mt-0.5"/> <span className="flex-1">{s.address || '-'}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Supplier Details" size="lg">
                <form onSubmit={handleSubmit} className="p-2">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Supplier Name" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <FormField label="Phone" name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="border-t pt-4 mt-2">
                        <FormField label="Email" name="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                       
                    </div>
                    
                    <div className="border-t pt-4 mt-2">
                        <h4 className="font-bold text-sm text-gray-500 mb-3">ADDRESS</h4>
                        <FormField label="Street Address" name="street_address" value={formData.street_address} onChange={e => setFormData({...formData, street_address: e.target.value})} placeholder="Jalan, Nomor..." />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField label="City" name="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            <FormField label="State/Province" name="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                            <FormField label="Zip/Postal Code" name="zip" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} />
                        </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-6 font-bold">Simpan Supplier</button>
                </form>
            </Modal>
        </div>
    );
}