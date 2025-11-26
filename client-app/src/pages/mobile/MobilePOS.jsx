import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, X, ChevronUp } from "lucide-react";
import { useCart } from "../../store/cart"; // Pakai store yang sama
import productsAPI from "../../api/products";

export default function MobilePOS() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { items, add, remove, updateQty, total } = useCart();

    useEffect(() => {
        productsAPI.list().then(res => setProducts(res.data.products || []));
    }, []);

    const cartTotal = total();
    const itemCount = items.reduce((acc, item) => acc + item.qty, 0);

    return (
        <div className="h-full flex flex-col bg-gray-50 relative">
            {/* Search Header */}
            <div className="sticky top-0 bg-white px-5 py-3 shadow-sm z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-5 pb-24">
                <div className="grid grid-cols-2 gap-4">
                    {products.map(p => (
                        <div key={p.id} onClick={() => add(p)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform">
                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                {p.image_url && <img src={p.image_url} className="w-full h-full object-cover" />}
                            </div>
                            <h3 className="font-bold text-gray-800 text-xs line-clamp-2 h-8">{p.name}</h3>
                            <p className="text-blue-600 font-bold text-sm mt-1">Rp {parseInt(p.price).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FLOATING CART BAR (Muncul jika ada item) */}
            {itemCount > 0 && (
                <div className="fixed bottom-20 left-4 right-4 z-20">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-600/30 flex justify-between items-center animate-in slide-in-from-bottom-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {itemCount}
                            </div>
                            <div className="text-left">
                                <p className="text-xs opacity-90">Total Tagihan</p>
                                <p className="font-bold text-lg">Rp {cartTotal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                            Lihat <ChevronUp size={16}/>
                        </div>
                    </button>
                </div>
            )}

            {/* FULLSCREEN CART MODAL (BottomSheet Style) */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-t-2xl h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b flex justify-between items-center">
                            <h2 className="font-bold text-lg">Keranjang ({itemCount})</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        <p className="text-blue-600 text-sm font-medium">Rp {parseInt(item.price).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                        <button onClick={() => item.qty > 1 ? updateQty(item.id, item.qty - 1) : remove(item.id)} className="w-8 h-8 flex items-center justify-center text-gray-600">-</button>
                                        <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                        <button onClick={() => add(item)} className="w-8 h-8 flex items-center justify-center text-blue-600">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Button */}
                        <div className="p-5 border-t bg-gray-50">
                            <div className="flex justify-between mb-4 text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-bold">Rp {cartTotal.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={() => alert("Lanjut ke Payment (Gunakan komponen PaymentModal dari POS Desktop)")}
                                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-green-600/20"
                            >
                                Bayar Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}