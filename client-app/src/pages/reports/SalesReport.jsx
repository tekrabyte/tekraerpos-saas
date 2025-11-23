import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { TrendingUp, Calendar } from 'lucide-react';

export default function SalesReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadData();
    }, [dateRange]);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/reports/sales', { params: dateRange });
            setData(res.data.sales || []);
        } catch (error) {
            console.error('Failed to load sales report:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    const handleExport = () => {
        // Export to CSV logic
        const csvContent = [
            ['Tanggal', 'Total Penjualan', 'Jumlah Transaksi', 'Rata-rata per Transaksi'],
            ...data.map(item => [
                item.date,
                item.total_sales,
                item.transaction_count,
                item.average_transaction
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const columns = [
        {
            header: 'Tanggal',
            accessor: (item) => item.date || '-'
        },
        {
            header: 'Total Penjualan',
            accessor: (item) => `Rp ${parseInt(item.total_sales || 0).toLocaleString()}`
        },
        {
            header: 'Jumlah Transaksi',
            accessor: (item) => item.transaction_count || 0
        },
        {
            header: 'Rata-rata per Transaksi',
            accessor: (item) => `Rp ${parseInt(item.average_transaction || 0).toLocaleString()}`
        }
    ];

    return (
        <div>
            <PageHeader 
                title="Laporan Penjualan" 
                subtitle="Analisis data penjualan berdasarkan periode"
            />

            {/* Filter Date Range */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-gray-500" />
                    <div className="flex items-center gap-4 flex-1">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Dari Tanggal</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                data-testid="date-start"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">Sampai Tanggal</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                                data-testid="date-end"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Penjualan</p>
                            <p className="text-3xl font-bold mt-2">
                                Rp {data.reduce((sum, item) => sum + (parseInt(item.total_sales) || 0), 0).toLocaleString()}
                            </p>
                        </div>
                        <TrendingUp size={40} className="text-blue-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Transaksi</p>
                            <p className="text-3xl font-bold mt-2">
                                {data.reduce((sum, item) => sum + (parseInt(item.transaction_count) || 0), 0)}
                            </p>
                        </div>
                        <TrendingUp size={40} className="text-green-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Rata-rata Transaksi</p>
                            <p className="text-3xl font-bold mt-2">
                                Rp {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + (parseInt(item.total_sales) || 0), 0) / data.reduce((sum, item) => sum + (parseInt(item.transaction_count) || 0), 1)).toLocaleString() : 0}
                            </p>
                        </div>
                        <TrendingUp size={40} className="text-purple-200" />
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                onExport={handleExport}
                searchPlaceholder="Cari tanggal..."
            />
        </div>
    );
}