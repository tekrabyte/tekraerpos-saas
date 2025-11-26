import React, { useEffect, useState } from "react";
import productsAPI from "../../api/products";
import api from "../../api/client";
import { 
    X, Edit, Trash2, Plus, Search, Store, 
    Image as ImageIcon, CheckCircle, Loader, Filter, Package, ChevronDown, Info, Truck
} from "lucide-react";
import PageHeader from '../../components/PageHeader';
import { Link } from "react-router-dom";
export default function ProductList() {
    // --- STATE ---
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [outlets, setOutlets] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingPOS, setUploadingPOS] = useState(false);
    const [uploadingOnline, setUploadingOnline] = useState(false);

    // --- FILTERS ---
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // --- FORM STATE ---
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProductId, setCurrentProductId] = useState(null);
    
    const defaultForm = {
        name: "", category_id: "", brand_id: "", description: "", image_url: "",
        // Moka / Online Features
        is_ecommerce: false, condition: 'New', weight: 0, length: 0, width: 0, height: 0, 
        is_preorder: false, preorder_duration: 7, online_image_url: "",
        // Pricing
        price: "", sku: "", has_variants: false, variants: [],
        // Inventory & Cost
        manage_stock: false, stocks: [], cost_price: 0, track_cogs: false
    };
    const [formData, setFormData] = useState(defaultForm);
    
    // Sub Modals
    const [subModal, setSubModal] = useState(null);
    const [tempVariant, setTempVariant] = useState({ name: "", price: 0, sku: "", stock: 0 });

    // --- INITIAL LOAD ---
    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [prodRes, catRes, brandRes, outletRes] = await Promise.all([
                productsAPI.list(),
                api.get('/tenant/data/categories'),
                api.get('/tenant/data/brands'),
                api.get('/tenant/outlets')
            ]);
            setProducts(prodRes.data.products || []);
            setCategories(catRes.data.data || []);
            setBrands(brandRes.data.data || []);
            setOutlets(outletRes.data.outlets || []);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    }

    // --- FILTER LOGIC ---
    useEffect(() => {
        let result = products;
        if (filterCategory !== "all") result = result.filter(p => p.category_id == filterCategory);
        
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(lower) || (p.sku && p.sku.toLowerCase().includes(lower)));
        }
        setFilteredProducts(result);
    }, [products, filterCategory, filterOutlet, searchQuery]);

    // --- HANDLERS ---
    const handleOpenAdd = () => {
        setEditMode(false);
        const initialStocks = outlets.map(o => ({ outlet_id: o.id, name: o.name, qty: 0, alert: 5 }));
        setFormData({ ...defaultForm, stocks: initialStocks });
        setShowModal(true);
    };

    const handleOpenEdit = (p) => {
        setEditMode(true);
        setCurrentProductId(p.id);
        
        const existingStocks = outlets.map(o => ({
            outlet_id: o.id,
            name: o.name,
            qty: (p.stocks && p.stocks[o.id]) ? p.stocks[o.id] : 0, 
            alert: parseInt(p.stock_alert || 5)
        }));

        setFormData({
            ...p,
            price: parseFloat(p.price),
            stock: parseInt(p.stock),
            cost_price: parseFloat(p.cost_price || 0),
            manage_stock: p.manage_stock == 1,
            stocks: existingStocks,
            track_cogs: parseFloat(p.cost_price) > 0,
            is_ecommerce: p.is_ecommerce == 1,
            is_preorder: p.is_preorder == 1,
            preorder_duration: p.preorder_duration ? parseInt(p.preorder_duration) : 7,
            variants: p.variants ? p.variants.map(v => ({
                ...v,
                cost_price: parseFloat(v.cost_price || 0),
                track_cogs: v.track_cogs == 1,
                // Ensure logistics exist
                weight: v.weight || p.weight || 0,
                length: v.length || p.length || 0,
                width: v.width || p.width || 0,
                height: v.height || p.height || 0
            })) : [] 
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;
        setLoading(true);
        try { await productsAPI.delete(id); await loadData(); } 
        catch (e) { alert("Gagal hapus."); } 
        finally { setLoading(false); }
    };

    const handleUpload = async (e, field, loadingSetter) => {
        const file = e.target.files[0];
        if (!file) return;
        loadingSetter(true);
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            const res = await api.post('/tenant/upload', uploadData, { headers: {'Content-Type': 'multipart/form-data'} });
            if (res.data.success) setFormData(prev => ({ ...prev, [field]: res.data.url }));
        } catch (err) { alert("Gagal upload."); }
        finally { loadingSetter(false); }
    };

    const handleStockChange = (outletId, field, value) => {
        const newStocks = formData.stocks.map(s => {
            if (s.outlet_id === outletId) {
                const numVal = value === "" ? 0 : parseInt(value);
                return { ...s, [field]: isNaN(numVal) ? 0 : numVal };
            }
            return s;
        });
        setFormData(prev => ({ ...prev, stocks: newStocks }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const totalStock = formData.manage_stock ? formData.stocks.reduce((acc, curr) => acc + curr.qty, 0) : 0;
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                stock: totalStock,
                stocks: formData.stocks,
                cost_price: parseFloat(formData.cost_price) || 0,
                manage_stock: formData.manage_stock ? 1 : 0,
                is_ecommerce: formData.is_ecommerce ? 1 : 0,
                is_preorder: formData.is_preorder ? 1 : 0,
                variants: formData.variants.map(v => ({
                    ...v,
                    cost_price: parseFloat(v.cost_price || 0),
                    track_cogs: v.track_cogs ? 1 : 0,
                    weight: parseInt(v.weight || 0),
                    length: parseInt(v.length || 0),
                    width: parseInt(v.width || 0),
                    height: parseInt(v.height || 0),
                }))
            };
            
            if (editMode) await productsAPI.update(currentProductId, payload);
            else await productsAPI.create(payload);
            
            setShowModal(false); loadData();
        } catch (err) { alert("Gagal menyimpan: " + (err.response?.data?.message || err.message)); } 
        finally { setIsSubmitting(false); }
    };

    // --- VARIANT HANDLERS ---
    const openAddVariant = () => { 
        setTempVariant({ name: "", price: formData.price || 0, sku: "", stock: 0 }); 
        setSubModal('variant'); 
    };
    
    const saveVariant = () => { 
        if (!tempVariant.name) return alert("Nama varian wajib diisi"); 
        setFormData(prev => ({ 
            ...prev, 
            has_variants: true, 
            variants: [...prev.variants, { 
                ...tempVariant, 
                price: parseFloat(tempVariant.price) || 0,
                // Logic COGS
                cost_price: parseFloat(formData.cost_price) || 0, 
                track_cogs: formData.track_cogs,
                // Logic Online/Logistics (Inherit from global if creating new)
                weight: formData.weight || 0,
                length: formData.length || 0,
                width: formData.width || 0,
                height: formData.height || 0
            }] 
        })); 
        setSubModal(null); 
    };
    
    const removeVariant = (idx) => { 
        const newVars = [...formData.variants]; 
        newVars.splice(idx, 1); 
        setFormData(prev => ({ 
            ...prev, 
            variants: newVars, 
            has_variants: newVars.length > 0 
        })); 
    };

    // Handler universal untuk update field varian
    const updateVariant = (idx, field, value) => {
        const newVars = [...formData.variants];
        newVars[idx] = { ...newVars[idx], [field]: value };
        setFormData(prev => ({ ...prev, variants: newVars }));
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Item Library" subtitle="Manajemen produk dan stok" />
            
            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]" value={filterOutlet} onChange={e=>setFilterOutlet(e.target.value)}>
                                <option value="all">Semua Outlet</option>
                                {outlets.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
                                <option value="all">Semua Kategori</option>
                                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari produk..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                        </div>
                        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18}/> <span className="hidden md:inline">Produk Baru</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-4">Product</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-center">Global Stock</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-bold flex items-center gap-3 text-gray-800">
                                        {p.image_url ? <img src={p.image_url} className="w-9 h-9 rounded object-cover bg-gray-100 border" /> : <div className="w-9 h-9 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">IMG</div>}
                                        {p.name}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{categories.find(c=>c.id==p.category_id)?.name || '-'}</td>
                                    <td className="p-4 text-right font-mono text-sm">Rp {parseInt(p.price).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        {p.manage_stock == 1 ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock <= p.stock_alert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenEdit(p)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MAIN MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 bg-white border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">{editMode ? 'Edit Produk' : 'Produk Baru'}</h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-gray-100 p-2 rounded-full text-gray-500"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            <form id="main-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    
                                {/* LEFT COLUMN */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-2">Informasi Dasar</h3>
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 bg-gray-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer relative group overflow-hidden hover:border-blue-400 transition-colors">
                                                {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                                                <span className="text-[10px] mt-1">Upload</span>
                                                <input type="file" onChange={(e) => handleUpload(e, 'image_url', setUploadingPOS)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                {uploadingPOS && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader className="animate-spin text-blue-500"/></div>}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk *</label>
                                                    <input className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required placeholder="Contoh: Kopi Susu Gula Aren"/>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Kategori</label>
                                                        <select className="w-full border rounded-lg px-3 py-2 bg-white text-sm outline-none" value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})}>
                                                            <option value="">Tanpa Kategori</option>
                                                            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Brand</label>
                                                        <select className="w-full border rounded-lg px-3 py-2 bg-white text-sm outline-none" value={formData.brand_id} onChange={e=>setFormData({...formData, brand_id: e.target.value})}>
                                                            <option value="">Tanpa Brand</option>
                                                            {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi</label>
                                            <textarea className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" rows="2" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
                                        </div>
                                    </div>

                                    {/* --- ONLINE / DELIVERY ORDER (UPDATED WITH VARIANT TABLE) --- */}
                                    <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                Online / Delivery Order
                                                {formData.is_ecommerce && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">Active</span>}
                                            </h3>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={formData.is_ecommerce} onChange={e=>setFormData({...formData, is_ecommerce: e.target.checked})} className="sr-only peer" />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        
                                        {formData.is_ecommerce && (
                                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 border-t border-dashed">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Kondisi</label>
                                                        <select className="w-full border rounded-lg px-3 py-2 bg-white text-sm" value={formData.condition} onChange={e=>setFormData({...formData, condition: e.target.value})}>
                                                            <option value="New">Baru</option><option value="Used">Bekas</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* GLOBAL WEIGHT (Show only if NO variants) */}
                                                    {!formData.has_variants && (
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-700 mb-1">Berat (Gram)</label>
                                                            <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.weight} onChange={e=>setFormData({...formData, weight: e.target.value})} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* GLOBAL DIMENSION (Show only if NO variants) */}
                                                {!formData.has_variants && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Dimensi (PxLxT) cm</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <input type="number" placeholder="P" className="border rounded-lg px-3 py-2 text-sm" value={formData.length} onChange={e=>setFormData({...formData, length: e.target.value})} />
                                                            <input type="number" placeholder="L" className="border rounded-lg px-3 py-2 text-sm" value={formData.width} onChange={e=>setFormData({...formData, width: e.target.value})} />
                                                            <input type="number" placeholder="T" className="border rounded-lg px-3 py-2 text-sm" value={formData.height} onChange={e=>setFormData({...formData, height: e.target.value})} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- VARIANT LOGISTICS TABLE (NEW) --- */}
                                                {formData.has_variants && (
                                                    <div className="border rounded-lg overflow-hidden bg-gray-50/50">
                                                        <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 flex items-center gap-2 border-b">
                                                            <Truck size={14}/> Pengaturan Logistik per Varian
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs text-left">
                                                                <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                                                                    <tr>
                                                                        <th className="py-2 pl-3">Variant</th>
                                                                        <th className="py-2 w-24">Berat (g)</th>
                                                                        <th className="py-2 pl-2">Dimensi (PxLxT)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y">
                                                                    {formData.variants.map((v, i) => (
                                                                        <tr key={i} className="bg-white">
                                                                            <td className="py-2 pl-3 font-medium text-gray-700">{v.name}</td>
                                                                            <td className="py-2">
                                                                                <input 
                                                                                    type="number" 
                                                                                    value={v.weight} 
                                                                                    onChange={(e) => updateVariant(i, 'weight', e.target.value)}
                                                                                    className="w-20 border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                                                                    placeholder="0"
                                                                                />
                                                                            </td>
                                                                            <td className="py-2 pl-2 pr-3">
                                                                                <div className="flex gap-1">
                                                                                    <input type="number" placeholder="P" className="w-12 border rounded px-1 py-1 text-center" value={v.length} onChange={(e) => updateVariant(i, 'length', e.target.value)} />
                                                                                    <input type="number" placeholder="L" className="w-12 border rounded px-1 py-1 text-center" value={v.width} onChange={(e) => updateVariant(i, 'width', e.target.value)} />
                                                                                    <input type="number" placeholder="T" className="w-12 border rounded px-1 py-1 text-center" value={v.height} onChange={(e) => updateVariant(i, 'height', e.target.value)} />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Pre-Order Logic */}
                                                <div className="block text-xs font-bold text-gray-700 mb-1 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                        <input type="checkbox" checked={formData.is_preorder} onChange={e=>setFormData({...formData, is_preorder: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500"/>
                                                        <span className="block text-xs font-bold text-gray-700 mb-1">Aktifkan Pre-Order</span>
                                                    </label>
                                                    
                                                    {formData.is_preorder && (
                                                        <div className="pl-6 animate-in fade-in slide-in-from-top-1">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Estimasi Waktu (Hari):</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {[7, 14, 30].map(day => (
                                                                    <button 
                                                                        key={day}
                                                                        type="button"
                                                                        onClick={() => setFormData({...formData, preorder_duration: day})}
                                                                        className={`px-3 py-1 text-xs border rounded-full transition-colors ${
                                                                            formData.preorder_duration === day 
                                                                            ? 'bg-blue-600 text-white border-blue-600' 
                                                                            : 'bg-white text-gray-600 hover:bg-blue-50'
                                                                        }`}
                                                                    >
                                                                        {day} Hari
                                                                    </button>
                                                                ))}
                                                                <div className="relative flex items-center ml-2">
                                                                    <input 
                                                                        type="number" 
                                                                        placeholder="Custom" 
                                                                        className={`w-20 px-2 py-1 text-xs border rounded-md outline-none focus:ring-1 focus:ring-blue-500 ${
                                                                            ![7,14,30].includes(formData.preorder_duration) && formData.preorder_duration > 0 ? 'border-blue-500 bg-white' : ''
                                                                        }`}
                                                                        value={![7,14,30].includes(formData.preorder_duration) ? formData.preorder_duration : ''}
                                                                        onChange={(e) => setFormData({...formData, preorder_duration: parseInt(e.target.value) || 0})}
                                                                    />
                                                                    <span className="ml-1 text-xs text-gray-500">Hari</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center bg-gray-50 relative group">
                                                    {formData.online_image_url ? <img src={formData.online_image_url} className="h-32 object-contain mb-2" /> : <Package size={32} className="text-gray-400 mb-2"/>}
                                                    <span className="text-xs text-blue-600 font-bold">Upload Gambar Khusus Online</span>
                                                    <input type="file" onChange={(e) => handleUpload(e, 'online_image_url', setUploadingOnline)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    {uploadingOnline && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader className="animate-spin text-blue-500"/></div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* INVENTORY */}
                                    <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inventory</h3>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={formData.manage_stock} onChange={e=>setFormData({...formData, manage_stock: e.target.checked})} className="sr-only peer" />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        
                                        {formData.manage_stock && (
                                            <div className="space-y-3 animate-in slide-in-from-top-2">
                                                <button type="button" onClick={()=>setSubModal('inventory')} className="w-full py-2.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 transition-colors">
                                                    <CheckCircle size={16}/> Kelola Stok
                                                </button>
                                                <div className="text-[10px] text-gray-500 text-center bg-gray-50 p-2 rounded">Total Stok Global: <span className="font-bold text-gray-800">{formData.stocks.reduce((a,b)=>a+b.qty,0)}</span></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div className="space-y-4">
                                    <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-2">Harga & Varian</h3>
                                        {!formData.has_variants && (
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Harga Jual (Rp)</label>
                                                    <input type="number" className="w-full border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} />
                                                </div>
                                                <div className="w-1/3">
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">SKU</label>
                                                    <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} />
                                                </div>
                                            </div>
                                        )}
                                        {formData.variants.length > 0 && (
                                            <div className="border rounded-lg overflow-hidden mb-2">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-gray-50 text-gray-500"><tr><th className="p-2">Varian</th><th className="p-2">Harga</th><th className="p-2">SKU</th><th className="p-2 text-right"></th></tr></thead>
                                                    <tbody className="divide-y">{formData.variants.map((v,i)=>(<tr key={i}><td className="p-2 font-medium">{v.name}</td><td className="p-2">{v.price}</td><td className="p-2">{v.sku}</td><td className="p-2 text-right"><button type="button" onClick={()=>removeVariant(i)} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button></td></tr>))}</tbody>
                                                </table>
                                            </div>
                                        )}
                                        <button type="button" onClick={openAddVariant} className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50 text-xs transition-colors">+ Tambah Varian</button>
                                    </div>

                                    {/* --- MANAGE COGS --- */}
                                    <div className="bg-white p-5 rounded-lg border shadow-sm space-y-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-2">Manage Cost of Goods Sold (COGS)</h3>
                                        
                                        {!formData.has_variants ? (
                                            // Single Product COGS Layout
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">HPP Rata-rata (Avg Cost)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-2 text-gray-500 text-xs">Rp</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-full border rounded-lg pl-8 pr-3 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                                                            value={formData.cost_price} 
                                                            onChange={e=>setFormData({...formData, cost_price: e.target.value})} 
                                                        />
                                                    </div>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded border border-gray-100">
                                                    <input type="checkbox" checked={formData.track_cogs} onChange={e=>setFormData({...formData, track_cogs: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500"/>
                                                    <span className="text-xs text-gray-700 font-medium">Lacak HPP otomatis (Track COGS)</span>
                                                </label>
                                            </>
                                        ) : (
                                            // Variant Product COGS Layout (Table)
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                                                        <tr>
                                                            <th className="py-2 pl-2">Variant</th>
                                                            <th className="py-2 text-center">Track COGS</th>
                                                            <th className="py-2 pr-2">Avg Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {formData.variants.map((v, i) => (
                                                            <tr key={i}>
                                                                <td className="py-2 pl-2 font-medium text-gray-700">{v.name}</td>
                                                                <td className="py-2 text-center">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={v.track_cogs} 
                                                                        onChange={(e) => updateVariant(i, 'track_cogs', e.target.checked)}
                                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2">
                                                                    <div className="relative w-24 ml-auto">
                                                                        <span className="absolute left-2 top-1.5 text-gray-400 text-[10px]">Rp</span>
                                                                        <input 
                                                                            type="number" 
                                                                            value={v.cost_price} 
                                                                            onChange={(e) => updateVariant(i, 'cost_price', e.target.value)}
                                                                            className="w-full border rounded px-2 pl-6 py-1 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-md text-[10px] text-blue-700 mt-2">
                                            <Info size={14} className="mt-0.5 shrink-0"/>
                                            <p>*Use the <span className="font-bold underline cursor-pointer"><Link to={`../inventory/po`}>Purchase Order page</Link></span> to manage Avg Cost accurately based on stock intake.</p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t bg-white flex justify-end gap-3">
                            <button onClick={()=>setShowModal(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors">Batal</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2">
                                {isSubmitting && <Loader className="animate-spin" size={14}/>} Simpan Produk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUB MODALS --- */}

            {/* 1. INVENTORY MANAGEMENT MODAL */}
            {subModal === 'inventory' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Store size={18} className="text-blue-600"/> Kelola Stok Outlet
                            </h3>
                            <button onClick={() => setSubModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                            {formData.stocks.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-sm">Tidak ada outlet yang tersedia.</p>
                            ) : (
                                formData.stocks.map((stock) => (
                                    <div key={stock.outlet_id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-700 text-sm">{stock.name}</p>
                                            <p className="text-[10px] text-gray-500">Stok saat ini: {stock.qty}</p>
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jumlah</label>
                                            <input 
                                                type="number" 
                                                className="w-full border rounded px-2 py-1.5 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={stock.qty}
                                                onChange={(e) => handleStockChange(stock.outlet_id, 'qty', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Alert</label>
                                            <input 
                                                type="number" 
                                                className="w-full border rounded px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-red-500 outline-none bg-red-50 text-red-600"
                                                value={stock.alert}
                                                onChange={(e) => handleStockChange(stock.outlet_id, 'alert', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                            <button 
                                onClick={() => setSubModal(null)} 
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. VARIANT MANAGEMENT MODAL */}
            {subModal === 'variant' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-800">Tambah Varian Baru</h3>
                            <button onClick={() => setSubModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Varian <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Contoh: Merah, XL, Pedas"
                                    value={tempVariant.name}
                                    onChange={(e) => setTempVariant({...tempVariant, name: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Harga Tambahan/Khusus</label>
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={tempVariant.price}
                                        onChange={(e) => setTempVariant({...tempVariant, price: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">SKU Varian</label>
                                    <input 
                                        type="text" 
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={tempVariant.sku}
                                        onChange={(e) => setTempVariant({...tempVariant, sku: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setSubModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors">Batal</button>
                            <button 
                                onClick={saveVariant} 
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                                disabled={!tempVariant.name}
                            >
                                Tambahkan Varian
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}