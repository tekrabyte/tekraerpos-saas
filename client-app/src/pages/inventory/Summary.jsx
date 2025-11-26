import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
    Store, Search, Calendar, Download, 
    Loader, BarChart3, ArrowRight 
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function Summary() {
    // --- STATE ---
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- FILTERS ---
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, [filterOutlet, dateRange]);

    useEffect(() => {
        if (search) {
            const lower = search.toLowerCase();
            setFilteredData(data.filter(i => 
                i.name.toLowerCase().includes(lower) || 
                (i.category && i.category.toLowerCase().includes(lower))
            ));
        } else {
            setFilteredData(data);
        }
    }, [search, data]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resOutlets, resProducts] = await Promise.all([
                api.get('/tenant/outlets'),
                // Mengambil produk berdasarkan outlet yang dipilih
                api.get('/tenant/products', { params: { outlet_id: filterOutlet !== 'all' ? filterOutlet : '' } })
            ]);

            setOutlets(resOutlets.data.outlets || []);
            
            // --- MOCKUP CALCULATION LOGIC ---
            // Karena belum ada endpoint history stok yang lengkap, 
            // kita simulasi perhitungan mutasi berdasarkan stok saat ini.
            const processedData = (resProducts.data.products || []).map(p => {
                const currentStock = parseInt(p.stock);
                // Angka dummy untuk simulasi (Di production ini dari API report/inventory-summary)
                const sales = Math.floor(Math.random() * 10); 
                const po = Math.floor(Math.random() * 5);
                const transfer = 0;
                const adj = 0;
                const beginning = currentStock + sales - po; // Rumus: Awal = Akhir + Keluar - Masuk

                return {
                    id: p.id,
                    name: p.name,
                    variant: '-', // Jika ada varian
                    category: 'General', // Perlu join kategori jika ada ID
                    outlet: outlets.find(o => String(o.id) === String(filterOutlet))?.name || 'All Outlets',
                    beginning,
                    purchase_order: po,
                    sales: sales,
                    transfer: transfer,
                    adjustment: adj,
                    ending: currentStock
                };
            });

            setData(processedData);
            setFilteredData(processedData);
        } catch (e) {
            console.error("Gagal load summary", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Inventory Summary" subtitle="Laporan mutasi stok per periode" />

            {/* HEADER ACTIONS & FILTER */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    {/* KIRI: Filters */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {/* Outlet Filter */}
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

                    {/* KANAN: Search & Export */}
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari Produk..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm">
                            <Download size={18}/> <span className="hidden md:inline">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b font-bold text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="p-4">Product Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4 text-right bg-gray-100 border-l">Awal</th>
                                <th className="p-4 text-right text-green-700 bg-green-50">Masuk (PO)</th>
                                <th className="p-4 text-right text-red-700 bg-red-50">Keluar (Sales)</th>
                                <th className="p-4 text-right">Transfer</th>
                                <th className="p-4 text-right">Adj</th>
                                <th className="p-4 text-right bg-blue-50 text-blue-800 border-l font-black">Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan="9" className="p-12 text-center text-gray-500"><Loader className="animate-spin inline mr-2" size={20}/> Menghitung stok...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="9" className="p-12 text-center text-gray-400">Data tidak ditemukan.</td></tr>
                            ) : (
                                filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{row.name} <div className="text-[10px] text-gray-400">{row.variant}</div></td>
                                        <td className="p-4 text-gray-500">{row.category}</td>
                                        <td className="p-4 text-gray-500">{row.outlet}</td>
                                        
                                        {/* Kolom Angka */}
                                        <td className="p-4 text-right bg-gray-50 font-mono text-gray-600 border-l">{row.beginning}</td>
                                        <td className="p-4 text-right font-mono text-green-600 bg-green-50/30">
                                            {row.purchase_order > 0 ? `+${row.purchase_order}` : '-'}
                                        </td>
                                        <td className="p-4 text-right font-mono text-red-600 bg-red-50/30">
                                            {row.sales > 0 ? `-${row.sales}` : '-'}
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-500">
                                            {row.transfer !== 0 ? row.transfer : '-'}
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-500">
                                            {row.adjustment !== 0 ? row.adjustment : '-'}
                                        </td>
                                        <td className="p-4 text-right bg-blue-50 font-bold font-mono text-blue-700 border-l text-base">
                                            {row.ending}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}