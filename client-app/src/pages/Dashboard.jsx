import React, { useEffect, useState } from "react";
import api from "../api/client";
import { 
    Store, Calendar, ChevronDown, BarChart3, 
    AlertCircle, X, ArrowRight, ArrowLeft 
} from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

// Registrasi komponen Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState("summary"); // 'summary' | 'comparison'
    const [stats, setStats] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [filterOutlet, setFilterOutlet] = useState("all");
    const [dateRange, setDateRange] = useState("today");
    
    // Comparison Metric State
    const [compMetric, setCompMetric] = useState("gross_sales"); 

    // Notification Banner
    const [showBanner, setShowBanner] = useState(true);

    // --- LOAD DATA ---
    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [filterOutlet, dateRange]);

    const loadInitialData = async () => {
        try {
            const outletRes = await api.get('/tenant/outlets');
            setOutlets(outletRes.data.outlets || []);
            await loadDashboardData();
        } catch (e) {
            console.error("Init error", e);
        }
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/dashboard/sales", {
                params: {
                    outlet_id: filterOutlet !== 'all' ? filterOutlet : '',
                    period: dateRange
                }
            });
            setStats(res.data);
        } catch (e) {
            console.error("Load data error", e);
        } finally {
            setLoading(false);
        }
    };

    // --- CALCULATIONS (Real Data Logic) ---
    const summary = stats?.summary || { revenue: 0, orders: 0 };
    const dailyData = stats?.daily || [];

    // Helper: Format Currency
    const formatRp = (val) => `Rp ${parseInt(val || 0).toLocaleString('id-ID')}`;
    const formatNum = (val) => parseInt(val || 0).toLocaleString('id-ID');

    // Data Summary Values
    const valGross = parseInt(summary.revenue) || 0;
    const valNet = valGross; // Logic placeholder jika belum ada diskon/pajak di API
    const valProfit = valGross * 0.3; // Placeholder margin logic
    const valTrans = parseInt(summary.orders) || 0;
    const valAvg = valTrans > 0 ? valGross / valTrans : 0;
    const valMargin = valGross > 0 ? (valProfit / valGross) * 100 : 0;

    // --- CHART CONFIG ---
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { border: { dash: [4, 4] }, grid: { color: '#f3f4f6' }, ticks: { maxTicksLimit: 5 } }
        }
    };

    const dayChartData = {
        labels: dailyData.map(d => new Date(d.d).toLocaleDateString('id-ID', { weekday: 'short' })).reverse(),
        datasets: [{
            label: 'Sales',
            data: dailyData.map(d => d.t).reverse(),
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barThickness: 20,
        }]
    };

    // Data untuk Outlet Comparison Chart (Real Mapping)
    const comparisonChartData = {
        labels: outlets.map(o => o.name),
        datasets: [{
            label: compMetric.replace('_', ' ').toUpperCase(),
            // Saat ini API dashboard hanya return total global/single outlet. 
            // Untuk comparison real, backend perlu endpoint baru. 
            // Di sini kita mapping 0 jika tidak ada data spesifik per outlet di 'stats'.
            data: outlets.map(() => 0), 
            backgroundColor: '#5babfa',
            borderRadius: 4,
            barThickness: 40,
        }]
    };

    return (
        <div className="flex flex-col h-full bg-white md:bg-gray-50/50 overflow-y-auto">
            
            {/* --- HEADER & TABS --- */}
            <div className="px-8 pt-8 pb-4 bg-white md:bg-transparent">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h2 className="text-3xl font-medium text-neutral-900">Dashboard</h2>
                </header>

                {/* Tab Navigation */}
                <div className="border-b border-neutral-300 mb-6 flex gap-8">
                    <button 
                        onClick={() => setActiveTab("summary")}
                        className={`pb-3 text-base font-medium transition-colors relative ${
                            activeTab === "summary" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Summary
                        {activeTab === "summary" && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab("comparison")}
                        className={`pb-3 text-base font-medium transition-colors relative ${
                            activeTab === "comparison" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        Outlet Comparison
                        {activeTab === "comparison" && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-md"></div>}
                    </button>
                </div>

                {/* Filters Area */}
                <div className="flex flex-wrap gap-3 mb-6">
                    {/* Outlet Filter */}
                    <div className="relative w-56">
                        <div className="absolute left-3 top-2.5 text-white pointer-events-none">
                            <Store size={18} />
                        </div>
                        <select 
                            className="w-full pl-10 pr-8 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-gray-400 outline-none appearance-none cursor-pointer"
                            value={filterOutlet}
                            onChange={(e) => setFilterOutlet(e.target.value)}
                        >
                            <option value="all">{outlets.length} Outlets</option>
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-white pointer-events-none" size={14} />
                    </div>

                    {/* Date Navigation */}
                    <div className="flex bg-white border border-neutral-300 rounded-lg overflow-hidden">
                        <button className="px-3 py-2 hover:bg-gray-50 border-r"><ArrowLeft size={16}/></button>
                        <select 
                            className="px-4 py-2 text-sm font-medium text-gray-700 outline-none hover:bg-gray-50 cursor-pointer appearance-none text-center min-w-[140px]"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="today">Hari Ini</option>
                            <option value="yesterday">Kemarin</option>
                            <option value="this_week">Minggu Ini</option>
                            <option value="this_month">Bulan Ini</option>
                        </select>
                        <button className="px-3 py-2 hover:bg-gray-50 border-l"><ArrowRight size={16}/></button>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="px-8 pb-20">
                
                {/* TAB: SUMMARY */}
                {activeTab === "summary" && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Sales Summary Cards */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">SALES SUMMARY</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SummaryCard title="GROSS SALES" value={formatRp(valGross)} />
                                <SummaryCard title="NET SALES" value={formatRp(valNet)} color="text-blue-600" />
                                <SummaryCard title="GROSS PROFIT" value={formatRp(valProfit)} />
                                <SummaryCard title="TRANSACTIONS" value={valTrans} />
                                <SummaryCard title="AVG SALE PER TRANSACTION" value={formatRp(valAvg)} />
                                <SummaryCard title="GROSS MARGIN" value={`${valMargin.toFixed(2)}%`} />
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Day Chart */}
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">DAY OF THE WEEK GROSS SALES</h3>
                                <div className="h-[200px]">
                                    {loading ? <div className="h-full bg-gray-100 animate-pulse rounded"></div> :
                                     dailyData.length > 0 ? <Bar data={dayChartData} options={chartOptions} /> : 
                                     <EmptyChart msg="Belum ada data penjualan" />}
                                </div>
                            </div>

                            {/* Hourly Chart (Placeholder Layout) */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">HOURLY GROSS SALES AMOUNT</h3>
                                <div className="h-[200px]">
                                    <EmptyChart msg="Data per jam belum tersedia" />
                                </div>
                            </div>
                        </div>

                        {/* Item Summary Link */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-700 mb-2 cursor-pointer hover:text-blue-600 flex items-center gap-2">
                                ITEM SUMMARY <ArrowRight size={16}/>
                            </h3>
                        </div>
                    </div>
                )}

                {/* TAB: OUTLET COMPARISON */}
                {activeTab === "comparison" && (
                    <div className="animate-in fade-in duration-300">
                        
                        {/* 1. TABLE SUMMARY */}
                        <div className="mb-10">
                            <div className="mb-4 border-b border-neutral-300 pb-2">
                                <h2 className="text-lg text-neutral-700 font-medium">TABLE SUMMARY</h2>
                            </div>
                            
                            {/* Flex Container for Fixed Left Column + Scrollable Right */}
                            <div className="flex items-start">
                                {/* LEFT: Metrics Header */}
                                <div className="w-[240px] min-w-[240px] flex-shrink-0 border border-blue-200 rounded-l-lg overflow-hidden bg-white z-10 shadow-sm">
                                    <div className="h-[50px] bg-blue-50 border-b border-blue-200 px-4 flex items-center font-bold text-sm text-blue-900">Sales Summary</div>
                                    <div className="divide-y divide-gray-100 text-sm text-gray-600">
                                        <div className="px-4 py-3">Gross Sales</div>
                                        <div className="px-4 py-3">Net Sales</div>
                                        <div className="px-4 py-3">Gross Profit</div>
                                        <div className="px-4 py-3">Transaction</div>
                                        <div className="px-4 py-3">Avg Sale/Trans</div>
                                        <div className="px-4 py-3">Gross Margin</div>
                                        <div className="h-[50px] bg-blue-50 border-y border-blue-200 px-4 flex items-center font-bold text-sm text-blue-900">Items</div>
                                        <div className="px-4 py-3 h-[80px]">Top 3 Items</div>
                                    </div>
                                </div>

                                {/* RIGHT: Outlets Data (Scrollable) */}
                                <div className="flex-1 overflow-x-auto pb-4 -ml-[1px]"> {/* negative margin to merge borders */}
                                    <div className="flex">
                                        {outlets.length === 0 ? (
                                            <div className="p-4 text-gray-400 text-sm italic w-full text-center border border-gray-200 rounded-r-lg">Tidak ada outlet terdaftar</div>
                                        ) : (
                                            outlets.map((outlet, idx) => (
                                                <div key={outlet.id} className={`w-[200px] min-w-[200px] flex-shrink-0 border-y border-r border-gray-200 bg-white ${idx === outlets.length-1 ? 'rounded-r-lg' : ''}`}>
                                                    <div className="h-[50px] bg-gray-100 border-b border-gray-200 px-4 flex items-center justify-center font-bold text-sm text-gray-800 truncate">
                                                        {outlet.name}
                                                    </div>
                                                    <div className="divide-y divide-gray-100 text-sm text-gray-600 text-center">
                                                        {/* Mapping Real Data (Placeholder logic: saat ini 0 karena API belum support detail per outlet di list) */}
                                                        <div className="px-2 py-3">{formatRp(0)}</div>
                                                        <div className="px-2 py-3">{formatRp(0)}</div>
                                                        <div className="px-2 py-3">{formatRp(0)}</div>
                                                        <div className="px-2 py-3">0</div>
                                                        <div className="px-2 py-3">{formatRp(0)}</div>
                                                        <div className="px-2 py-3">0%</div>
                                                        
                                                        <div className="h-[50px] bg-gray-50 border-y border-gray-200"></div>
                                                        
                                                        <div className="px-2 py-3 h-[80px] text-xs text-gray-400 italic flex items-center justify-center">
                                                            (No data)
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. GRAPH COMPARISON */}
                        <div>
                            <div className="mb-4 border-b border-neutral-300 pb-2">
                                <h2 className="text-lg text-neutral-700 font-medium">GRAPH COMPARISON</h2>
                            </div>

                            {/* Metric Tabs */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {['gross_sales', 'net_sales', 'gross_profit', 'transaction', 'avg_sale'].map((m) => (
                                    <button 
                                        key={m}
                                        onClick={() => setCompMetric(m)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all ${
                                            compMetric === m 
                                                ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-300' 
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {m.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* Chart Box */}
                            <div className="border border-gray-200 rounded-lg p-6 bg-white">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-6">{compMetric.replace('_', ' ')} AMOUNT</p>
                                <div className="h-[300px]">
                                    {outlets.length > 0 ? (
                                        <Bar data={comparisonChartData} options={chartOptions} />
                                    ) : (
                                        <EmptyChart msg="Butuh minimal 1 outlet untuk perbandingan" />
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}

// --- UI Helpers ---

function SummaryCard({ title, value, color = "text-gray-800" }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

function EmptyChart({ msg }) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
            <BarChart3 size={32} className="mb-2 opacity-50"/>
            <span className="text-xs">{msg}</span>
        </div>
    );
}