import React, { useEffect, useState } from "react";
import productsAPI from "../../api/products";
import api from "../../api/client";
import { 
    X, Edit, Trash2, Plus, Package, Search, ChevronDown, 
    Image as ImageIcon, AlertTriangle, Lock, CheckCircle, Loader, Store
} from "lucide-react";
// import Modal from "../../components/Modal"; 

export default function ProductList() {
    // --- STATE ---
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [outlets, setOutlets] = useState([]); // STATE OUTLETS
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- UPLOAD STATE ---
    const [uploadingPOS, setUploadingPOS] = useState(false);
    const [uploadingOnline, setUploadingOnline] = useState(false);

    // --- FILTERS ---
    const [filterCategory, setFilterCategory] = useState("0");
    const [filterOutlet, setFilterOutlet] = useState("0"); // FILTER OUTLET
    const [searchQuery, setSearchQuery] = useState("");

    // --- FORM STATE ---
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProductId, setCurrentProductId] = useState(null);
    
    const defaultForm = {
        name: "", category_id: "", brand_id: "", description: "", image_url: "",
        // Moka Order / Online
        is_ecommerce: false, condition: 'New', weight: 0, length: 0, width: 0, height: 0, is_preorder: false, online_image_url: "",
        // Pricing
        price: "", sku: "", has_variants: false, variants: [],
        // Inventory & Cost
        manage_stock: false,
        stocks: [], // ARRAY MULTI OUTLET STOCK
        cost_price: 0, track_cogs: false
    };
    const [formData, setFormData] = useState(defaultForm);

    // --- SUB MODALS ---
    const [subModal, setSubModal] = useState(null); // 'inventory', 'cost', 'variant'
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
                api.get('/tenant/outlets') // FETCH OUTLETS
            ]);
            setProducts(prodRes.data.products || []);
            setFilteredProducts(prodRes.data.products || []);
            setCategories(catRes.data.data || []);
            setBrands(brandRes.data.data || []);
            setOutlets(outletRes.data.outlets || []);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    }

    // --- FILTER LOGIC ---
    useEffect(() => {
        let result = products;
        if (filterCategory !== "0") result = result.filter(p => p.category_id == filterCategory);
        
        // Simulasi Filter Outlet (jika data produk punya relasi outlet)
        // Saat ini filter outlet hanya visual karena data stok detail mungkin belum di-load di list utama
        
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(lower) || (p.sku && p.sku.toLowerCase().includes(lower)));
        }
        setFilteredProducts(result);
    }, [products, filterCategory, filterOutlet, searchQuery]);

    // --- HANDLERS ---
    const handleOpenAdd = () => {
        setEditMode(false);
        // Initialize stocks kosong untuk semua outlet yang tersedia
        const initialStocks = outlets.map(o => ({ 
            outlet_id: o.id, 
            name: o.name, 
            qty: 0, 
            alert: 5 
        }));
        
        setFormData({ ...defaultForm, stocks: initialStocks });
        setShowModal(true);
    };

    const handleOpenEdit = (p) => {
        setEditMode(true);
        setCurrentProductId(p.id);
        
        // Mapping stok existing ke format multi-outlet
        // (Logic sementara: Jika backend belum kirim detail stok per outlet, set 0 atau global stock ke outlet pertama)
        const existingStocks = outlets.map(o => ({
            outlet_id: o.id,
            name: o.name,
            // Cek jika p.stocks ada (dari backend), jika tidak pakai logika fallback
            qty: (p.stocks && p.stocks[o.id]) ? p.stocks[o.id] : 0, 
            alert: parseInt(p.stock_alert || 5)
        }));

        setFormData({
            ...p,
            price: parseFloat(p.price),
            stock: parseInt(p.stock),
            cost_price: parseFloat(p.cost_price || 0),
            manage_stock: p.manage_stock == 1,
            stocks: existingStocks, // Set stok per outlet
            track_cogs: parseFloat(p.cost_price) > 0,
            is_ecommerce: p.is_ecommerce == 1,
            is_preorder: p.is_preorder == 1,
            variants: p.variants || [] 
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin ingin menghapus produk ini?")) return;
        try {
            setLoading(true);
            await productsAPI.delete(id);
            await loadData(); 
        } catch (e) {
            alert("Gagal menghapus produk: " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
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

    // Helper untuk update stok di modal inventory
    const handleStockChange = (outletId, field, value) => {
        const newStocks = formData.stocks.map(s => {
            if (s.outlet_id === outletId) {
                return { ...s, [field]: parseInt(value) || 0 };
            }
            return s;
        });
        setFormData(prev => ({ ...prev, stocks: newStocks }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Hitung Total Stok Global
            const totalStock = formData.manage_stock 
                ? formData.stocks.reduce((acc, curr) => acc + curr.qty, 0) 
                : 0;

            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                stock: totalStock, // Simpan total stok ke field global 'stock'
                stocks: formData.stocks, // Kirim detail stok per outlet (untuk diproses backend jika support)
                cost_price: parseFloat(formData.cost_price) || 0,
                manage_stock: formData.manage_stock ? 1 : 0,
                is_ecommerce: formData.is_ecommerce ? 1 : 0,
                is_preorder: formData.is_preorder ? 1 : 0
            };
            
            if (editMode) {
                await productsAPI.update(currentProductId, payload);
            } else {
                await productsAPI.create(payload);
            }
            
            setShowModal(false);
            loadData();
       } catch (err) {
            console.error(err);
            alert("Gagal menyimpan: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAddVariant = () => { setTempVariant({ name: "", price: formData.price, sku: "", stock: 0 }); setSubModal('variant'); };
    const saveVariant = () => { if (!tempVariant.name) return alert("Nama varian wajib diisi"); setFormData(prev => ({ ...prev, has_variants: true, variants: [...prev.variants, tempVariant] })); setSubModal(null); };
    const removeVariant = (idx) => { const newVars = [...formData.variants]; newVars.splice(idx, 1); setFormData(prev => ({ ...prev, variants: newVars, has_variants: newVars.length > 0 })); };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Item Library</h1>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 px-3 py-1.5 rounded text-gray-600 text-sm font-medium">Total: {filteredProducts.length} Items</div>
                    <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700"><Plus size={18}/> Create Item</button>
                </div>
            </div>
            
            {/* Filter */}
            <div className="bg-gray-50 border-b px-6 py-3 flex gap-3">
                {/* Filter Outlet */}
                <div className="relative">
                    <Store className="absolute left-2 top-2 text-gray-400" size={16} />
                    <select className="border rounded pl-8 pr-3 py-1.5 text-sm outline-none appearance-none bg-white" value={filterOutlet} onChange={e=>setFilterOutlet(e.target.value)}>
                        <option value="0">Semua Outlet</option>
                        {outlets.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>

                <select className="border rounded px-3 py-1.5 text-sm outline-none" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
                    <option value="0">All Categories</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex-1 relative">
                    <Search className="absolute left-2 top-2 text-gray-400" size={16} />
                    <input className="w-full pl-8 pr-3 py-1.5 border rounded text-sm outline-none" placeholder="Search items..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border overflow-hidden">
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
                        <tbody className="divide-y">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-blue-50">
                                    <td className="p-4 font-bold flex items-center gap-3">
                                        {p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded object-cover bg-gray-100" /> : <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs">IMG</div>}
                                        {p.name}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{categories.find(c=>c.id==p.category_id)?.name || '-'}</td>
                                    <td className="p-4 text-right font-mono">Rp {parseInt(p.price).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        {p.manage_stock == 1 ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock <= p.stock_alert ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {p.stock}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleOpenEdit(p)} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                                                <Edit size={14}/> Edit
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="text-red-600 font-bold text-sm hover:underline flex items-center gap-1">
                                                <Trash2 size={14}/> Del
                                            </button>
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
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
                        
                        {/* HEADER BIRU */}
                        <div className="px-6 py-4 bg-[#0091EA] flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold">{editMode ? 'Edit Item' : 'Create Item'}</h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 space-y-6">
                            <form id="main-form" onSubmit={handleSubmit}>

                            {/* 1. GENERAL INFORMATION */}
                            <div className="bg-white p-5 rounded border shadow-sm space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">GENERAL INFORMATION</h3>
                                <div className="flex gap-6">
                                    <div className="w-28 h-28 bg-gray-50 border-2 border-dashed rounded flex flex-col items-center justify-center text-gray-400 cursor-pointer relative group overflow-hidden">
                                        {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <ImageIcon />}
                                        <span className="text-[10px] mt-1">Image for POS</span>
                                        <input type="file" onChange={(e) => handleUpload(e, 'image_url', setUploadingPOS)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {uploadingPOS && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader className="animate-spin text-blue-500"/></div>}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Product Name *</label>
                                            <input className="w-full border rounded px-3 py-2 focus:border-blue-500 outline-none" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                                                <select className="w-full border rounded px-3 py-2 bg-white" value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})}>
                                                    <option value="">Uncategorized</option>
                                                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Brand</label>
                                                <select className="w-full border rounded px-3 py-2 bg-white" value={formData.brand_id} onChange={e=>setFormData({...formData, brand_id: e.target.value})}>
                                                    <option value="">Unbranded</option>
                                                    {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                                            <textarea className="w-full border rounded px-3 py-2" rows="2" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. MOKA ORDER */}
                            <div className="bg-white rounded border shadow-sm overflow-hidden mt-4">
                                <div className="px-5 py-3 border-b flex justify-between items-center bg-gray-50">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase">MOKA ORDER SELF PICKUP & DELIVERY</h3>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.is_ecommerce} onChange={e=>setFormData({...formData, is_ecommerce: e.target.checked})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0091EA]"></div>
                                    </label>
                                </div>
                                {formData.is_ecommerce && (
                                    <div className="p-5 space-y-4 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Condition *</label>
                                                <select className="w-full border rounded px-3 py-2 bg-white" value={formData.condition} onChange={e=>setFormData({...formData, condition: e.target.value})}>
                                                    <option value="New">New</option><option value="Used">Used</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Weight (gr) *</label>
                                                <input type="number" className="w-full border rounded px-3 py-2" value={formData.weight} onChange={e=>setFormData({...formData, weight: e.target.value})} />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Dimension (L x W x H) cm *</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                <input type="number" placeholder="Length" className="border rounded px-3 py-2" value={formData.length} onChange={e=>setFormData({...formData, length: e.target.value})} />
                                                <input type="number" placeholder="Width" className="border rounded px-3 py-2" value={formData.width} onChange={e=>setFormData({...formData, width: e.target.value})} />
                                                <input type="number" placeholder="Height" className="border rounded px-3 py-2" value={formData.height} onChange={e=>setFormData({...formData, height: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label className="block text-xs font-bold text-gray-600">Pre-Order?</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={!formData.is_preorder} onChange={()=>setFormData({...formData, is_preorder: false})} /> <span className="text-sm">No</span></label>
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={formData.is_preorder} onChange={()=>setFormData({...formData, is_preorder: true})} /> <span className="text-sm">Yes</span></label>
                                            </div>
                                        </div>

                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center bg-gray-50 relative group">
                                            {formData.online_image_url && <img src={formData.online_image_url} className="h-32 object-contain mb-2" />}
                                            <button type="button" className="px-4 py-2 border border-blue-600 text-blue-600 rounded font-bold text-xs uppercase pointer-events-none">Upload Product Image</button>
                                            <input type="file" onChange={(e) => handleUpload(e, 'online_image_url', setUploadingOnline)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            {uploadingOnline && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader className="animate-spin text-blue-500"/></div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3. PRICING & VARIANT */}
                            <div className="bg-white p-5 rounded border shadow-sm mt-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">PRICING</h3>
                                {!formData.has_variants && (
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Price</label>
                                            <input type="number" className="w-full border rounded px-3 py-2 text-right font-mono" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} />
                                        </div>
                                        <div className="w-1/3">
                                            <label className="block text-xs font-bold text-gray-600 mb-1">SKU</label>
                                            <input type="text" className="w-full border rounded px-3 py-2" value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} />
                                        </div>
                                    </div>
                                )}

                                {formData.variants.length > 0 && (
                                    <div className="mb-4 border rounded overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">SKU</th><th className="p-3 text-right">Action</th></tr></thead>
                                            <tbody className="divide-y">{formData.variants.map((v,i)=>(<tr key={i}><td className="p-3">{v.name}</td><td className="p-3">{v.price}</td><td className="p-3">{v.sku}</td><td className="p-3 text-right"><button type="button" onClick={()=>removeVariant(i)} className="text-red-500">Remove</button></td></tr>))}</tbody>
                                        </table>
                                    </div>
                                )}

                                <button type="button" onClick={openAddVariant} className="w-full py-2 bg-[#0091EA] text-white font-bold rounded hover:bg-blue-600 transition">Add Variant</button>
                            </div>

                            {/* 4. INVENTORY (MULTI OUTLET) */}
                            <div className="bg-white p-5 rounded border shadow-sm mt-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">INVENTORY</h3>
                                {!formData.manage_stock ? (
                                    <button type="button" onClick={()=>setSubModal('inventory')} className="w-full py-2 border border-[#0091EA] text-[#0091EA] font-bold rounded hover:bg-blue-50">
                                        Manage Inventory & Alerts
                                    </button>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-bold text-blue-800 flex items-center gap-2"><CheckCircle size={16}/> Stock Tracking Active</span>
                                            <button type="button" onClick={()=>setSubModal('inventory')} className="text-xs font-bold text-blue-600 hover:underline">Edit Stock</button>
                                        </div>
                                        
                                        {/* Summary Stock Multi Outlet */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {formData.stocks.map(s => (
                                                <div key={s.outlet_id} className="border p-2 rounded bg-gray-50 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-600 truncate w-24">{s.name}</span>
                                                    <span className="text-sm font-mono font-bold text-blue-600">{s.qty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 5. COST */}
                            <div className="bg-white p-5 rounded border shadow-sm mt-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">COST (HPP)</h3>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Average Cost</label>
                                        <input type="number" className="w-full border rounded px-3 py-2" value={formData.cost_price} onChange={e=>setFormData({...formData, cost_price: e.target.value})} />
                                    </div>
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer bg-gray-100 px-3 py-2 rounded border">
                                        <input type="checkbox" checked={formData.track_cogs} onChange={e=>setFormData({...formData, track_cogs: e.target.checked})} />
                                        <span className="text-xs font-bold text-gray-600">Track COGS</span>
                                    </label>
                                </div>
                            </div>
                            
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t bg-white flex justify-end gap-3">
                            <button onClick={()=>setShowModal(false)} className="px-6 py-2.5 border rounded text-gray-600 font-bold">Cancel</button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-[#0091EA] text-white rounded font-bold hover:bg-blue-600">{isSubmitting ? 'Saving...' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SUB MODAL: INVENTORY (MULTI OUTLET) --- */}
            {subModal === 'inventory' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-[#0091EA] px-4 py-3 text-white font-bold text-center">Manage Inventory</div>
                        
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <label className="font-bold text-sm text-gray-700">Enable Stock Tracking</label>
                            <input type="checkbox" checked={formData.manage_stock} onChange={e=>setFormData({...formData, manage_stock: e.target.checked})} className="w-5 h-5"/>
                        </div>
                        
                        {formData.manage_stock && (
                            <div className="flex-1 overflow-y-auto p-4 bg-white">
                                <div className="text-xs text-gray-500 mb-3 font-bold uppercase tracking-wider">Stock per Outlet</div>
                                <div className="space-y-3">
                                    {formData.stocks.map((stock, idx) => (
                                        <div key={stock.outlet_id} className="flex items-center gap-3 border p-2 rounded-lg shadow-sm">
                                            <div className="flex-1">
                                                <div className="font-bold text-sm text-gray-800">{stock.name}</div>
                                                <div className="text-[10px] text-gray-400">Outlet ID: {stock.outlet_id}</div>
                                            </div>
                                            <div className="w-20">
                                                <label className="text-[10px] text-gray-500 block mb-1">Qty</label>
                                                <input 
                                                    type="number" 
                                                    value={stock.qty} 
                                                    onChange={(e) => handleStockChange(stock.outlet_id, 'qty', e.target.value)}
                                                    className="w-full border rounded px-2 py-1 text-right font-mono text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="w-16">
                                                <label className="text-[10px] text-red-500 block mb-1">Alert</label>
                                                <input 
                                                    type="number" 
                                                    value={stock.alert} 
                                                    onChange={(e) => handleStockChange(stock.outlet_id, 'alert', e.target.value)}
                                                    className="w-full border border-red-200 rounded px-2 py-1 text-center text-sm text-red-600 focus:ring-1 focus:ring-red-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <button onClick={()=>setSubModal(null)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700">Done</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- SUB MODAL: COST --- */}
            {subModal === 'cost' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl overflow-hidden">
                        <div className="bg-[#0091EA] px-6 py-4 text-white font-bold text-center text-lg">Manage Cost (COGS)</div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Masukkan Harga Modal (HPP) rata-rata untuk produk ini. Sistem akan menghitung profit margin berdasarkan harga jual dikurangi COGS.
                            </p>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 text-sm">Rp</span>
                                <input type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full border border-gray-300 rounded pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center gap-2">
                            <button onClick={() => setSubModal(null)} className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold hover:bg-gray-50 text-sm">Cancel</button>
                            <button onClick={() => setSubModal(null)} className="px-6 py-2 bg-[#0091EA] text-white rounded font-bold hover:bg-blue-700 text-sm">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub Modal: Variant */}
            {subModal === 'variant' && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
                        <div className="bg-[#0091EA] px-4 py-3 text-white font-bold text-center">Add Variant</div>
                        <div className="p-6 space-y-4">
                            <input className="w-full border p-2 rounded" placeholder="Variant Name (e.g. Large)" value={tempVariant.name} onChange={e=>setTempVariant({...tempVariant, name: e.target.value})} autoFocus />
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-2 rounded" type="number" placeholder="Price" value={tempVariant.price} onChange={e=>setTempVariant({...tempVariant, price: e.target.value})} />
                                <input className="border p-2 rounded" placeholder="SKU" value={tempVariant.sku} onChange={e=>setTempVariant({...tempVariant, sku: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2"><button onClick={()=>setSubModal(null)} className="px-4 py-2 border rounded font-bold">Cancel</button><button onClick={saveVariant} className="px-4 py-2 bg-[#0091EA] text-white rounded font-bold">Confirm</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}