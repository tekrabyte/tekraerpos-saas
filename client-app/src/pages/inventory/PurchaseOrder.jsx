import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
    Search, Plus, Calendar, Store, Trash2, 
    ShoppingCart, Loader, FileText, User 
} from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';

export default function PurchaseOrder() {
    // --- STATE ---
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    
    // Master Data
    const [outlets, setOutlets] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    // --- FORM STATE ---
    const [formData, setFormData] = useState({ 
        outlet_id: '', supplier_id: '', date: '', notes: '', items: [] 
    });
    const [newItem, setNewItem] = useState({ product_id: '', qty: 1, cost: 0 });

    // --- FILTERS ---
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- LOAD DATA ---
    useEffect(() => {
        async function init() {
            try {
                const [resOutlets, resSuppliers, resProd] = await Promise.all([
                    api.get('/tenant/outlets'),
                    api.get('/tenant/data/suppliers'),
                    api.get('/tenant/products')
                ]);
                setOutlets(resOutlets.data.outlets || []);
                setSuppliers(resSuppliers.data.data || []);
                setProducts(resProd.data.products || []);
            } catch (e) { console.error(e); }
        }
        init();
    }, []);

    useEffect(() => { loadPOs(); }, [filterOutlet, dateRange]);

    useEffect(() => {
        if (search) {
            const lower = search.toLowerCase();
            setFilteredData(data.filter(i => 
                (i.id && i.id.toString().includes(lower)) ||
                (suppliers.find(s => s.id == i.supplier_id)?.name || '').toLowerCase().includes(lower)
            ));
        } else { setFilteredData(data); }
    }, [search, data, suppliers]);

    const loadPOs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/data/purchase_orders', { 
                params: { 
                    outlet_id: filterOutlet !== 'all' ? filterOutlet : '',
                    start_date: dateRange.start,
                    end_date: dateRange.end
                } 
            });
            const poData = res.data.data || [];
            setData(poData);
            setFilteredData(poData);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    // --- HANDLERS ---
    const handleOpenAdd = () => {
        const initialOutlet = filterOutlet !== 'all' ? filterOutlet : (outlets[0]?.id || '');
        const today = new Date().toISOString().split('T')[0];
        
        setFormData({ 
            outlet_id: initialOutlet, 
            supplier_id: '', 
            date: today, 
            notes: '', 
            items: [] 
        });
        setShowModal(true);
    };

    const handleAddItem = () => {
        if (!newItem.product_id) return alert("Pilih produk!");
        const product = products.find(p => p.id == newItem.product_id);
        
        // Cek harga modal default jika cost 0
        const costPrice = newItem.cost > 0 ? newItem.cost : (product.cost_price || 0);

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { 
                ...newItem, 
                name: product.name, 
                cost: parseFloat(costPrice) 
            }]
        }));
        setNewItem({ product_id: '', qty: 1, cost: 0 }); 
    };

    const handleRemoveItem = (idx) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) return alert("Minimal 1 item!");
        
        setIsSubmitting(true);
        try {
            // Hitung total otomatis
            const total = formData.items.reduce((acc, i) => acc + (i.qty * i.cost), 0);
            const payload = { ...formData, total, status: 'pending' };

            await api.post('/tenant/data/purchase_orders', payload);
            setShowModal(false); 
            loadPOs();
        } catch (e) { alert("Gagal membuat PO."); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Purchase Order" subtitle="Pembelian stok ke supplier" />

            {/* HEADER ACTIONS & FILTER */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    {/* KIRI: Filters */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]"
                                value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}>
                                <option value="all">Semua Outlet</option>
                                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                            <Calendar size={16} className="text-gray-400 mr-2" />
                            <input type="date" className="text-sm border-none outline-none text-gray-600 cursor-pointer"
                                value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                            <span className="text-gray-400 mx-2 text-xs">-</span>
                            <input type="date" className="text-sm border-none outline-none text-gray-600 cursor-pointer"
                                value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                        </div>
                    </div>

                    {/* KANAN: Search & Add */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari Supplier / ID..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18}/> <span className="hidden md:inline">Buat PO</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* TABLE */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Supplier</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center"><Loader className="animate-spin inline text-blue-600 mr-2" size={20}/> Memuat data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada PO.</td></tr>
                            ) : (
                                filteredData.map(i => (
                                    <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-gray-600">{i.date}</td>
                                        <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                                            <User size={14} className="text-gray-400"/>
                                            {suppliers.find(s=>s.id == i.supplier_id)?.name || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">{outlets.find(o=>o.id == i.outlet_id)?.name || '-'}</td>
                                        <td className="p-4 text-right font-mono font-bold text-blue-600">Rp {parseInt(i.total || 0).toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                i.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                i.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {i.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREATE PO */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Order" size="lg">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Pilih Outlet" name="outlet_id" type="select" options={outlets.map(o => ({value: o.id, label: o.name}))} value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})} required 
                            disabled={filterOutlet !== 'all'} 
                        />
                        <FormField label="Supplier" name="supplier_id" type="select" options={suppliers.map(s => ({value: s.id, label: s.name}))} value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} required />
                    </div>
                    <FormField label="Tanggal" name="date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                    
                    {/* Item Selector */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ShoppingCart size={14}/> Tambah Item Belanja</h4>
                        
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1">
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={newItem.product_id} onChange={e => setNewItem({...newItem, product_id: e.target.value})}
                                >
                                    <option value="">-- Pilih Produk --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <input type="number" placeholder="Qty" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center outline-none" 
                                value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} min="1" />
                            <input type="number" placeholder="Harga Beli (Cost)" className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right outline-none" 
                                value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} />
                            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Add</button>
                        </div>

                        {formData.items.length > 0 && (
                            <div className="bg-white border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-xs uppercase text-gray-500 font-bold text-left sticky top-0">
                                        <tr>
                                            <th className="p-3">Item</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Cost</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {formData.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 text-gray-700">{item.name}</td>
                                                <td className="p-3 text-right font-bold">{item.qty}</td>
                                                <td className="p-3 text-right font-mono">{parseInt(item.cost).toLocaleString()}</td>
                                                <td className="p-3 text-right font-mono font-bold">{(item.qty * item.cost).toLocaleString()}</td>
                                                <td className="p-3 text-center"><button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-bold border-t">
                                        <tr>
                                            <td colSpan="3" className="p-3 text-right">Total Perkiraan:</td>
                                            <td className="p-3 text-right font-mono">
                                                {formData.items.reduce((acc, i) => acc + (i.qty * i.cost), 0).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <FormField label="Catatan" name="notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />

                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold mr-2">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70">
                            {isSubmitting && <Loader className="animate-spin" size={16} />} Buat PO
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}