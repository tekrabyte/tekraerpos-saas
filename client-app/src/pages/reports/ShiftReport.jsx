import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../store/auth';
import { 
    Download, Calendar, Store, Search, Clock, 
    CheckCircle, XCircle, RefreshCw, Loader, User, Wallet
} from 'lucide-react';

export default function ShiftReport() {
    // 1. Persiapan User Level
    const { user } = useAuth();
    
    // --- STATE ---
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- FILTERS ---
    const [search, setSearch] = useState("");
    const [outletFilter, setOutletFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- SUMMARY STATE ---
    const [summary, setSummary] = useState({
        total_cash_collected: 0,
        total_sales: 0,
        active_shifts: 0,
        closed_shifts: 0
    });

    // --- LOAD DATA ---
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Load Outlets
                const outletRes = await api.get('/tenant/outlets');
                setOutlets(outletRes.data.outlets || []);

                // 2. Load Shifts
                // Mengirim parameter tanggal ke backend agar data tidak terlalu besar
                const shiftRes = await api.get('/reports/shifts', {
                    params: { start_date: dateRange.start, end_date: dateRange.end }
                });
                setRawData(shiftRes.data.shifts || []);

            } catch (error) {
                console.error('Gagal memuat laporan shift:', error);
                // Fallback data kosong jika endpoint belum siap
                setRawData([]);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [dateRange]);

    // --- FILTER & CALCULATE ---
    useEffect(() => {
        processData();
    }, [rawData, search, outletFilter, statusFilter]);

    const processData = () => {
        let result = rawData;

        // 1. Filter Outlet
        if (outletFilter !== "all") {
            result = result.filter(s => String(s.outlet_id) === String(outletFilter));
        }

        // 2. Filter Status
        if (statusFilter !== "all") {
            result = result.filter(s => s.status === statusFilter);
        }

        // 3. Search (Kasir Name)
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(s => 
                (s.cashier_name && s.cashier_name.toLowerCase().includes(lower))
            );
        }

        setFilteredData(result);

        // 4. Calculate Summary
        const sums = result.reduce((acc, curr) => {
            const cash = parseFloat(curr.closing_cash) || 0; // Uang di laci saat tutup
            const sales = parseFloat(curr.total_sales) || 0; // Total penjualan sesi ini
            
            if (curr.status === 'active') {
                acc.active_shifts += 1;
            } else {
                acc.closed_shifts += 1;
                acc.total_cash_collected += cash; // Hanya hitung cash dari shift yg sudah tutup
                acc.total_sales += sales;
            }
            return acc;
        }, { total_cash_collected: 0, total_sales: 0, active_shifts: 0, closed_shifts: 0 });

        setSummary(sums);
    };

    const formatRp = (num) => `Rp ${parseInt(num).toLocaleString('id-ID')}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });

    const handleExport = () => {
        alert(`Export Laporan Shift: ${dateRange.start} - ${dateRange.end}`);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            
            {/* 1. HEADER */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Shift Kasir</h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Halo, <span className="font-bold">{user?.display_name || 'User'}</span>. Pantau aktivitas buka-tutup kasir di sini.
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
                
                {/* Filter Outlet */}
                <div className="relative group">
                    <div className="absolute left-3 top-2.5 text-gray-400"><Store size={16} /></div>
                    <select 
                        className="pl-9 pr-8 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer min-w-[180px]"
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
                        className="border rounded px-3 py-2 text-sm outline-none appearance-none bg-white min-w-[140px] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Sedang Aktif (Open)</option>
                        <option value="closed">Sudah Tutup (Closed)</option>
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
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari nama kasir..." 
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
            <div className="px-6 pt-6 pb-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-full">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Total Uang Fisik</p>
                        <p className="text-lg font-bold text-gray-900">{formatRp(summary.total_cash_collected)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                        <Store size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Total Penjualan Shift</p>
                        <p className="text-lg font-bold text-gray-900">{formatRp(summary.total_sales)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-full">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Shift Aktif</p>
                        <p className="text-lg font-bold text-gray-900">{summary.active_shifts} <span className="text-xs font-normal text-gray-400">Sesi</span></p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-gray-100 text-gray-600 rounded-full">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Shift Selesai</p>
                        <p className="text-lg font-bold text-gray-900">{summary.closed_shifts} <span className="text-xs font-normal text-gray-400">Sesi</span></p>
                    </div>
                </div>
            </div>

            {/* 4. TABLE CONTENT */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-4">ID Shift</th>
                                <th className="p-4">Kasir</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4">Waktu</th>
                                <th className="p-4 text-right">Modal Awal</th>
                                <th className="p-4 text-right">Penjualan</th>
                                <th className="p-4 text-right">Akhir (Cash)</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-500"><div className="flex justify-center items-center gap-2"><Loader className="animate-spin" size={16}/> Memuat data...</div></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-400">Tidak ada data shift ditemukan.</td></tr>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-500">#{item.id}</td>
                                        <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-[10px] font-bold">
                                                {item.cashier_name ? item.cashier_name.charAt(0) : 'U'}
                                            </div>
                                            {item.cashier_name || 'Unknown'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {outlets.find(o => String(o.id) === String(item.outlet_id))?.name || '-'}
                                        </td>
                                        <td className="p-4 text-xs text-gray-500">
                                            <div className="text-green-700">IN: {formatDate(item.opened_at)}</div>
                                            {item.closed_at && <div className="text-red-700">OUT: {formatDate(item.closed_at)}</div>}
                                        </td>
                                        <td className="p-4 text-right text-gray-600 font-mono text-sm">{formatRp(item.opening_cash)}</td>
                                        <td className="p-4 text-right text-blue-600 font-mono text-sm font-bold">{formatRp(item.total_sales)}</td>
                                        <td className="p-4 text-right text-gray-900 font-mono text-sm font-bold">{item.closed_at ? formatRp(item.closing_cash) : '-'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {item.status === 'active' ? 'Open' : 'Closed'}
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