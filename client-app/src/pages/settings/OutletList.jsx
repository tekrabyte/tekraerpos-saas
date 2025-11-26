import React, { useEffect, useState } from "react";
import api from "../../api/client";
import Modal from "../../components/Modal"; 
import { Store, Plus, Trash2, MapPin, Loader } from "lucide-react";
import PageHeader from '../../components/PageHeader';

export default function OutletList() {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);
    
    const defaultForm = {
        name: '', address: '', phone: '', 
        province: '', province_id: '', city: '', city_id: '', district: '', district_id: '', village: '', village_id: '',
        is_clone: false, clone_from_id: ''
    };
    const [formData, setFormData] = useState(defaultForm);

    useEffect(() => {
        loadData();
        fetchProvinces(); 
    }, []);

    async function loadData() {
        try {
            const res = await api.get("/tenant/outlets");
            setOutlets(res.data.outlets || []);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }

    const fetchProvinces = async () => {
        try {
            const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
            setProvinces(await res.json());
        } catch (e) { console.error("Gagal load provinsi", e); }
    };

    const handleRegionChange = async (type, e) => {
        const id = e.target.value;
        const name = e.target.options[e.target.selectedIndex].text;
        if (type === 'province') {
            setFormData(p => ({ ...p, province: name, province_id: id, city: '', city_id: '', district: '', district_id: '', village: '', village_id: '' }));
            setCities([]); setDistricts([]); setVillages([]);
            if(id) setCities(await (await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)).json());
        } else if (type === 'city') {
            setFormData(p => ({ ...p, city: name, city_id: id, district: '', district_id: '', village: '', village_id: '' }));
            setDistricts([]); setVillages([]);
            if(id) setDistricts(await (await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`)).json());
        } else if (type === 'district') {
            setFormData(p => ({ ...p, district: name, district_id: id, village: '', village_id: '' }));
            setVillages([]);
            if(id) setVillages(await (await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`)).json());
        } else if (type === 'village') {
            setFormData(p => ({ ...p, village: name, village_id: id }));
        }
    };

    const handleOpenAdd = () => { setFormData(defaultForm); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/tenant/outlets", {
                name: formData.name, address: formData.address, phone: formData.phone,
                province: formData.province, city: formData.city, district: formData.district, postal_code: formData.village,
                clone_data: formData.is_clone, clone_from_id: formData.clone_from_id || (outlets.length > 0 ? outlets[0].id : null)
            });
            alert("Outlet berhasil dibuat!");
            setShowModal(false); loadData();
        } catch (err) { alert(err.response?.data?.message || "Gagal membuat outlet."); } 
        finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin hapus outlet ini? Data transaksi akan hilang.")) return;
        try { await api.delete(`/tenant/outlets/${id}`); loadData(); } 
        catch (err) { alert("Gagal menghapus outlet."); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Manajemen Outlet" subtitle="Kelola cabang dan lokasi bisnis Anda" />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex justify-end">
                <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
                    <Plus size={20} /> Tambah Outlet
                </button>
            </div>

            <div className="flex-1 overflow-auto px-1">
                {loading ? <div className="text-center p-10"><Loader className="animate-spin inline mr-2"/> Memuat...</div> :
                <div className="grid grid-cols-1 gap-4">
                    {outlets.map((o) => (
                        <div key={o.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-gray-800">{o.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${o.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                                    {parseInt(o.id) === 1 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">PUSAT</span>}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm"><MapPin size={14} /> <span>{o.address || "Alamat belum diatur"}</span></div>
                            </div>
                            {parseInt(o.id) !== 1 && <button onClick={() => handleDelete(o.id)} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Trash2 size={16} /> Hapus</button>}
                        </div>
                    ))}
                </div>}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Outlet" size="lg">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name</label>
                            <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Cabang Jakarta" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <select className="border rounded-lg px-3 py-2" value={formData.province_id} onChange={(e) => handleRegionChange('province', e)}><option value="">-- Pilih Provinsi --</option>{provinces.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                            <select className="border rounded-lg px-3 py-2" value={formData.city_id} onChange={(e) => handleRegionChange('city', e)} disabled={!formData.province_id}><option value="">-- Pilih Kota --</option>{cities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
                            <select className="border rounded-lg px-3 py-2" value={formData.district_id} onChange={(e) => handleRegionChange('district', e)} disabled={!formData.city_id}><option value="">-- Pilih Kecamatan --</option>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
                            <select className="border rounded-lg px-3 py-2" value={formData.village_id} onChange={(e) => handleRegionChange('village', e)} disabled={!formData.district_id}><option value="">-- Pilih Kelurahan --</option>{villages.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select>
                        </div>
                        <textarea className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Alamat detail (Jalan, No, RT/RW)" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-700 text-sm">CLONE DATA (Salin Produk & Kategori)</span>
                            <input type="checkbox" className="w-5 h-5" checked={formData.is_clone} onChange={e => setFormData({...formData, is_clone: e.target.checked})} />
                        </div>
                        {formData.is_clone && (
                            <select className="w-full border rounded-lg px-3 py-2 text-sm mt-2" value={formData.clone_from_id} onChange={e => setFormData({...formData, clone_from_id: e.target.value})}>
                                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="flex justify-end pt-2 gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border rounded-lg text-gray-600 font-bold hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
                            {isSubmitting && <Loader className="animate-spin" size={16} />} Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}