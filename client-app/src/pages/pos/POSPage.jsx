import React, { useEffect, useState, useMemo } from "react";
import { useCart } from "../../store/cart";
import productsAPI from "../../api/products";
import ordersAPI from "../../api/orders";
import api from "../../api/client";
import { 
    Search, Grid, ShoppingCart, X, UserPlus, User, 
    CreditCard, Smartphone, Truck, Banknote, Calendar, 
    ChevronRight, CheckCircle, Wallet, Globe, Loader, AlertTriangle
} from "lucide-react";

export default function POSPage() {
    // --- STATE DATA ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [config, setConfig] = useState({}); // Checkout Config

    // --- STATE UI ---
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- CART STORE ---
    const { items, add, remove, clear, updateQty } = useCart();

    // --- INITIAL LOAD ---
    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const [prodRes, catRes, custRes, confRes] = await Promise.all([
                    productsAPI.list(),
                    api.get('/tenant/data/categories'),
                    api.get('/tenant/data/customers'),
                    api.get('/tenant/options/checkout_config')
                ]);
                setProducts(prodRes.data.products || []);
                setCategories(catRes.data.data || []);
                setCustomers(custRes.data.data || []);
                setConfig(confRes.data.data || {});
            } catch (e) { 
                console.error("Init POS Error", e); 
            } finally {
                setLoading(false);
            }
        }
        init();
    }, []);

    // --- LOGIC: STOCK CHECK ---
    const handleAddToCart = (product) => {
        // Cek limit stok jika fitur diaktifkan
        if (config.enable_stock_limit) {
            const currentInCart = items.find(i => i.id === product.id)?.qty || 0;
            const availableStock = parseInt(product.stock) || 0;
            
            if (currentInCart + 1 > availableStock) {
                if (!config.allow_override_stock) {
                    alert(`Stok tidak mencukupi! Sisa stok: ${availableStock}`);
                    return; // Block penjualan
                } else {
                    // Warning tapi lanjut (Override allowed)
                    console.warn("Stock override active"); 
                }
            }
        }
        add(product);
    };

    const handleUpdateQty = (id, newQty) => {
        if (newQty < 1) {
            remove(id);
            return;
        }

        if (config.enable_stock_limit) {
            const product = products.find(p => p.id === id);
            const availableStock = parseInt(product?.stock) || 0;
            
            if (newQty > availableStock && !config.allow_override_stock) {
                alert(`Stok tidak mencukupi! Maksimal: ${availableStock}`);
                return;
            }
        }
        updateQty(id, newQty);
    };

    // --- LOGIC: CALCULATIONS (TAX, SERVICE, ROUNDING) ---
    const cartSummary = useMemo(() => {
        const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
        
        let tax = 0;
        let service = 0;
        let totalBeforeRounding = subtotal;

        // Ambil rate dari config (default 0 jika tidak ada)
        const taxRate = parseFloat(config.tax_rate || 0);
        const serviceRate = parseFloat(config.service_rate || 0);

        if (config.include_tax_gratuity) {
            // Inclusive Tax logic (Harga sudah termasuk pajak)
            // Rumus sederhana: Tax = Total * (Rate / (100 + Rate))
            if (config.enable_tax) tax = subtotal * (taxRate / (100 + taxRate));
            if (config.enable_gratuity) service = subtotal * (serviceRate / (100 + serviceRate));
            // Total tetap sama dengan subtotal (karena inclusive), tapi kita break down komponennya
            totalBeforeRounding = subtotal; 
        } else {
            // Exclusive Tax Logic (Harga belum termasuk pajak)
            if (config.enable_tax) tax = subtotal * (taxRate / 100);
            if (config.enable_gratuity) service = subtotal * (serviceRate / 100);
            totalBeforeRounding = subtotal + tax + service;
        }

        // Rounding Logic
        let rounding = 0;
        let finalTotal = totalBeforeRounding;

        if (config.enable_rounding) {
            // Contoh rounding ke ratusan terdekat
            finalTotal = Math.round(totalBeforeRounding / 100) * 100;
            rounding = finalTotal - totalBeforeRounding;
        }

        return {
            subtotal,
            tax,
            service,
            rounding,
            total: Math.max(0, finalTotal) // Pastikan tidak negatif
        };
    }, [items, config]);


    // --- FILTERING ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                                (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
            const matchCat = selectedCategory === "all" || String(p.category_id) === String(selectedCategory);
            return matchSearch && matchCat;
        });
    }, [products, search, selectedCategory]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin text-blue-600" size={40}/></div>;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
            {/* --- LEFT: PRODUCT AREA --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Header & Filter */}
                <div className="bg-white shadow-sm z-10">
                    {/* Search Bar */}
                    <div className="p-4 border-b flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text" 
                                placeholder="Cari nama produk, SKU..." 
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {/* Info Shift */}
                        {config.auto_start_shift && (
                            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                <CheckCircle size={14} /> Shift Otomatis Aktif
                            </div>
                        )}
                    </div>

                    {/* Category Tabs */}
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto custom-scrollbar">
                        <button 
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Semua
                        </button>
                        {categories.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => setSelectedCategory(c.id)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(p => {
                            const stock = parseInt(p.stock) || 0;
                            const isLowStock = stock <= (p.stock_alert || 5);
                            const isOutOfStock = stock <= 0;

                            return (
                                <div key={p.id} onClick={() => handleAddToCart(p)} 
                                     className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all hover:shadow-md flex flex-col active:scale-95 relative overflow-hidden
                                        ${isOutOfStock ? 'border-red-200 opacity-80 grayscale-[0.5]' : 'border-gray-200 hover:ring-2 ring-blue-500'}
                                     `}>
                                    
                                    {/* Stock Badge */}
                                    {config.enable_stock_limit && (
                                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold z-10 ${isOutOfStock ? 'bg-red-600 text-white' : (isLowStock ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600')}`}>
                                            {stock}
                                        </div>
                                    )}

                                    <div className="aspect-square w-full bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} />
                                        ) : null}
                                        <div className={`absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-medium bg-gray-50 ${p.image_url ? 'hidden' : 'flex'}`}>
                                            {p.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1 flex-1">{p.name}</h3>
                                    <p className="text-blue-600 font-bold text-sm">Rp {parseInt(p.price).toLocaleString()}</p>
                                </div>
                            );
                        })}
                    </div>
                    {filteredProducts.length === 0 && <div className="text-center text-gray-400 mt-20">Produk tidak ditemukan</div>}
                </div>
            </div>

            {/* --- RIGHT: CART SIDEBAR --- */}
            <div className="w-96 bg-white border-l flex flex-col shadow-2xl z-20 h-full">
                <div className="p-4 border-b bg-white flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-xl text-gray-800">Pesanan</h2>
                        <p className="text-xs text-gray-500">{items.length} Item di keranjang</p>
                    </div>
                    <button onClick={clear} className="text-red-500 text-xs hover:underline font-medium">Hapus Semua</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <ShoppingCart size={48} className="mb-2"/>
                            <p>Belum ada item</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">Rp {parseInt(item.price).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded-lg overflow-hidden">
                                        <button onClick={(e) => {e.stopPropagation(); handleUpdateQty(item.id, item.qty - 1)}} className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600">-</button>
                                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                                        <button onClick={(e) => {e.stopPropagation(); handleAddToCart(item)}} className="w-7 h-7 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600">+</button>
                                    </div>
                                    <div className="w-16 text-right font-bold text-gray-900 text-sm">
                                        {(item.price * item.qty).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-sm space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>Rp {cartSummary.subtotal.toLocaleString()}</span>
                    </div>
                    
                    {config.enable_tax && (
                        <div className="flex justify-between text-gray-600">
                            <span>Pajak ({config.tax_rate}%)</span>
                            <span>Rp {cartSummary.tax.toLocaleString()}</span>
                        </div>
                    )}
                    
                    {config.enable_gratuity && (
                        <div className="flex justify-between text-gray-600">
                            <span>Service ({config.service_rate}%)</span>
                            <span>Rp {cartSummary.service.toLocaleString()}</span>
                        </div>
                    )}

                    {config.enable_rounding && cartSummary.rounding !== 0 && (
                        <div className="flex justify-between text-gray-500 italic">
                            <span>Pembulatan</span>
                            <span>Rp {cartSummary.rounding.toLocaleString()}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t mt-2">
                        <span>Total</span>
                        <span>Rp {cartSummary.total.toLocaleString()}</span>
                    </div>
                    
                    <button 
                        onClick={() => {
                            if(items.length === 0) return alert("Keranjang kosong");
                            setIsPayModalOpen(true);
                        }}
                        disabled={items.length === 0}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg mt-4"
                    >
                        BAYAR SEKARANG
                    </button>
                </div>
            </div>

            {/* --- PAYMENT MODAL --- */}
            {isPayModalOpen && (
                <PaymentModal 
                    isOpen={isPayModalOpen} 
                    onClose={() => setIsPayModalOpen(false)}
                    summary={cartSummary} // Kirim seluruh summary
                    items={items}
                    customers={customers}
                    config={config} // Kirim config untuk logic di modal
                    onSuccess={() => {
                        clear();
                        setIsPayModalOpen(false);
                        api.get('/tenant/data/customers').then(res => setCustomers(res.data.data || []));
                    }}
                />
            )}
        </div>
    );
}

// --- SUB-COMPONENT: PAYMENT MODAL ---
function PaymentModal({ isOpen, onClose, summary, items, customers, config, onSuccess }) {
    // Payment States
    const [methodCategory, setMethodCategory] = useState('tunai'); 
    const [selectedProvider, setSelectedProvider] = useState('');
    const [amountPaid, setAmountPaid] = useState(summary.total); 
    const [note, setNote] = useState('');
    
    // Customer States
    const [selectedCustomer, setSelectedCustomer] = useState(null); 
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '', gender: 'L', address: '' });
    const [invoiceDue, setInvoiceDue] = useState('7'); 

    // Submit State
    const [processing, setProcessing] = useState(false);

    // Nominal Suggestion untuk Tunai
    const suggestions = useMemo(() => {
        const base = summary.total;
        const opts = [base];
        if (base % 50000 !== 0) opts.push(Math.ceil(base / 50000) * 50000);
        if (base % 100000 !== 0) opts.push(Math.ceil(base / 100000) * 100000);
        opts.push(base + 50000); 
        return [...new Set(opts)].sort((a, b) => a - b);
    }, [summary.total]);

    const handlePay = async () => {
        setProcessing(true);
        try {
            let customerId = selectedCustomer?.id || 0;
            
            // Payload Order Lengkap dengan detail Tax & Service
            const payload = {
                items: items,
                total: summary.total,
                subtotal: summary.subtotal,
                tax_amount: summary.tax,
                gratuity_amount: summary.service,
                
                outlet_id: 1, 
                payment_method: methodCategory === 'tunai' ? 'cash' : methodCategory,
                payment_provider: selectedProvider,
                amount_paid: methodCategory === 'tunai' ? amountPaid : summary.total,
                change_return: methodCategory === 'tunai' ? (amountPaid - summary.total) : 0,
                notes: note,
                customer_id: customerId,
                new_customer: isNewCustomer ? newCustomerForm : null,
                invoice_due_days: methodCategory === 'invoice' ? invoiceDue : 0
            };

            await ordersAPI.create(payload);
            alert("Pembayaran Berhasil!");
            onSuccess();
        } catch (e) {
            alert("Gagal memproses pembayaran: " + (e.response?.data?.message || "Error"));
        } finally {
            setProcessing(false);
        }
    };

    const paymentMethods = [
        { id: 'tunai', label: 'Tunai', icon: Banknote },
        { id: 'qris', label: 'QRIS', icon: Grid },
        { id: 'ewallet', label: 'E-Wallet', icon: Smartphone },
        { id: 'edc', label: 'EDC', icon: CreditCard },
        { id: 'online', label: 'Delivery', icon: Truck },
        { id: 'ecommerce', label: 'E-Comm', icon: Globe },
        { id: 'invoice', label: 'Invoice', icon: Calendar },
        { id: 'other', label: 'Lainnya', icon: Wallet },
    ];

    const providers = {
        ewallet: ['GoPay', 'OVO', 'Dana', 'LinkAja', 'ShopeePay', 'Kredivo', 'Akulaku'],
        online: ['GoFood', 'GrabFood', 'ShopeeFood', 'Lainnya'],
        edc: ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB', 'AlloBank', 'BSI'],
        ecommerce: ['Tokopedia', 'Shopee', 'TikTok Shop', 'Lainnya']
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden">
                
                {/* --- LEFT: BILL SUMMARY --- */}
                <div className="w-1/3 bg-gray-50 border-r flex flex-col">
                    <div className="p-5 border-b">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">Total Tagihan</h3>
                        <div className="text-3xl font-black text-blue-600">Rp {summary.total.toLocaleString()}</div>
                        {(summary.tax > 0 || summary.service > 0) && (
                            <div className="text-xs text-gray-500 mt-1">
                                Termasuk Pajak & Layanan
                            </div>
                        )}
                    </div>
                    
                    {/* Customer Section */}
                    <div className="p-5 flex-1 overflow-y-auto">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pelanggan</label>
                            {!isNewCustomer ? (
                                <div className="space-y-2">
                                    <select 
                                        className="w-full border p-2 rounded bg-white text-sm" 
                                        value={selectedCustomer?.id || ""} 
                                        onChange={e => {
                                            const c = customers.find(c => c.id == e.target.value);
                                            setSelectedCustomer(c);
                                        }}
                                    >
                                        <option value="">-- Pilih Pelanggan --</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                    </select>
                                    <button onClick={() => setIsNewCustomer(true)} className="w-full py-2 border border-dashed border-blue-400 text-blue-600 rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50">
                                        <UserPlus size={16}/> Buat Pelanggan Baru
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white p-3 rounded border shadow-sm space-y-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm text-blue-600">Data Pelanggan Baru</span>
                                        <button onClick={() => setIsNewCustomer(false)} className="text-gray-400 hover:text-red-500"><X size={16}/></button>
                                    </div>
                                    <input className="w-full border p-2 rounded text-sm" placeholder="Nama Lengkap" value={newCustomerForm.name} onChange={e=>setNewCustomerForm({...newCustomerForm, name: e.target.value})}/>
                                    <input className="w-full border p-2 rounded text-sm" placeholder="No. HP" value={newCustomerForm.phone} onChange={e=>setNewCustomerForm({...newCustomerForm, phone: e.target.value})}/>
                                    <input className="w-full border p-2 rounded text-sm" placeholder="Email" value={newCustomerForm.email} onChange={e=>setNewCustomerForm({...newCustomerForm, email: e.target.value})}/>
                                    <select className="w-full border p-2 rounded text-sm" value={newCustomerForm.gender} onChange={e=>setNewCustomerForm({...newCustomerForm, gender: e.target.value})}>
                                        <option value="L">Laki-laki</option><option value="P">Perempuan</option>
                                    </select>
                                    <textarea className="w-full border p-2 rounded text-sm" placeholder="Alamat" rows="2" value={newCustomerForm.address} onChange={e=>setNewCustomerForm({...newCustomerForm, address: e.target.value})}/>
                                </div>
                            )}
                        </div>

                        {methodCategory === 'invoice' && (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                                <h4 className="font-bold text-orange-800 text-sm mb-2">Jatuh Tempo</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {['7','14','30'].map(d => (
                                        <button key={d} onClick={() => setInvoiceDue(d)} className={`py-1 text-xs font-bold rounded border ${invoiceDue === d ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-600'}`}>{d} Hari</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t bg-white">
                        <button onClick={onClose} className="w-full py-3 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50">Batal</button>
                    </div>
                </div>

                {/* --- RIGHT: PAYMENT METHODS --- */}
                <div className="w-2/3 flex flex-col">
                    <div className="p-2 bg-white border-b flex gap-2 overflow-x-auto">
                        {paymentMethods.map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => { setMethodCategory(m.id); setSelectedProvider(''); }}
                                className={`flex-1 min-w-[80px] py-3 flex flex-col items-center gap-1 rounded-lg transition-all ${methodCategory === m.id ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <m.icon size={20} />
                                <span className="text-xs">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                        {methodCategory === 'tunai' && (
                            <div className="space-y-6 max-w-md mx-auto">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-2">Uang Diterima</label>
                                    <input 
                                        type="number" 
                                        className="w-full text-3xl font-bold p-3 border rounded-lg focus:ring-4 ring-blue-200 outline-none text-right"
                                        value={amountPaid}
                                        onChange={e => setAmountPaid(Number(e.target.value))}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {suggestions.map(val => (
                                        <button key={val} onClick={() => setAmountPaid(val)} className="py-3 bg-white border rounded shadow-sm hover:bg-blue-50 font-mono font-bold text-gray-700">
                                            {val.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                <div className={`p-4 rounded-lg flex justify-between items-center ${amountPaid >= summary.total ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    <span className="font-bold">Kembalian</span>
                                    <span className="text-xl font-black">Rp {(amountPaid - summary.total).toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {['ewallet', 'edc', 'online', 'ecommerce'].includes(methodCategory) && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-700">Pilih Provider {paymentMethods.find(m=>m.id===methodCategory).label}</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {providers[methodCategory].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setSelectedProvider(p)}
                                            className={`py-4 border rounded-xl font-bold transition-all ${selectedProvider === p ? 'bg-blue-600 text-white shadow-lg transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                {selectedProvider && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-bold text-gray-600 mb-1">Catatan / No. Ref</label>
                                        <input type="text" className="w-full border p-3 rounded" placeholder="Contoh: Trace No..." value={note} onChange={e => setNote(e.target.value)} />
                                    </div>
                                )}
                            </div>
                        )}

                        {methodCategory === 'qris' && (
                            <div className="text-center py-10">
                                <div className="w-48 h-48 bg-white border-2 border-gray-800 mx-auto mb-4 flex items-center justify-center">
                                    <Grid size={64} className="text-gray-300"/>
                                    <span className="absolute text-xs text-gray-400">SCAN QRIS</span>
                                </div>
                                <p className="text-gray-600 font-medium">Tunjukkan QR ke pelanggan</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white border-t shadow-up z-10">
                        <button 
                            onClick={handlePay}
                            disabled={processing || (methodCategory === 'tunai' && amountPaid < summary.total) || (['ewallet','edc','online','ecommerce'].includes(methodCategory) && !selectedProvider)}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {processing ? 'Memproses...' : (
                                <>
                                    <CheckCircle size={24} />
                                    KONFIRMASI BAYAR
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}