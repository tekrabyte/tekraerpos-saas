import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
    Search, Plus, Edit, Trash2, MapPin, Phone, Mail, Loader 
} from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';

export default function Suppliers() {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (search) {
            const lower = search.toLowerCase();
            setFilteredData(data.filter(i => 
                i.name.toLowerCase().includes(lower) || 
                (i.phone && i.phone.includes(lower))
            ));
        } else {
            setFilteredData(data);
        }
    }, [search, data]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/suppliers');
            const suppData = res.data.data || [];
            setData(suppData);
            setFilteredData(suppData);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const fullPayload = {
                ...formData,
                // Opsional: jika ingin gabung address, atau biarkan terpisah jika DB support kolomnya
                address: formData.street_address ? `${formData.street_address}, ${formData.city || ''}` : formData.address
            };

            if (formData.id) await api.put(`/tenant/data/suppliers/${formData.id}`, fullPayload);
            else await api.post('/tenant/data/suppliers', fullPayload);
            
            setShowModal(false); 
            loadData();
        } catch (e) { alert("Gagal menyimpan."); }
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus supplier ini?")) { 
            try {
                await api.delete(`/tenant/data/suppliers/${id}`); 
                loadData(); 
            } catch(e) { alert("Gagal hapus."); }
        }
    };

    const handleOpenAdd = () => { setFormData({}); setShowModal(true); };
    const handleOpenEdit = (item) => { setFormData(item); setShowModal(true); };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Suppliers" subtitle="Database pemasok barang" />

            {/* HEADER ACTIONS */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari nama / no. hp..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                    <Plus size={18}/> Tambah Supplier
                </button>
            </div>
            
            {/* TABLE */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="p-4">Nama Supplier</th>
                                <th className="p-4">Kontak</th>
                                <th className="p-4">Alamat</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center"><Loader className="animate-spin inline text-blue-600 mr-2" size={20}/> Memuat data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Belum ada supplier.</td></tr>
                            ) : (
                                filteredData.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800">{s.name}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2 mb-1"><Phone size={12}/> {s.phone || '-'}</div>
                                            <div className="flex items-center gap-2"><Mail size={12}/> {s.email || '-'}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 max-w-xs truncate">
                                            <div className="flex items-center gap-2"><MapPin size={12}/> {s.address || '-'}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenEdit(s)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit size={16}/></button>
                                                <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={formData.id ? "Edit Supplier" : "Tambah Supplier"} size="md">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Nama Supplier" name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        <FormField label="No. Telepon" name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    
                    <FormField label="Email" name="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    
                    <div className="border-t pt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Alamat Lengkap</h4>
                        <FormField label="Jalan / Gedung" name="street_address" value={formData.street_address || formData.address} onChange={e => setFormData({...formData, street_address: e.target.value})} placeholder="Jalan, Nomor..." />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Kota" name="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                            <FormField label="Kode Pos" name="zip" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold mr-2">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70">
                            {isSubmitting && <Loader className="animate-spin" size={16} />} Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}