import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../store/auth';
import { 
    Download, Calendar, Search, FileText, Store,
    CheckCircle, XCircle, Clock, Ban, Filter, RefreshCw, Loader, Utensils,
    ArrowUpRight // <--- INI YANG SEBELUMNYA HILANG
} from 'lucide-react';

export default function TransactionsReport() {
    const { user } = useAuth();

    // --- STATE ---
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [salesTypesMap, setSalesTypesMap] = useState({}); // Map ID -> Name
    const [loading, setLoading] = useState(true);

    // --- TABS ---
    const [activeTab, setActiveTab] = useState('success'); // success, cancelled, void

    // --- FILTERS ---
    const [search, setSearch] = useState("");
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [filterSalesType, setFilterSalesType] = useState("all");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- SUMMARY STATE ---
    const [summary, setSummary] = useState({
        total_amount: 0,
        count: 0,
        avg_value: 0
    });

    // --- LOAD DATA ---
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Load Outlets
                const outletRes = await api.get('/tenant/outlets');
                setOutlets(outletRes.data.outlets || []);

                // 2. Load Sales Types
                const typeRes = await api.get('/tenant/data/sales_types');
                const typeMap = {};
                if (typeRes.data.data) {
                    typeRes.data.data.forEach(t => {
                        typeMap[t.id] = t.name;
                    });
                }
                setSalesTypesMap(typeMap);

                // 3. Load Transactions
                const orderRes = await api.get('/tenant/orders', {
                    params: { start_date: dateRange.start, end_date: dateRange.end }
                });
                setRawData(orderRes.data.orders || []);

            } catch (error) {
                console.error('Gagal memuat transaksi:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [dateRange]);

    // --- FILTER & CALCULATE ---
    useEffect(() => {
        processData();
    }, [rawData, search, filterOutlet, filterSalesType, activeTab, salesTypesMap]);

    const processData = () => {
        let result = rawData;

        // 1. Filter Tab (Status)
        if (activeTab === 'success') {
            result = result.filter(t => t.status === 'completed' || t.status === 'paid');
        } else if (activeTab === 'cancelled') {
            result = result.filter(t => t.status === 'cancelled');
        } else if (activeTab === 'void') {
            result = result.filter(t => t.status === 'void');
        }

        // 2. Filter Outlet
        if (filterOutlet !== "all") {
            result = result.filter(t => String(t.outlet_id) === String(filterOutlet));
        }

        // 3. Filter Sales Type
        if (filterSalesType !== "all") {
            result = result.filter(t => {
                const typeName = salesTypesMap[t.sales_type_id] || '';
                return typeName.toLowerCase().includes(filterSalesType.toLowerCase());
            });
        }

        // 4. Search
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(t => 
                (t.order_number && t.order_number.toLowerCase().includes(lower)) ||
                (t.customer_name && t.customer_name.toLowerCase().includes(lower))
            );
        }

        setFilteredData(result);

        // 5. Calculate Summary
        const total = result.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
        setSummary({
            total_amount: total,
            count: result.length,
            avg_value: result.length > 0 ? total / result.length : 0
        });
    };

    const formatRp = (num) => `Rp ${parseInt(num).toLocaleString('id-ID')}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });

    const handleExport = () => {
        alert(`Export Transaksi (${activeTab}): ${dateRange.start} - ${dateRange.end}`);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            
            {/* 1. HEADER */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        User: <span className="font-bold">{user?.display_name}</span>
                    </p>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Download size={18}/> Export
                </button>
            </div>

            {/* 2. TABS NAVIGATION */}
            <div className="bg-white px-6 pt-2 border-b border-gray-200 flex gap-6">
                {['success', 'cancelled', 'void'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                            activeTab === tab 
                                ? 'border-blue-600 text-blue-600' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.replace('_', ' ')} Orders
                    </button>
                ))}
            </div>

            {/* 3. FILTER BAR */}
            <div className="bg-gray-50 border-b px-6 py-3 flex flex-wrap gap-3 items-center">
                
                {/* Filter Outlet */}
                <div className="relative">
                    <Store className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <select 
                        className="border rounded pl-8 pr-8 py-2 text-sm outline-none appearance-none bg-white min-w-[160px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={filterOutlet}
                        onChange={e => setFilterOutlet(e.target.value)}
                    >
                        <option value="all">Semua Outlet</option>
                        {outlets.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Sales Type */}
                <div className="relative">
                    <Utensils className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <select 
                        className="border rounded pl-8 pr-8 py-2 text-sm outline-none appearance-none bg-white min-w-[160px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={filterSalesType}
                        onChange={e => setFilterSalesType(e.target.value)}
                    >
                        <option value="all">Semua Tipe Order</option>
                        <option value="dine in">Dine In</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Delivery</option>
                        <option value="gofood">Gofood</option>
                    </select>
                </div>

                {/* Filter Tanggal */}
                <div className="flex items-center bg-white border rounded px-2 py-1 shadow-sm">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <input 
                        type="date" 
                        className="text-sm border-none focus:ring-0 p-1 text-gray-700 outline-none cursor-pointer"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                    />
                    <span className="text-gray-400 mx-1 text-xs">s/d</span>
                    <input 
                        type="date" 
                        className="text-sm border-none focus:ring-0 p-1 text-gray-700 outline-none cursor-pointer"
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                    />
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari No Order..." 
                        className="w-full pl-9 pr-4 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <button onClick={() => processData()} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-500" title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* 4. SUMMARY CARDS */}
            <div className="px-6 pt-6 pb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Transaksi ({activeTab})</p>
                        <p className="text-2xl font-bold text-gray-900">{formatRp(summary.total_amount)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                        <Store size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Jumlah Order</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Rata-rata Nilai</p>
                        <p className="text-2xl font-bold text-gray-900">{formatRp(summary.avg_value)}</p>
                    </div>
                </div>
            </div>

            {/* 5. TABLE CONTENT */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-4">No Order</th>
                                <th className="p-4">Waktu</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4">Tipe Order</th>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500"><div className="flex justify-center items-center gap-2"><Loader className="animate-spin" size={16}/> Memuat data...</div></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-400">Tidak ada data transaksi {activeTab}.</td></tr>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-blue-600 font-mono text-xs">{item.order_number}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            {outlets.find(o => String(o.id) === String(item.outlet_id))?.name || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 font-medium">
                                            {salesTypesMap[item.sales_type_id] || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-800">{item.customer_name || 'Umum'}</td>
                                        <td className="p-4 text-right font-bold text-gray-900 font-mono">{formatRp(item.total)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                item.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                item.status === 'void' ? 'bg-gray-200 text-gray-600' : 
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {item.status === 'completed' ? <CheckCircle size={10}/> : 
                                                 item.status === 'void' ? <Ban size={10}/> : <XCircle size={10}/>}
                                                {item.status}
                                            </span>
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