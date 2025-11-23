import React, { useEffect, useState } from "react";
import { useCart } from "../../store/cart";
import productsAPI from "../../api/products";
import ordersAPI from "../../api/orders";

export default function POSPage() {
    const [products, setProducts] = useState([]);
    const { items, add, remove, clear, total } = useCart();

    useEffect(() => {
        productsAPI.list().then(r => setProducts(r.data.products));
    }, []);

    async function handlePay() {
        if (items.length === 0) return alert("Keranjang kosong");
        if (!confirm(`Bayar Total Rp ${total().toLocaleString()}?`)) return;

        try {
            await ordersAPI.create({
                items: items,
                total: total(),
                outlet_id: 1, // Harusnya ambil dari state outlet terpilih
                payment_method: 'cash'
            });
            alert("Transaksi Berhasil!");
            clear();
        } catch (e) {
            alert("Gagal transaksi");
        }
    }

    return (
        <div className="flex h-full">
            {/* Left: Product Grid */}
            <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {products.map(p => (
                        <div key={p.id} onClick={() => add(p)} 
                             className="bg-white p-4 rounded shadow cursor-pointer hover:ring-2 ring-blue-500 transition">
                            <div className="h-20 bg-gray-200 mb-2 rounded"></div>
                            <h3 className="font-bold text-gray-800 truncate">{p.name}</h3>
                            <p className="text-blue-600 font-medium">Rp {parseInt(p.price).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart Sidebar */}
            <div className="w-96 bg-white border-l flex flex-col shadow-xl">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-bold text-lg">Keranjang Belanja</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 && <p className="text-gray-400 text-center mt-10">Belum ada item</p>}
                    
                    {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                            <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-gray-500">x{item.qty} @ {parseInt(item.price).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">Rp {(item.price * item.qty).toLocaleString()}</span>
                                <button onClick={() => remove(item.id)} className="text-red-500 px-2">×</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Total</span>
                        <span>Rp {total().toLocaleString()}</span>
                    </div>
                    <button onClick={handlePay} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 text-lg">
                        BAYAR SEKARANG
                    </button>
                </div>
            </div>
        </div>
    );
}