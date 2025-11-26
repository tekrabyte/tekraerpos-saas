import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
    Plus, Search, Store, Loader, AlertTriangle 
} from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';
import PageHeader from '../../components/PageHeader';

export default function Adjustment() {
    // --- STATE ---
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [products, setProducts] = useState([]); 
    const [allProducts, setAllProducts] = useState([]); 
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    const [formData, setFormData] = useState({ outlet_id: '', notes: '', product_id: '', qty: 0, type: 'opname' });
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");
    
    // --- INITIAL LOAD ---
    useEffect(() => {
        async function init() {
            try {
                const [resOutlets, resProd] = await Promise.all([
                    api.get('/tenant/outlets'),
                    api.get('/tenant/products') 
                ]);
                setOutlets(resOutlets.data.outlets || []);
                setAllProducts(resProd.data.products || []);
            } catch (e) { console.error(e); }
        }
        init();
    }, []);

    useEffect(() => { loadAdjustments(); }, [filterOutlet]);

    const loadAdjustments = async () => {
        setLoading(true);
        try {
            const resAdj = await api.get('/tenant/data/stock_adjustments', {
                params: { outlet_id: filterOutlet !== 'all' ? filterOutlet : '' }
            });
            setData(resAdj.data.data || []);
            setFilteredData(resAdj.data.data || []);
        } catch (e) {} finally { setLoading(false); }
    };

    useEffect(() => {
        if (search) {
            const lower = search.toLowerCase();
            setFilteredData(data.filter(i => {
                const pName = allProducts.find(p => String(p.id) === String(i.product_id))?.name || '';
                return (pName.toLowerCase().includes(lower) || (i.notes && i.notes.toLowerCase().includes(lower)));
            }));
        } else { setFilteredData(data); }
    }, [search, data, allProducts]);

    // --- LOGIC FETCH PRODUCT ---
    const fetchOutletProducts = async (outletId) => {
        if (!outletId) { setProducts([]); return; }
        try {
            const res = await api.get('/tenant/products', { params: { outlet_id: outletId } });
            setProducts(res.data.products || []);
        } catch (e) { setProducts([]); }
    };

    // --- HANDLER MODAL (AUTO SELECT & READONLY) ---
    const isOutletLocked = filterOutlet !== 'all';

    const handleOpenAdd = () => {
        const initialOutlet = isOutletLocked ? filterOutlet : (outlets[0]?.id || '');
        
        setFormData({ 
            outlet_id: initialOutlet, 
            notes: '', 
            product_id: '', 
            qty: 0, 
            type: 'opname' 
        });
        
        fetchOutletProducts(initialOutlet);
        setShowModal(true);
    };

    const handleFormOutletChange = (e) => {
        const outletId = e.target.value;
        setFormData({ ...formData, outlet_id: outletId, product_id: '' }); 
        fetchOutletProducts(outletId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.outlet_id || !formData.product_id) return alert("Data tidak lengkap");

        setIsSubmitting(true);
        try {
            const payload = { ...formData, date: new Date().toISOString().split('T')[0], user: 'Admin' };
            await api.post('/tenant/data/stock_adjustments', payload);
            setShowModal(false); loadAdjustments();
        } catch (e) { alert("Gagal menyimpan."); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Stock Adjustment" subtitle="Penyesuaian stok (Opname/Rusak/Hilang)" />

            {/* HEADER & FILTER */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-auto">
                        <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <select className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
                            value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}>
                            <option value="all">Semua Outlet</option>
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari Produk / Alasan..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={handleOpenAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={18}/> <span className="hidden md:inline">Adjustment Baru</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                            <tr><th className="p-4">Tanggal</th><th className="p-4">Outlet</th><th className="p-4">Produk</th><th className="p-4 text-center">Tipe</th><th className="p-4 text-right">Qty</th><th className="p-4">Catatan</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center"><Loader className="animate-spin inline text-blue-600 mr-2" size={20}/> Memuat data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Belum ada data.</td></tr>
                            ) : (
                                filteredData.map(i => {
                                    const prodName = allProducts.find(p => String(p.id) === String(i.product_id))?.name || `Product #${i.product_id}`;
                                    return (
                                        <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600 font-mono">{i.date}</td>
                                            <td className="p-4 text-sm font-medium text-gray-700">{outlets.find(o=>String(o.id)===String(i.outlet_id))?.name || '-'}</td>
                                            <td className="p-4 text-sm font-bold text-gray-800">{prodName}</td>
                                            <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${i.type === 'opname' ? 'bg-blue-50 text-blue-600 border-blue-100' : i.type === 'add' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{i.type}</span></td>
                                            <td className={`p-4 text-right font-mono font-bold ${i.type === 'sub' ? 'text-red-600' : 'text-green-600'}`}>{i.type === 'add' ? '+' : ''}{i.type === 'sub' ? '-' : ''}{i.qty}</td>
                                            <td className="p-4 text-sm text-gray-500 italic">{i.notes || '-'}</td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Input Stock Adjustment" size="md">
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-xs text-yellow-800 flex gap-2"><AlertTriangle size={16} className="flex-shrink-0"/><p>Perubahan stok akan langsung mempengaruhi jumlah stok aktif.</p></div>

                    <FormField 
                        label="Pilih Outlet" 
                        name="outlet_id" 
                        type="select" 
                        options={outlets.map(o => ({value: o.id, label: o.name}))} 
                        value={formData.outlet_id} 
                        onChange={handleFormOutletChange} 
                        required 
                        disabled={isOutletLocked} // <-- KUNCI JIKA FILTER AKTIF
                    />
                    
                    {formData.outlet_id ? (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 border p-4 rounded-lg bg-gray-50">
                            <FormField label="Produk" name="product_id" type="select" options={products.map(p => ({value: p.id, label: `${p.name} (Sisa: ${p.stock})`}))} value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Tipe" name="type" type="select" options={[{value:'opname', label:'Opname'}, {value:'add', label:'Tambah (+)'}, {value:'sub', label:'Kurang (-)'}]} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                                <FormField label="Jumlah" name="qty" type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} required />
                            </div>
                        </div>
                    ) : <div className="p-4 text-center text-gray-400 bg-gray-50 border border-dashed rounded-lg">Pilih Outlet terlebih dahulu.</div>}
                    
                    <FormField label="Catatan" name="notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} required />
                    
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold mr-2">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}