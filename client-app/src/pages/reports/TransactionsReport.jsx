import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../store/auth';
import { 
    Download, Calendar, Search, FileText, Store,
    CheckCircle, XCircle, Clock, Ban, RefreshCw, Loader, Utensils,
    ArrowUpRight 
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

export default function TransactionsReport() {
    const { user } = useAuth();

    // --- STATE ---
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [salesTypesMap, setSalesTypesMap] = useState({});
    const [loading, setLoading] = useState(true);

    // --- TABS ---
    const [activeTab, setActiveTab] = useState('success');

    // --- FILTERS ---
    const [search, setSearch] = useState("");
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [filterSalesType, setFilterSalesType] = useState("all");
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // --- SUMMARY ---
    const [summary, setSummary] = useState({ total_amount: 0, count: 0, avg_value: 0 });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [outletRes, typeRes, orderRes] = await Promise.all([
                    api.get('/tenant/outlets'),
                    api.get('/tenant/data/sales_types'),
                    api.get('/tenant/orders', { params: { start_date: dateRange.start, end_date: dateRange.end } })
                ]);

                setOutlets(outletRes.data.outlets || []);
                
                const typeMap = {};
                (typeRes.data.data || []).forEach(t => typeMap[t.id] = t.name);
                setSalesTypesMap(typeMap);

                setRawData(orderRes.data.orders || []);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        }
        loadData();
    }, [dateRange]);

    useEffect(() => { processData(); }, [rawData, search, filterOutlet, filterSalesType, activeTab, salesTypesMap]);

    const processData = () => {
        let result = rawData;

        if (activeTab === 'success') result = result.filter(t => t.status === 'completed' || t.status === 'paid');
        else if (activeTab === 'cancelled') result = result.filter(t => t.status === 'cancelled');
        else if (activeTab === 'void') result = result.filter(t => t.status === 'void');

        if (filterOutlet !== "all") result = result.filter(t => String(t.outlet_id) === String(filterOutlet));
        
        if (filterSalesType !== "all") {
            result = result.filter(t => {
                const typeName = salesTypesMap[t.sales_type_id] || '';
                return typeName.toLowerCase().includes(filterSalesType.toLowerCase());
            });
        }

        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(t => 
                (t.order_number && t.order_number.toLowerCase().includes(lower)) ||
                (t.customer_name && t.customer_name.toLowerCase().includes(lower))
            );
        }

        setFilteredData(result);

        const total = result.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
        setSummary({
            total_amount: total,
            count: result.length,
            avg_value: result.length > 0 ? total / result.length : 0
        });
    };

    const formatRp = (num) => `Rp ${parseInt(num).toLocaleString('id-ID')}`;
    const formatDate = (dateString) => new Date(dateString).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <PageHeader title="Riwayat Transaksi" subtitle={`Laporan transaksi ${activeTab}`} />

            {/* FILTER BAR */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-100 mb-4 pb-2">
                    {['success', 'cancelled', 'void'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {tab} Orders
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]" value={filterOutlet} onChange={e => setFilterOutlet(e.target.value)}>
                                <option value="all">Semua Outlet</option>
                                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Utensils className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]" value={filterSalesType} onChange={e => setFilterSalesType(e.target.value)}>
                                <option value="all">Semua Tipe</option>
                                <option value="dine in">Dine In</option>
                                <option value="takeaway">Takeaway</option>
                                <option value="delivery">Delivery</option>
                            </select>
                        </div>
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
                            <Calendar size={16} className="text-gray-400 mr-2" />
                            <input type="date" className="text-sm border-none outline-none text-gray-600 cursor-pointer" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                            <span className="text-gray-400 mx-2 text-xs">-</span>
                            <input type="date" className="text-sm border-none outline-none text-gray-600 cursor-pointer" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari No Order..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button onClick={()=>processData()} className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 border border-gray-200"><RefreshCw size={18}/></button>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><FileText size={24} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Total Nilai</p><p className="text-xl font-bold text-gray-900">{formatRp(summary.total_amount)}</p></div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><Store size={24} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Jumlah Order</p><p className="text-xl font-bold text-gray-900">{summary.count}</p></div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full"><ArrowUpRight size={24} /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Rata-rata / Order</p><p className="text-xl font-bold text-gray-900">{formatRp(summary.avg_value)}</p></div>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="p-4">No Order</th>
                                <th className="p-4">Waktu</th>
                                <th className="p-4">Outlet</th>
                                <th className="p-4">Tipe</th>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? <tr><td colSpan="7" className="p-8 text-center"><Loader className="animate-spin inline mr-2"/> Memuat...</td></tr> :
                            filteredData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-blue-600 font-mono text-xs">{item.order_number}</td>
                                    <td className="p-4 text-sm text-gray-600">{formatDate(item.created_at)}</td>
                                    <td className="p-4 text-sm text-gray-700">{outlets.find(o => String(o.id) === String(item.outlet_id))?.name || '-'}</td>
                                    <td className="p-4 text-sm text-gray-700 font-medium">{salesTypesMap[item.sales_type_id] || '-'}</td>
                                    <td className="p-4 text-sm text-gray-800">{item.customer_name || 'Umum'}</td>
                                    <td className="p-4 text-right font-bold text-gray-900 font-mono">{formatRp(item.total)}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'void' ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}