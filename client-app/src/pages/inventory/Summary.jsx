import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Store, Search, Calendar, RefreshCw, Filter, Download } from 'lucide-react';

export default function Summary() {
    const [data, setData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, [filterOutlet, dateRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resOutlets, resProducts] = await Promise.all([
                api.get('/tenant/outlets'),
                // Idealnya ada endpoint khusus report inventory summary
                // Disini kita load products sebagai base data
                api.get('/tenant/products', { params: { outlet_id: filterOutlet !== 'all' ? filterOutlet : '' } })
            ]);

            setOutlets(resOutlets.data.outlets || []);
            
            // Mockup Calculation Logic (Simulasi Mutasi Stok)
            // Di production, ini harus dihitung di backend berdasarkan stock_logs
            const processedData = (resProducts.data.products || []).map(p => {
                const currentStock = parseInt(p.stock);
                // Angka dummy untuk simulasi pergerakan (karena belum ada endpoint history real)
                const sales = Math.floor(Math.random() * 10);
                const po = Math.floor(Math.random() * 5);
                const transfer = 0;
                const adj = 0;
                const beginning = currentStock + sales - po;

                return {
                    id: p.id,
                    name: p.name,
                    variant: '-', // Jika ada varian
                    category: 'General', // Perlu join kategori
                    outlet: outlets.find(o => o.id == filterOutlet)?.name || 'All Outlets',
                    beginning,
                    purchase_order: po,
                    sales: sales,
                    transfer: transfer,
                    adjustment: adj,
                    ending: currentStock
                };
            });

            setData(processedData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = data.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Summary</h1>
                    <p className="text-xs text-gray-500 mt-1">Laporan mutasi stok per periode</p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm">
                    <Download size={18}/> Export
                </button>
            </div>

            {/* Filter */}
            <div className="bg-gray-50 border-b px-6 py-3 flex flex-wrap gap-3 items-center">
                <div className="relative">
                    <Store className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <select className="border rounded pl-8 pr-3 py-2 text-sm outline-none bg-white min-w-[160px]" 
                        value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}>
                        <option value="all">Semua Outlet</option>
                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>
                
                <div className="flex items-center bg-white border rounded px-2 py-1 shadow-sm">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <input type="date" className="text-sm border-none outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-gray-400 mx-1 text-xs">s/d</span>
                    <input type="date" className="text-sm border-none outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Cari produk..." className="w-full pl-10 pr-4 py-2 border rounded outline-none" 
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b font-bold text-gray-700">
                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Variant</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4 text-right bg-gray-100">Beginning</th>
                                <th className="p-4 text-right">Purchase</th>
                                <th className="p-4 text-right">Sales</th>
                                <th className="p-4 text-right">Transfer</th>
                                <th className="p-4 text-right">Adjustment</th>
                                <th className="p-4 text-right bg-blue-50 text-blue-700">Ending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium">{row.name}</td>
                                    <td className="p-4 text-gray-500">{row.variant}</td>
                                    <td className="p-4 text-gray-500">{row.category}</td>
                                    <td className="p-4 text-gray-500">{row.outlet}</td>
                                    <td className="p-4 text-right bg-gray-50 font-mono">{row.beginning}</td>
                                    <td className="p-4 text-right font-mono text-green-600">{row.purchase_order > 0 ? `+${row.purchase_order}` : '-'}</td>
                                    <td className="p-4 text-right font-mono text-red-600">{row.sales > 0 ? `-${row.sales}` : '-'}</td>
                                    <td className="p-4 text-right font-mono">{row.transfer}</td>
                                    <td className="p-4 text-right font-mono">{row.adjustment}</td>
                                    <td className="p-4 text-right bg-blue-50 font-bold font-mono text-blue-700">{row.ending}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}