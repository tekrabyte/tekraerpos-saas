import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../store/auth';
import { 
    Download, Calendar, Search, FileText, Store,
    CheckCircle, Clock, AlertCircle, RefreshCw, Loader 
} from 'lucide-react';

export default function InvoicesReport() {
    // 1. Persiapan User Level (Data User & Role)
    const { user } = useAuth(); 
    // const isOwner = user?.role === 'owner'; // Contoh penggunaan

    // --- STATE ---
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [outlets, setOutlets] = useState([]); // State untuk data outlet
    const [loading, setLoading] = useState(true);

    // --- FILTERS ---
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [outletFilter, setOutletFilter] = useState("all"); // Filter Outlet Baru
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- SUMMARY STATE ---
    const [summary, setSummary] = useState({
        total_invoiced: 0,
        total_paid: 0,
        total_pending: 0,
        count: 0
    });

    // --- LOAD DATA ---
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Load Outlets untuk Filter
                const outletRes = await api.get('/tenant/outlets');
                setOutlets(outletRes.data.outlets || []);

                // 2. Load Orders (Invoices)
                const res = await api.get('/tenant/orders', {
                    params: { start_date: dateRange.start, end_date: dateRange.end }
                });
                setRawData(res.data.orders || []);
            } catch (error) {
                console.error("Gagal memuat invoice:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [dateRange]);

    // --- FILTER & CALCULATE ---
    useEffect(() => {
        processData();
    }, [rawData, search, statusFilter, outletFilter]); // Trigger saat filter berubah

    const processData = () => {
        let result = rawData;

        // 1. Filter Outlet
        if (outletFilter !== "all") {
            result = result.filter(i => String(i.outlet_id) === String(outletFilter));
        }

        // 2. Filter Status
        if (statusFilter !== "all") {
            result = result.filter(i => i.status === statusFilter);
        }

        // 3. Filter Search (No Invoice / Customer)
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(i => 
                (i.order_number && i.order_number.toLowerCase().includes(lower)) ||
                (i.customer_name && i.customer_name.toLowerCase().includes(lower))
            );
        }

        setFilteredData(result);

        // 4. Calculate Summary
        const sums = result.reduce((acc, curr) => {
            const total = parseFloat(curr.total) || 0;
            acc.total_invoiced += total;
            acc.count += 1;
            
            if (curr.status === 'completed' || curr.status === 'paid') {
                acc.total_paid += total;
            } else {
                acc.total_pending += total; // Pending, unpaid, cancelled (opsional exclude cancelled)
            }
            return acc;
        }, { total_invoiced: 0, total_paid: 0, total_pending: 0, count: 0 });

        setSummary(sums);
    };

    const formatRp = (num) => `Rp ${parseInt(num).toLocaleString('id-ID')}`;

    const handleExport = () => {
        alert(`Export data Invoice dari ${dateRange.start} s/d ${dateRange.end}`);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            
            {/* 1. HEADER */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Invoice</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Halo, <span className="font-bold">{user?.display_name || 'User'}</span>. Ini rekapitulasi tagihan toko Anda.
                    </p>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Download size={18}/> Export
                </button>
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-gray-50 border-b px-6 py-3 flex flex-wrap gap-3 items-center">
                
                {/* Filter Outlet (BARU) */}
                <div className="relative">
                    <Store className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <select 
                        className="border rounded pl-8 pr-8 py-2 text-sm outline-none appearance-none bg-white min-w-[160px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={outletFilter}
                        onChange={e => setOutletFilter(e.target.value)}
                    >
                        <option value="all">Semua Outlet</option>
                        {outlets.map(o => (
                            <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                    </select>
                </div>

                {/* Filter Status */}
                <div className="relative">
                    <select 
                        className="border rounded pl-3 pr-8 py-2 text-sm outline-none appearance-none bg-white min-w-[150px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Semua Status</option>
                        <option value="completed">Lunas (Paid)</option>
                        <option value="pending">Belum Lunas (Pending)</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>
                </div>

                {/* Filter Date */}
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
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari No Invoice / Nama Pelanggan..." 
                        className="w-full pl-9 pr-4 py-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <button onClick={() => processData()} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-500" title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* 3. SUMMARY CARDS */}
            <div className="px-6 pt-6 pb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Tagihan</p>
                        <p className="text-2xl font-bold text-gray-900">{formatRp(summary.total_invoiced)}</p>
                        <p className="text-xs text-gray-400">{summary.count} Invoice</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Sudah Dibayar</p>
                        <p className="text-2xl font-bold text-green-600">{formatRp(summary.total_paid)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Belum Lunas / Pending</p>
                        <p className="text-2xl font-bold text-orange-600">{formatRp(summary.total_pending)}</p>
                    </div>
                </div>
            </div>

            {/* 4. TABLE CONTENT */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-4">No Invoice</th>
                                <th className="p-4">Tanggal</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500"><div className="flex justify-center items-center gap-2"><Loader className="animate-spin" size={16}/> Memuat data...</div></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Tidak ada data invoice ditemukan.</td></tr>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-blue-600">{item.order_number}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {outlets.find(o => o.id === item.outlet_id)?.name || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-800">{item.customer_name || 'Umum'}</td>
                                        <td className="p-4 text-right font-bold text-gray-900 font-mono">{formatRp(item.total)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                item.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.status === 'completed' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                                                {item.status === 'completed' ? 'PAID' : item.status}
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