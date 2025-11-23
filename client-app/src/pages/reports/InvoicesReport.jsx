import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { FileText, Download } from 'lucide-react';

export default function InvoicesReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/reports/invoices');
            setData(res.data.invoices || []);
        } catch (error) {
            console.error('Failed to load invoices:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    const handleDownloadInvoice = (invoice) => {
        alert(`Download invoice #${invoice.invoice_number}`);
        // Implement PDF download
    };

    const handleExport = () => {
        const csvContent = [
            ['No Invoice', 'Tanggal', 'Customer', 'Total', 'Status', 'Jatuh Tempo'],
            ...data.map(item => [
                item.invoice_number,
                item.created_at,
                item.customer_name,
                item.total,
                item.status,
                item.due_date
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const columns = [
        {
            header: 'No Invoice',
            accessor: (item) => item.invoice_number || '-'
        },
        {
            header: 'Tanggal',
            accessor: (item) => new Date(item.created_at).toLocaleDateString('id-ID') || '-'
        },
        {
            header: 'Customer',
            accessor: (item) => item.customer_name || '-'
        },
        {
            header: 'Total',
            accessor: (item) => `Rp ${parseInt(item.total || 0).toLocaleString()}`
        },
        {
            header: 'Status',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'paid' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {item.status === 'paid' ? 'Lunas' : item.status === 'pending' ? 'Pending' : 'Overdue'}
                </span>
            )
        },
        {
            header: 'Jatuh Tempo',
            accessor: (item) => new Date(item.due_date).toLocaleDateString('id-ID') || '-'
        },
        {
            header: 'Aksi',
            render: (item) => (
                <button
                    onClick={() => handleDownloadInvoice(item)}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    data-testid="download-invoice-button"
                >
                    <Download size={16} />
                    <span>Download</span>
                </button>
            )
        }
    ];

    return (
        <div>
            <PageHeader 
                title="Laporan Invoice" 
                subtitle="Daftar semua invoice dan status pembayaran"
            />

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                onExport={handleExport}
                searchPlaceholder="Cari invoice..."
            />
        </div>
    );
}