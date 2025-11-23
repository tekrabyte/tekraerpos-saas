import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { Clock, User } from 'lucide-react';

export default function ShiftReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/reports/shifts');
            setData(res.data.shifts || []);
        } catch (error) {
            console.error('Failed to load shift report:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    const handleExport = () => {
        const csvContent = [
            ['Shift ID', 'Kasir', 'Outlet', 'Buka', 'Tutup', 'Modal Awal', 'Penjualan', 'Modal Akhir', 'Status'],
            ...data.map(item => [
                item.id,
                item.cashier_name,
                item.outlet_name,
                item.opened_at,
                item.closed_at || '-',
                item.opening_cash,
                item.total_sales,
                item.closing_cash,
                item.status
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shift-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const columns = [
        {
            header: 'Shift ID',
            accessor: (item) => item.id || '-'
        },
        {
            header: 'Kasir',
            accessor: (item) => item.cashier_name || '-'
        },
        {
            header: 'Outlet',
            accessor: (item) => item.outlet_name || '-'
        },
        {
            header: 'Waktu Buka',
            accessor: (item) => new Date(item.opened_at).toLocaleString('id-ID') || '-'
        },
        {
            header: 'Waktu Tutup',
            accessor: (item) => item.closed_at ? new Date(item.closed_at).toLocaleString('id-ID') : 'Masih Buka'
        },
        {
            header: 'Modal Awal',
            accessor: (item) => `Rp ${parseInt(item.opening_cash || 0).toLocaleString()}`
        },
        {
            header: 'Total Penjualan',
            accessor: (item) => `Rp ${parseInt(item.total_sales || 0).toLocaleString()}`
        },
        {
            header: 'Modal Akhir',
            accessor: (item) => `Rp ${parseInt(item.closing_cash || 0).toLocaleString()}`
        },
        {
            header: 'Status',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                }`}>
                    {item.status === 'closed' ? 'Ditutup' : 'Aktif'}
                </span>
            )
        }
    ];

    return (
        <div>
            <PageHeader 
                title="Laporan Shift Kasir" 
                subtitle="Monitoring shift dan kas kasir"
            />

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                onExport={handleExport}
                searchPlaceholder="Cari shift..."
            />
        </div>
    );
}