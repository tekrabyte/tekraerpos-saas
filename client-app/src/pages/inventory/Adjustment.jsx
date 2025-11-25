import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, ClipboardList } from 'lucide-react';
import Modal from '../../components/Modal'; 
import FormField from '../../components/FormField';

export default function Adjustment() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ outlet_id: '', notes: '', product_id: '', qty: 0, type: 'opname' });
    
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [resAdj, resOutlets] = await Promise.all([
                api.get('/tenant/data/stock_adjustments'),
                api.get('/tenant/outlets')
            ]);
            setData(resAdj.data.data || []);
            setOutlets(resOutlets.data.outlets || []);
        } catch (e) {}
    };

    // Load products saat outlet dipilih
    const handleOutletChange = async (e) => {
        const outletId = e.target.value;
        setFormData({ ...formData, outlet_id: outletId });
        if (outletId) {
            try {
                const res = await api.get('/tenant/products', { params: { outlet_id: outletId } });
                setProducts(res.data.products || []);
            } catch (e) {}
        } else {
            setProducts([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Logic adjustment: jika type='add', qty positif, jika 'sub', qty negatif
            // Atau 'opname' (replace stock). Disini kita simpan raw dulu.
            const payload = { ...formData, date: new Date().toISOString().split('T')[0], user: 'Admin' };
            await api.post('/tenant/data/stock_adjustments', payload);
            setShowModal(false); loadData();
        } catch (e) { alert("Gagal menyimpan."); }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Stock Adjustment</h1>
                <button onClick={() => { setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Plus size={18}/> New Adjustment</button>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-600"><tr><th className="p-4">Date</th><th className="p-4">Outlet</th><th className="p-4">Product</th><th className="p-4 text-right">Qty Adj</th><th className="p-4">Reason/Note</th></tr></thead>
                        <tbody className="divide-y">
                            {data.map(i => (
                                <tr key={i.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono text-sm">{i.date}</td>
                                    <td className="p-4 text-sm">{outlets.find(o=>o.id == i.outlet_id)?.name || '-'}</td>
                                    <td className="p-4 font-bold text-sm">{i.product_id}</td>
                                    <td className={`p-4 text-right font-bold ${parseInt(i.qty) > 0 ? 'text-green-600' : 'text-red-600'}`}>{i.qty > 0 ? `+${i.qty}` : i.qty}</td>
                                    <td className="p-4 text-sm text-gray-600">{i.notes || i.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Adjustment Stock" size="md">
                <form onSubmit={handleSubmit} className="p-2">
                    <FormField label="Choose Outlet" name="outlet_id" type="select" options={outlets.map(o => ({value: o.id, label: o.name}))} value={formData.outlet_id} onChange={handleOutletChange} required />
                    
                    <div className="bg-gray-50 p-4 rounded border mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Adjustment Detail</h4>
                        <FormField label="Product" name="product_id" type="select" options={products.map(p => ({value: p.id, label: p.name}))} value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})} required />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Adjustment Type" name="type" type="select" options={[{value:'add', label:'Add (+)'}, {value:'sub', label:'Subtract (-)'}, {value:'opname', label:'Set Actual (Opname)'}]} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                            <FormField label="Quantity / Actual Stock" name="qty" type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} required />
                        </div>
                    </div>
                    
                    <FormField label="Note" name="notes" type="textarea" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notes adjustment stock table..." required />
                    <button className="w-full bg-blue-600 text-white py-2 rounded mt-2 font-bold">Save Adjustment</button>
                </form>
            </Modal>
        </div>
    );
}