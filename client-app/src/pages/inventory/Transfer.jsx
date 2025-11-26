import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
    Plus, ArrowRightLeft, Trash2, Search, 
    Calendar, Store, Loader, FileText 
} from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';

export default function Transfer() {
    // --- STATE ---
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    
    const [outlets, setOutlets] = useState([]);
    const [products, setProducts] = useState([]); // Produk dinamis sesuai outlet sumber
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // --- FORM STATE ---
    const [formData, setFormData] = useState({ from_outlet: '', to_outlet: '', notes: '', items: [] });
    const [newItem, setNewItem] = useState({ product_id: '', qty: 1 });

    // --- FILTERS ---
    const [filterOutlet, setFilterOutlet] = useState("all"); // State Filter Utama
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- LOAD MASTER DATA (Outlets) ---
    useEffect(() => {
        async function init() {
            try {
                const res = await api.get('/tenant/outlets');
                setOutlets(res.data.outlets || []);
            } catch (e) { console.error(e); }
        }
        init();
    }, []);

    // --- LOAD TRANSACTIONS ---
    useEffect(() => { loadTransfers(); }, [filterOutlet, dateRange]);

    const loadTransfers = async () => {
        setLoading(true);
        try {
            const resTrans = await api.get('/tenant/data/stock_transfers', { 
                params: { 
                    outlet_id: filterOutlet !== 'all' ? filterOutlet : '',
                    start_date: dateRange.start,
                    end_date: dateRange.end
                } 
            });
            const transfers = resTrans.data.data || [];
            setData(transfers);
            setFilteredData(transfers);
        } catch (e) {} finally { setLoading(false); }
    };

    // Search Client Side
    useEffect(() => {
        if (search) {
            const lower = search.toLowerCase();
            setFilteredData(data.filter(i => 
                (i.id && i.id.toString().includes(lower)) ||
                (i.notes && i.notes.toLowerCase().includes(lower))
            ));
        } else { setFilteredData(data); }
    }, [search, data]);

    // --- LOGIC AUTO FETCH PRODUCT ---
    const fetchOutletProducts = async (outletId) => {
        if (!outletId) {
            setProducts([]);
            return;
        }
        try {
            const res = await api.get('/tenant/products', { params: { outlet_id: outletId } });
            setProducts(res.data.products || []);
        } catch (e) { 
            console.error("Gagal load produk", e); 
            setProducts([]); 
        }
    };

    // --- HANDLER MODAL (AUTO SELECT & READONLY) ---
    
    // 1. Cek apakah sedang memfilter outlet tertentu (bukan 'all')
    const isSourceLocked = filterOutlet !== 'all';

    // 2. Handler saat Modal Dibuka
    const handleOpenAdd = () => {
        // Jika filter aktif, gunakan itu sebagai sumber. Jika 'all', ambil outlet pertama.
        const initialOutlet = isSourceLocked ? filterOutlet : (outlets[0]?.id || '');
        
        setFormData({ 
            from_outlet: initialOutlet, 
            to_outlet: '', 
            notes: '', 
            items: [] 
        });
        
        // Fetch produk untuk outlet tersebut
        fetchOutletProducts(initialOutlet);
        setShowModal(true);
    };

    // 3. Handler saat Outlet Sumber diganti di Dropdown (hanya aktif jika tidak dilock)
    const handleSourceOutletChange = (e) => {
        const outletId = e.target.value;
        setFormData(prev => ({ 
            ...prev, 
            from_outlet: outletId, 
            items: [] // Reset keranjang karena ganti sumber
        }));
        fetchOutletProducts(outletId);
    };

    const handleAddItem = () => {
        if (!newItem.product_id) return alert("Pilih produk!");
        const product = products.find(p => p.id == newItem.product_id);
        
        // Validasi Stok
        if (product && parseInt(newItem.qty) > parseInt(product.stock)) {
            alert(`Stok tidak cukup! Sisa: ${product.stock}`);
            return;
        }

        const existingIdx = formData.items.findIndex(i => i.product_id === newItem.product_id);
        if (existingIdx >= 0) {
            const updatedItems = [...formData.items];
            updatedItems[existingIdx].qty = parseInt(updatedItems[existingIdx].qty) + parseInt(newItem.qty);
            setFormData({ ...formData, items: updatedItems });
        } else {
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, { ...newItem, name: product.name, current_stock: product.stock }]
            }));
        }
        setNewItem({ product_id: '', qty: 1 });
    };

    const handleRemoveItem = (idx) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.from_outlet || !formData.to_outlet) return alert("Pilih outlet asal dan tujuan");
        if (formData.from_outlet === formData.to_outlet) return alert("Asal dan Tujuan tidak boleh sama!");
        if (formData.items.length === 0) return alert("Minimal 1 item!");
        
        setIsSubmitting(true);
        try {
            const payload = { 
                ...formData, 
                date: new Date().toISOString().split('T')[0], 
                status: 'pending', 
                items_count: formData.items.length 
            };
            await api.post('/tenant/data/stock_transfers', payload);
            setShowModal(false); 
            loadTransfers();
        } catch (e) { alert("Gagal membuat transfer."); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Stock Transfer" subtitle="Pindahkan stok antar outlet/gudang" />

            {/* HEADER ACTIONS & FILTER */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    {/* KIRI: Filters */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {/* FILTER UTAMA (OUTLET) */}
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select 
                                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]"
                                value={filterOutlet} 
                                onChange={e => setFilterOutlet(e.target.value)}
                            >
                                <option value="all">Semua Outlet</option>
                                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>

                        {/* Date Filter */}
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
                            <input type="text" placeholder="Cari ID / Catatan..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18}/> <span className="hidden md:inline">Transfer Baru</span>
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
                                <th className="p-4">Rute Transfer</th>
                                <th className="p-4 text-center">Total Item</th>
                                <th className="p-4">Catatan</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center"><Loader className="animate-spin inline text-blue-600 mr-2" size={20}/> Memuat data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada data transfer.</td></tr>
                            ) : (
                                filteredData.map(i => (
                                    <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600 font-mono">
                                            {i.date} {i.id && <div className="text-[10px] text-gray-400">REF: #{i.id}</div>}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs border">{outlets.find(o=>o.id == i.from_outlet)?.name || i.from_outlet}</span>
                                                <ArrowRightLeft size={14} className="text-gray-400" />
                                                <span className="font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs border">{outlets.find(o=>o.id == i.to_outlet)?.name || i.to_outlet}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-gray-800">{i.items_count}</td>
                                        <td className="p-4 text-sm text-gray-500 truncate max-w-xs">{i.notes || '-'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${i.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
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

            {/* MODAL CREATE */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Buat Transfer Stok" size="lg">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 4. TERAPKAN DISABLED DISINI */}
                        <FormField 
                            label="Dari Outlet (Sumber)" 
                            name="from_outlet" 
                            type="select" 
                            options={outlets.map(o => ({value: o.id, label: o.name}))} 
                            value={formData.from_outlet} 
                            onChange={handleSourceOutletChange} 
                            required 
                            disabled={isSourceLocked} // <-- INI KUNCINYA
                        />
                        <FormField 
                            label="Ke Outlet (Tujuan)" 
                            name="to_outlet" 
                            type="select" 
                            options={outlets.map(o => ({value: o.id, label: o.name}))} 
                            value={formData.to_outlet} 
                            onChange={e => setFormData({...formData, to_outlet: e.target.value})} 
                            required 
                        />
                    </div>
                    
                    {formData.from_outlet ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><FileText size={14}/> Pilih Barang dari Sumber</h4>
                            
                            <div className="flex gap-2 mb-4">
                                <div className="flex-1">
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={newItem.product_id} onChange={e => setNewItem({...newItem, product_id: e.target.value})}
                                    >
                                        <option value="">-- Pilih Produk --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} disabled={parseInt(p.stock) <= 0}>
                                                {p.name} (Stok: {p.stock})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <input type="number" placeholder="Qty" className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-blue-500" 
                                    value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} min="1" 
                                />
                                <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Tambah</button>
                            </div>

                            {formData.items.length > 0 && (
                                <div className="bg-white border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-xs uppercase text-gray-500 font-bold text-left sticky top-0">
                                            <tr><th className="p-3">Nama Produk</th><th className="p-3 text-right">Jumlah</th><th className="p-3 w-10"></th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-3 text-gray-700">
                                                        {item.name} <span className="text-[10px] text-gray-400 ml-1">(Sisa: {item.current_stock - item.qty})</span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold">{item.qty}</td>
                                                    <td className="p-3 text-center"><button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-400 bg-gray-50 border border-dashed rounded-lg">Pilih Outlet Sumber terlebih dahulu.</div>
                    )}

                    <FormField label="Catatan Tambahan" name="notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    
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