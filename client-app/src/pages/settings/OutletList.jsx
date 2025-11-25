import React, { useEffect, useState } from "react";
import api from "../../api/client";
import Modal from "../../components/Modal"; 
import { Store, Plus, Trash2, MapPin, Loader } from "lucide-react";

export default function OutletList() {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- STATE MODAL & FORM ---
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State untuk Data Wilayah (API Indonesia)
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]); // State Kelurahan
    
    // State Form Data
    const defaultForm = {
        name: '',
        address: '',
        phone: '',
        province: '',     // Nama Provinsi
        province_id: '',  // ID Provinsi
        city: '',         // Nama Kota
        city_id: '',      // ID Kota
        district: '',     // Nama Kecamatan
        district_id: '',  // ID Kecamatan
        village: '',      // Nama Kelurahan (Pengganti Kode Pos manual)
        village_id: '',   // ID Kelurahan
        is_clone: false,
        clone_from_id: ''
    };
    const [formData, setFormData] = useState(defaultForm);

    // --- LOAD DATA UTAMA ---
    useEffect(() => {
        loadData();
        fetchProvinces(); 
    }, []);

    async function loadData() {
        try {
            const res = await api.get("/tenant/outlets");
            setOutlets(res.data.outlets || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // --- LOGIKA API WILAYAH INDONESIA (Cascading Dropdown) ---
    
    const fetchProvinces = async () => {
        try {
            const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
            const data = await res.json();
            setProvinces(data);
        } catch (e) { console.error("Gagal load provinsi", e); }
    };

    const handleProvinceChange = async (e) => {
        const selectedId = e.target.value;
        const selectedName = e.target.options[e.target.selectedIndex].text;
        
        setFormData(prev => ({ 
            ...prev, 
            province: selectedName, province_id: selectedId, 
            city: '', city_id: '', district: '', district_id: '', village: '', village_id: '' 
        }));
        setCities([]); setDistricts([]); setVillages([]);

        if(!selectedId) return;

        try {
            const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedId}.json`);
            const data = await res.json();
            setCities(data);
        } catch (e) { console.error("Gagal load kota", e); }
    };

    const handleCityChange = async (e) => {
        const selectedId = e.target.value;
        const selectedName = e.target.options[e.target.selectedIndex].text;

        setFormData(prev => ({ 
            ...prev, 
            city: selectedName, city_id: selectedId, 
            district: '', district_id: '', village: '', village_id: '' 
        }));
        setDistricts([]); setVillages([]);

        if(!selectedId) return;

        try {
            const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedId}.json`);
            const data = await res.json();
            setDistricts(data);
        } catch (e) { console.error("Gagal load kecamatan", e); }
    };

    const handleDistrictChange = async (e) => {
        const selectedId = e.target.value;
        const selectedName = e.target.options[e.target.selectedIndex].text;

        setFormData(prev => ({ 
            ...prev, 
            district: selectedName, district_id: selectedId, 
            village: '', village_id: '' 
        }));
        setVillages([]);

        if(!selectedId) return;

        try {
            // Fetch Kelurahan (Villages)
            const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedId}.json`);
            const data = await res.json();
            setVillages(data);
        } catch (e) { console.error("Gagal load kelurahan", e); }
    };

    const handleVillageChange = (e) => {
        const selectedId = e.target.value;
        const selectedName = e.target.options[e.target.selectedIndex].text;
        setFormData(prev => ({ ...prev, village: selectedName, village_id: selectedId }));
    };

    // --- HANDLERS FORM ---

    const handleOpenAdd = () => {
        setFormData(defaultForm);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.post("/tenant/outlets", {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                
                // Data Lokasi Lengkap
                province: formData.province,
                city: formData.city,
                district: formData.district,
                postal_code: formData.village, // Simpan nama kelurahan ke field postal_code (atau buat kolom baru di DB)
                
                clone_data: formData.is_clone,
                clone_from_id: formData.clone_from_id || (outlets.length > 0 ? outlets[0].id : null)
            });
            
            alert("Outlet berhasil dibuat!");
            setShowModal(false);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Gagal membuat outlet.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin hapus outlet ini? Data transaksi akan hilang.")) return;
        try {
            await api.delete(`/tenant/outlets/${id}`);
            loadData();
        } catch (err) {
            alert("Gagal menghapus outlet.");
        }
    };

    if (loading) return <div className="p-8 text-center flex justify-center"><Loader className="animate-spin text-blue-600" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Store className="text-blue-600" /> Manajemen Outlet
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola cabang dan lokasi bisnis Anda.</p>
                </div>
                
                <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                    <Plus size={20} /> Tambah Outlet
                </button>
            </div>

            {/* List Outlet */}
            <div className="grid grid-cols-1 gap-4">
                {outlets.map((o) => (
                    <div key={o.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-lg text-gray-800">{o.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${o.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {o.status}
                                </span>
                                {parseInt(o.id) === 1 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">PUSAT</span>}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <MapPin size={14} />
                                <span>{o.address || "Alamat belum diatur"}</span>
                            </div>
                        </div>
                        {parseInt(o.id) !== 1 && (
                            <button onClick={() => handleDelete(o.id)} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <Trash2 size={16} /> Hapus
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* --- POPUP FORM (MODAL) --- */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Outlet" size="lg">
                <form onSubmit={handleSubmit} className="p-2">
                    
                    <div className="space-y-4">
                        {/* Outlet Name */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700">Outlet Name</label>
                            <div className="col-span-12 md:col-span-9">
                                <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Cabang Jakarta Selatan"
                                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-12 gap-4 items-start">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700 pt-2">Address</label>
                            <div className="col-span-12 md:col-span-9">
                                <textarea className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows="2" placeholder="Jalan, Nomor, RT/RW"
                                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                        </div>

                        {/* Province (API) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700">Province</label>
                            <div className="col-span-12 md:col-span-9">
                                <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.province_id} onChange={handleProvinceChange}>
                                    <option value="">-- Pilih Provinsi --</option>
                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* City (API) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700">City</label>
                            <div className="col-span-12 md:col-span-9">
                                <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.city_id} onChange={handleCityChange} disabled={!formData.province_id}>
                                    <option value="">-- Pilih Kota/Kabupaten --</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* District (API) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700">District</label>
                            <div className="col-span-12 md:col-span-9">
                                <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.district_id} onChange={handleDistrictChange} disabled={!formData.city_id}>
                                    <option value="">-- Pilih Kecamatan --</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Kelurahan / Postal Code (API Dropdown) */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700">Kelurahan / Desa</label>
                            <div className="col-span-12 md:col-span-9">
                                <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.village_id} onChange={handleVillageChange} disabled={!formData.district_id}>
                                    <option value="">-- Pilih Kelurahan --</option>
                                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <label className="col-span-12 md:col-span-3 text-sm font-medium text-gray-700">Phone Number</label>
                            <div className="col-span-12 md:col-span-9">
                                <div className="flex rounded border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                                    <div className="bg-gray-50 px-3 py-2 text-gray-500 text-sm border-r flex items-center gap-1">🇮🇩 +62</div>
                                    <input type="number" className="flex-1 px-3 py-2 outline-none" placeholder="81234567890"
                                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="my-6 border-t border-gray-200"></div>

                    {/* CLONE OUTLET */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-700 text-sm tracking-wide">CLONE DATA</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={formData.is_clone} onChange={e => setFormData({...formData, is_clone: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">{formData.is_clone ? 'ON' : 'OFF'}</span>
                            </label>
                        </div>
                        <hr className="border-gray-200 mb-3"/>
                        <p className="text-xs text-gray-500 mb-4">Salin library (produk, kategori, dll) dari outlet yang sudah ada.</p>

                        {formData.is_clone && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Salin Dari:</label>
                                <select className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-sm"
                                    value={formData.clone_from_id} onChange={e => setFormData({...formData, clone_from_id: e.target.value})}>
                                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-70 flex items-center gap-2">
                            {isSubmitting && <Loader className="animate-spin" size={16} />} Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}