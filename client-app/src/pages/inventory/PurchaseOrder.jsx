import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search, Plus, Calendar, Store, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';

export default function PurchaseOrder() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]); // List produk untuk dropdown
    
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ 
        outlet_id: '', supplier_id: '', date: '', notes: '', items: [] 
    });
    
    // State untuk item baris baru
    const [newItem, setNewItem] = useState({ product_id: '', qty: 1, cost: 0 });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [resPO, resOutlets, resSuppliers, resProd] = await Promise.all([
                api.get('/tenant/data/purchase_orders'),
                api.get('/tenant/outlets'),
                api.get('/tenant/data/suppliers'),
                api.get('/tenant/products')
            ]);
            setData(resPO.data.data || []);
            setOutlets(resOutlets.data.outlets || []);
            setSuppliers(resSuppliers.data.data || []);
            setProducts(resProd.data.products || []);
        } catch (e) {}
    };

    const handleAddItem = () => {
        if (!newItem.product_id) return alert("Pilih produk!");
        const product = products.find(p => p.id == newItem.product_id);
        
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...newItem, name: product.name }]
        }));
        setNewItem({ product_id: '', qty: 1, cost: 0 }); // Reset
    };

    const handleRemoveItem = (idx) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) return alert("Minimal 1 item!");
        try {
            // Hitung total otomatis
            const total = formData.items.reduce((acc, i) => acc + (i.qty * i.cost), 0);
            const payload = { ...formData, total, status: 'pending' };

            await api.post('/tenant/data/purchase_orders', payload);
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal membuat PO."); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Purchase Order</h1>
                <button onClick={() => { setFormData({ outlet_id: outlets[0]?.id, items:[] }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Plus size={18}/> Create PO</button>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-600"><tr><th className="p-4">Date</th><th className="p-4">Supplier</th><th className="p-4">Outlet</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Status</th></tr></thead>
                        <tbody className="divide-y">
                            {data.map(i => (
                                <tr key={i.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-sm">{i.date}</td>
                                    <td className="p-4 font-bold">{suppliers.find(s=>s.id == i.supplier_id)?.name || '-'}</td>
                                    <td className="p-4 text-sm text-gray-500">{outlets.find(o=>o.id == i.outlet_id)?.name || '-'}</td>
                                    <td className="p-4 text-right font-mono font-bold">Rp {parseInt(i.total || 0).toLocaleString()}</td>
                                    <td className="p-4 text-center"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs uppercase font-bold">{i.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Order" size="lg">
                <form onSubmit={handleSubmit} className="p-2">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Choose Outlet" name="outlet_id" type="select" options={outlets.map(o => ({value: o.id, label: o.name}))} value={formData.outlet_id} onChange={e => setFormData({...formData, outlet_id: e.target.value})} required />
                        <FormField label="Supplier" name="supplier_id" type="select" options={suppliers.map(s => ({value: s.id, label: s.name}))} value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} required />
                    </div>
                    <FormField label="Date" name="date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                    <FormField label="Note" name="notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Write your note here... e.g. request note, tracking/shipping note" />

                    {/* Item Selector Section */}
                    <div className="bg-gray-50 p-4 rounded border mt-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Items</h4>
                        <div className="flex gap-2 mb-2">
                            <select className="flex-1 border rounded px-2 py-2 text-sm" value={newItem.product_id} onChange={e => setNewItem({...newItem, product_id: e.target.value})}>
                                <option value="">-- Select Product --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="number" placeholder="Qty" className="w-20 border rounded px-2 py-2 text-sm" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} />
                            <input type="number" placeholder="Cost" className="w-28 border rounded px-2 py-2 text-sm" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} />
                            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">Add</button>
                        </div>

                        {/* Items List */}
                        <table className="w-full text-sm mt-3">
                            <thead className="bg-gray-100 text-xs uppercase text-gray-500"><tr><th className="p-2 text-left">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Cost</th><th className="p-2 text-right">Subtotal</th><th className="p-2"></th></tr></thead>
                            <tbody>
                                {formData.items.map((item, idx) => (
                                    <tr key={idx} className="border-b last:border-0">
                                        <td className="p-2">{item.name}</td>
                                        <td className="p-2 text-right">{item.qty}</td>
                                        <td className="p-2 text-right">{parseInt(item.cost).toLocaleString()}</td>
                                        <td className="p-2 text-right font-bold">{(item.qty * item.cost).toLocaleString()}</td>
                                        <td className="p-2 text-right"><button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500"><Trash2 size={14}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-6 font-bold">Create PO</button>
                </form>
            </Modal>
        </div>
    );
}