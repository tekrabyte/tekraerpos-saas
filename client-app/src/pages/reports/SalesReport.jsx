import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../store/auth';
import { 
    Download, Calendar, Store, Search, FileBarChart, 
    ChevronDown, Filter, RefreshCw, Loader 
} from 'lucide-react';

export default function SalesReport() {
    const { user } = useAuth();
    
    // --- STATE ---
    const [rawData, setRawData] = useState([]); // Data mentah orders
    const [reportData, setReportData] = useState([]); // Data hasil olahan untuk tabel
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- FILTERS ---
    const [reportScope, setReportScope] = useState("summary"); // Menu Scope Pilihan
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- MENU SCOPES ---
    const reportMenus = [
        { id: 'summary', label: 'Sales Summary' },
        { id: 'gross_profit', label: 'Gross Profit' },
        { id: 'payment_methods', label: 'Payment Methods' },
        { id: 'sales_type', label: 'Sales Type' },
        { id: 'item_sales', label: 'Item Sales' },
        { id: 'category_sales', label: 'Category Sales' },
        { id: 'discounts', label: 'Discounts' },
        { id: 'taxes', label: 'Taxes' },
        { id: 'collected_by', label: 'Collected By (Staff)' },
    ];

    // --- LOAD DATA ---
    useEffect(() => {
        async function initData() {
            setLoading(true);
            try {
                // 1. Load Outlets
                const outletRes = await api.get('/tenant/outlets');
                setOutlets(outletRes.data.outlets || []);

                // 2. Load Orders (Raw Data)
                const orderRes = await api.get('/tenant/orders', {
                    params: { start_date: dateRange.start, end_date: dateRange.end }
                });
                
                setRawData(orderRes.data.orders || []);
            } catch (error) {
                console.error('Gagal memuat data:', error);
            } finally {
                setLoading(false);
            }
        }
        initData();
    }, [dateRange]);

    // --- PROCESS DATA BASED ON SCOPE ---
    useEffect(() => {
        // Reset report data saat ganti scope untuk mencegah render error
        setReportData([]); 
        
        // Gunakan timeout kecil agar UI sempat clear sebelum process data berat
        const timer = setTimeout(() => {
            processData();
        }, 0);
        
        return () => clearTimeout(timer);
    }, [rawData, reportScope, filterOutlet]);

    const processData = () => {
        // 1. Filter Outlet & Status
        let filtered = rawData.filter(t => {
            const isOutlet = filterOutlet === "all" || String(t.outlet_id) === String(filterOutlet);
            return isOutlet && t.status === 'completed';
        });

        let processed = [];

        // 2. Grouping Logic
        switch (reportScope) {
            case 'summary':
                const totals = filtered.reduce((acc, t) => ({
                    gross: acc.gross + (parseFloat(t.subtotal) || 0) + (parseFloat(t.discount_amount) || 0),
                    discount: acc.discount + (parseFloat(t.discount_amount) || 0),
                    net: acc.net + (parseFloat(t.subtotal) || 0),
                    tax: acc.tax + (parseFloat(t.tax_amount) || 0),
                    gratuity: acc.gratuity + (parseFloat(t.gratuity_amount) || 0),
                    total: acc.total + (parseFloat(t.total) || 0)
                }), { gross: 0, discount: 0, net: 0, tax: 0, gratuity: 0, total: 0 });

                processed = [
                    { label: 'Gross Sales', value: totals.gross },
                    { label: 'Discounts', value: -totals.discount, isRed: true },
                    { label: 'Net Sales', value: totals.net, isBold: true },
                    { label: 'Taxes', value: totals.tax },
                    { label: 'Gratuity', value: totals.gratuity },
                    { label: 'Total Collected', value: totals.total, isTotal: true }
                ];
                break;

            case 'payment_methods':
                const payMap = {};
                filtered.forEach(t => {
                    const method = t.payment_method || 'Unknown';
                    if(!payMap[method]) payMap[method] = { name: method, count: 0, total: 0 };
                    payMap[method].count += 1;
                    payMap[method].total += parseFloat(t.total);
                });
                processed = Object.values(payMap);
                break;
            
            case 'sales_type':
                const typeMap = {};
                filtered.forEach(t => {
                    // Mapping manual ID Sales Type ke Nama (Bisa diambil dari state jika ada master data)
                    const typeName = t.sales_type_id === '1' ? 'Dine In' : (t.sales_type_id === '2' ? 'Takeaway' : 'Delivery'); 
                    if(!typeMap[typeName]) typeMap[typeName] = { name: typeName, count: 0, total: 0 };
                    typeMap[typeName].count += 1;
                    typeMap[typeName].total += parseFloat(t.total);
                });
                processed = Object.values(typeMap);
                break;

            case 'item_sales':
            case 'gross_profit':
                const itemMap = {};
                filtered.forEach(t => {
                    // Mockup: ambil items dari order. 
                    // Pastikan backend mengirim 'items' atau structure yang sesuai
                    if(t.items && Array.isArray(t.items)) {
                        t.items.forEach(i => {
                            const itemName = i.name || i.product_name;
                            if(!itemMap[itemName]) itemMap[itemName] = { name: itemName, sold: 0, gross: 0, cost: 0 };
                            itemMap[itemName].sold += parseInt(i.qty);
                            itemMap[itemName].gross += parseFloat(i.subtotal);
                            itemMap[itemName].cost += (parseFloat(i.cost_price || 0) * parseInt(i.qty));
                        });
                    }
                });
                processed = Object.values(itemMap).map(i => ({
                    ...i,
                    profit: i.gross - i.cost
                }));
                break;

            case 'collected_by':
                const staffMap = {};
                filtered.forEach(t => {
                    const staff = t.created_by_name || `Staff #${t.created_by}`;
                    if(!staffMap[staff]) staffMap[staff] = { name: staff, count: 0, total: 0 };
                    staffMap[staff].count += 1;
                    staffMap[staff].total += parseFloat(t.total);
                });
                processed = Object.values(staffMap);
                break;

            default:
                processed = [];
        }
        
        setReportData(processed);
    };

    // --- RENDER TABLE HEADER ---
    const renderTableHeader = () => {
        switch (reportScope) {
            case 'summary': return (<tr><th className="p-4">Description</th><th className="p-4 text-right">Amount</th></tr>);
            case 'payment_methods':
            case 'sales_type': 
            case 'collected_by': return (<tr><th className="p-4">Name</th><th className="p-4 text-right">Transaction Count</th><th className="p-4 text-right">Total Collected</th></tr>);
            case 'item_sales': return (<tr><th className="p-4">Item Name</th><th className="p-4 text-right">Qty Sold</th><th className="p-4 text-right">Total Sales</th></tr>);
            case 'gross_profit': return (<tr><th className="p-4">Item Name</th><th className="p-4 text-right">Gross Sales</th><th className="p-4 text-right">Cost (COGS)</th><th className="p-4 text-right">Gross Profit</th></tr>);
            default: return (<tr><th className="p-4">Data</th><th className="p-4 text-right">Value</th></tr>);
        }
    };

    // --- RENDER TABLE BODY ---
    const renderTableBody = () => {
        if (reportData.length === 0) {
            return (<tr><td colSpan="5" className="p-8 text-center text-gray-400">Tidak ada data untuk periode ini.</td></tr>);
        }

        return reportData.map((row, idx) => {
            // PERBAIKAN: Tambahkan (row.value || 0) untuk mencegah error toLocaleString undefined
            if (reportScope === 'summary') {
                return (
                    <tr key={idx} className={`border-b ${row.isTotal ? 'bg-gray-100 font-bold text-lg' : ''} ${row.isBold ? 'font-bold text-gray-800' : ''}`}>
                        <td className="p-4 text-gray-700">{row.label}</td>
                        <td className={`p-4 text-right font-mono ${row.isRed ? 'text-red-500' : 'text-gray-900'}`}>
                            {typeof row.value === 'number' ? `Rp ${row.value.toLocaleString()}` : row.value}
                        </td>
                    </tr>
                );
            } else if (reportScope === 'gross_profit') {
                return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{row.name}</td>
                        <td className="p-4 text-right font-mono">Rp {(row.gross || 0).toLocaleString()}</td>
                        <td className="p-4 text-right font-mono text-red-500">Rp {(row.cost || 0).toLocaleString()}</td>
                        <td className="p-4 text-right font-mono text-green-600 font-bold">Rp {(row.profit || 0).toLocaleString()}</td>
                    </tr>
                );
            } else if (['payment_methods', 'sales_type', 'collected_by'].includes(reportScope)) {
                 return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{row.name}</td>
                        <td className="p-4 text-right">{row.count || 0}</td>
                        <td className="p-4 text-right font-mono font-bold">Rp {(row.total || 0).toLocaleString()}</td>
                    </tr>
                );
            } else {
                // Default Item Sales etc
                 return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{row.name}</td>
                        <td className="p-4 text-right">{row.sold || 0}</td>
                        <td className="p-4 text-right font-mono font-bold">Rp {(row.gross || 0).toLocaleString()}</td>
                    </tr>
                );
            }
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* 1. HEADER */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
                    <p className="text-xs text-gray-500 mt-1">Analisa data penjualan harian outlet.</p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-colors">
                    <Download size={18}/> Export
                </button>
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-gray-50 border-b px-6 py-3 flex flex-wrap gap-3 items-center">
                
                {/* JENIS LAPORAN (SCOPE) */}
                <div className="relative">
                    <FileBarChart className="absolute left-2 top-2.5 text-blue-600" size={16} />
                    <select 
                        className="border border-blue-300 bg-blue-50 text-blue-800 rounded pl-8 pr-8 py-2 text-sm font-bold outline-none cursor-pointer hover:bg-blue-100 transition-colors appearance-none min-w-[180px]"
                        value={reportScope}
                        onChange={e => setReportScope(e.target.value)}
                    >
                        {reportMenus.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 text-blue-600 pointer-events-none" size={16} />
                </div>

                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                {/* Filter Outlet */}
                <div className="relative">
                    <Store className="absolute left-2 top-2.5 text-gray-400" size={16} />
                    <select 
                        className="border rounded pl-8 pr-8 py-2 text-sm outline-none appearance-none bg-white min-w-[160px] focus:ring-2 focus:ring-blue-500"
                        value={filterOutlet}
                        onChange={e => setFilterOutlet(e.target.value)}
                    >
                        <option value="all">Semua Outlet</option>
                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={16} />
                </div>

                {/* Filter Date */}
                <div className="flex items-center bg-white border rounded px-2 py-1 shadow-sm">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <input 
                        type="date" 
                        className="text-sm border-none focus:ring-0 p-1 text-gray-700 outline-none"
                        value={dateRange.start}
                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                    />
                    <span className="text-gray-400 mx-1 text-xs">s/d</span>
                    <input 
                        type="date" 
                        className="text-sm border-none focus:ring-0 p-1 text-gray-700 outline-none"
                        value={dateRange.end}
                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                    />
                </div>

                <button onClick={() => processData()} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-gray-500" title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* 3. CONTENT TABLE */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded shadow border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
                            {reportMenus.find(m => m.id === reportScope)?.label || 'Report Data'}
                        </h3>
                        <span className="text-xs text-gray-500">
                            Periode: {dateRange.start} - {dateRange.end}
                        </span>
                    </div>
                    
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                            {renderTableHeader()}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500"><Loader className="animate-spin inline mr-2" size={16}/> Memuat data...</td></tr>
                            ) : renderTableBody()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}