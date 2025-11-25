import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, ArrowRightLeft, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';

export default function Transfer() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ from_outlet: '', to_outlet: '', notes: '', items: [] });
    const [newItem, setNewItem] = useState({ product_id: '', qty: 1 });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [resTrans, resOutlets, resProd] = await Promise.all([
                api.get('/tenant/data/stock_transfers'),
                api.get('/tenant/outlets'),
                api.get('/tenant/products')
            ]);
            setData(resTrans.data.data || []);
            setOutlets(resOutlets.data.outlets || []);
            setProducts(resProd.data.products || []);
        } catch (e) {}
    };

    const handleAddItem = () => {
        if (!newItem.product_id) return alert("Pilih produk!");
        const product = products.find(p => p.id == newItem.product_id);
        
        if(formData.items.length >= 50) return alert("Max 50 items!");
        
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...newItem, name: product.name }]
        }));
        setNewItem({ product_id: '', qty: 1 });
    };

    const handleRemoveItem = (idx) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.from_outlet === formData.to_outlet) return alert("Asal dan Tujuan tidak boleh sama!");
        if (formData.items.length === 0) return alert("Minimal 1 item!");
        
        try {
            const payload = { ...formData, date: new Date().toISOString().split('T')[0], status: 'pending', items_count: formData.items.length };
            await api.post('/tenant/data/stock_transfers', payload);
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal membuat transfer."); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Stock Transfer</h1>
                <button onClick={() => { setFormData({ items: [] }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Plus size={18}/> Create Transfer</button>
            </div>
            
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-600"><tr><th className="p-4">Date</th><th className="p-4">Route</th><th className="p-4 text-center">Items</th><th className="p-4 text-center">Status</th></tr></thead>
                        <tbody className="divide-y">
                            {data.map(i => (
                                <tr key={i.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-sm">{i.date}</td>
                                    <td className="p-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-700">{outlets.find(o=>o.id == i.from_outlet)?.name || i.from_outlet}</span>
                                            <ArrowRightLeft size={14} className="text-gray-400" />
                                            <span className="font-bold text-gray-700">{outlets.find(o=>o.id == i.to_outlet)?.name || i.to_outlet}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-bold">{i.items_count}</td>
                                    <td className="p-4 text-center"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs uppercase font-bold">{i.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Transfer" size="lg">
                <form onSubmit={handleSubmit} className="p-2">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Transfer From Outlet" name="from_outlet" type="select" options={outlets.map(o => ({value: o.id, label: o.name}))} value={formData.from_outlet} onChange={e => setFormData({...formData, from_outlet: e.target.value})} required />
                        <FormField label="Transfer To Outlet" name="to_outlet" type="select" options={outlets.map(o => ({value: o.id, label: o.name}))} value={formData.to_outlet} onChange={e => setFormData({...formData, to_outlet: e.target.value})} required />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded border mt-2">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Items Request (Max 50 items)</h4>
                        <div className="flex gap-2 mb-2">
                            <select className="flex-1 border rounded px-2 py-2 text-sm" value={newItem.product_id} onChange={e => setNewItem({...newItem, product_id: e.target.value})}>
                                <option value="">-- Select Product --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <input type="number" placeholder="Qty" className="w-24 border rounded px-2 py-2 text-sm" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} />
                            <button type="button" onClick={handleAddItem} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">Add</button>
                        </div>
                        {/* List */}
                        <div className="max-h-40 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-500"><tr><th className="p-2 text-left">Item</th><th className="p-2 text-right">Qty</th><th className="p-2"></th></tr></thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="p-2">{item.name}</td>
                                            <td className="p-2 text-right">{item.qty}</td>
                                            <td className="p-2 text-right"><button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500"><Trash2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <FormField label="Additional Note (Optional)" name="notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Write your note here... e.g. Request note, tracking/shipping note" />
                    
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-4 font-bold">Create Transfer</button>
                </form>
            </Modal>
        </div>
    );
}