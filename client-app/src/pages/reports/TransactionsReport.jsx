import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

export default function TransactionsReport() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const res = await api.get('/reports/transactions');
            setData(res.data.transactions || []);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }

    const handleExport = () => {
        const csvContent = [
            ['ID Transaksi', 'Tanggal', 'Customer', 'Total', 'Status', 'Payment Method'],
            ...data.map(item => [
                item.id,
                item.created_at,
                item.customer_name || 'Walk-in',
                item.total,
                item.status,
                item.payment_method
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const columns = [
        {
            header: 'ID Transaksi',
            accessor: (item) => item.id || '-'
        },
        {
            header: 'Tanggal',
            accessor: (item) => new Date(item.created_at).toLocaleString('id-ID') || '-'
        },
        {
            header: 'Customer',
            accessor: (item) => item.customer_name || 'Walk-in'
        },
        {
            header: 'Total',
            accessor: (item) => `Rp ${parseInt(item.total || 0).toLocaleString()}`
        },
        {
            header: 'Status',
            render: (item) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {item.status || 'Unknown'}
                </span>
            )
        },
        {
            header: 'Metode Pembayaran',
            accessor: (item) => item.payment_method || '-'
        }
    ];

    return (
        <div>
            <PageHeader 
                title="Laporan Transaksi" 
                subtitle="Daftar semua transaksi yang terjadi"
            />

            <DataTable
                columns={columns}
                data={data}
                loading={loading}
                onExport={handleExport}
                onEdit={(item) => setSelectedTransaction(item)}
                searchPlaceholder="Cari transaksi..."
            />

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                title="Detail Transaksi"
                size="md"
            >
                {selectedTransaction && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">ID Transaksi</p>
                                <p className="font-bold">{selectedTransaction.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="font-bold">{selectedTransaction.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Customer</p>
                                <p className="font-bold">{selectedTransaction.customer_name || 'Walk-in'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="font-bold">Rp {parseInt(selectedTransaction.total || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-sm text-gray-600 mb-2">Item yang dibeli:</p>
                            <div className="space-y-2">
                                {selectedTransaction.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.name} x{item.quantity}</span>
                                        <span>Rp {parseInt(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                )) || <p className="text-sm text-gray-500">Tidak ada data item</p>}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}