import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { 
    CreditCard, Clock, CheckCircle, AlertTriangle, 
    Package, History, Download, RefreshCw
} from "lucide-react";

export default function Billing() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [availablePlans, setAvailablePlans] = useState([]);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        loadData();
        
        const onFocus = () => loadData();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    async function loadData() {
        if(!subscription) setLoading(true);
        
        try {
            const res = await api.get("/billing/info");

            if(res.data) {
                setSubscription(res.data.subscription);
                setCurrentPlan(res.data.plan);
                setInvoices(res.data.invoices || []);
                setAvailablePlans(res.data.available_plans || []);
            }
            
            setError(null);

        } catch (error) {
            console.error("Gagal memuat data billing:", error);
            setError("Gagal memuat informasi langganan. Cek koneksi internet Anda.");
        } finally {
            setLoading(false);
        }
    }

    // --- FUNGSI BARU: Cek Status Pembayaran Manual ---
    async function handleCheckStatus() {
        // Jangan set global loading agar UI tidak berkedip, cukup loading di tombol
        const btn = document.getElementById('btn-check-status');
        if(btn) btn.disabled = true;

        try {
            const res = await api.post("/billing/check-status");
            
            if (res.data.success && res.data.status === 'active') {
                alert("✅ " + res.data.message);
                window.location.reload(); // Reload agar data & tampilan fresh
            } else {
                alert("ℹ️ " + res.data.message);
                loadData(); // Refresh data lokal saja
            }
        } catch (error) {
            alert(error.response?.data?.message || "Gagal mengecek status ke Xendit.");
        } finally {
            if(btn) btn.disabled = false;
        }
    }

    async function handleUpgrade(plan) {
        if (!confirm(`Buat tagihan untuk paket ${plan.name} seharga Rp ${parseInt(plan.price_month).toLocaleString()}?`)) return;

        setProcessing(plan.id);
        try {
            const res = await api.post("/billing/create-invoice", { 
                plan_id: plan.id,
                amount: plan.price_month 
            });

            if (res.data.success && res.data.pay_url) {
                window.open(res.data.pay_url, "_blank");
                alert("Invoice berhasil dibuat. Silakan selesaikan pembayaran di tab baru.");
                setTimeout(loadData, 3000);
            } else {
                alert("Gagal membuat invoice. Silakan coba lagi.");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Terjadi kesalahan koneksi.");
        } finally {
            setProcessing(null);
        }
    }

    const parseFeatures = (features) => {
        if (!features) return {};
        if (typeof features === 'object') return features;
        try { return JSON.parse(features); } catch (e) { return {}; }
    };

    const getDaysLeft = () => {
        if (!subscription?.expires_at) return 0;
        const expires = new Date(subscription.expires_at);
        const now = new Date();
        if (isNaN(expires.getTime())) return 0;
        const diff = expires - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    // Helper warna badge
    const getStatusColor = (status) => {
        if (status === 'active') return 'bg-green-100 text-green-700';
        if (status === 'trial') return 'bg-blue-100 text-blue-700';
        if (status === 'pending_payment') return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-700';
    };

    if (loading && !subscription) return (
        <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-500">Memuat informasi langganan...</p>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button onClick={loadData} className="mt-4 text-blue-600 hover:underline">Coba Lagi</button>
        </div>
    );

    if (!currentPlan) return <div className="p-8 text-center text-gray-500">Data langganan tidak ditemukan.</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            
            {/* Status Langganan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <CreditCard size={200} className="text-blue-600" />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Paket Aktif</h2>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">{currentPlan.name || "Unknown Plan"}</h1>
                                
                                {/* Status Badge & Check Button Container */}
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(subscription?.status)}`}>
                                        {subscription?.status ? subscription.status.replace('_', ' ') : 'Inactive'}
                                    </span>

                                    {/* TOMBOL BARU: Muncul jika status Pending Payment */}
                                    {subscription?.status === 'pending_payment' && (
                                        <button 
                                            id="btn-check-status"
                                            onClick={handleCheckStatus}
                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-full transition-colors shadow-sm disabled:opacity-70"
                                            title="Cek status pembayaran ke Xendit sekarang"
                                        >
                                            <RefreshCw size={12} />
                                            Cek Status
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-left md:text-right bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="text-sm text-gray-500 mb-1 flex items-center md:justify-end gap-2">
                                <Clock size={16} /> Berakhir pada
                            </div>
                            <div className="font-mono font-medium text-gray-700">
                                {subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '-'}
                            </div>
                            <div className={`mt-1 text-sm font-bold ${getDaysLeft() < 3 ? 'text-red-600' : 'text-green-600'}`}>
                                {getDaysLeft() > 0 ? `${getDaysLeft()} Hari Lagi` : 'Masa Aktif Habis'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pilihan Paket */}
            <div className="mb-10">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Package size={20} /> Pilihan Paket
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {availablePlans.map(plan => {
                        const isCurrent = parseInt(plan.id) === parseInt(currentPlan?.id);
                        const price = parseInt(plan.price_month);
                        const features = parseFeatures(plan.features);
                        
                        return (
                            <div key={plan.id} className={`border rounded-xl p-6 flex flex-col transition-all ${
                                isCurrent 
                                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 relative' 
                                : 'border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1'
                            }`}>
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                        AKTIF
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold text-gray-800">
                                            {price === 0 ? "Gratis" : "Rp " + price.toLocaleString('id-ID')}
                                        </span>
                                        {price > 0 && <span className="text-gray-500 text-sm"> /bulan</span>}
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1 border-t border-gray-100 pt-4">
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <CheckCircle size={16} className="text-green-500" />
                                        <span><b>{features.outlets || features.multi_outlet || 1}</b> Outlet Cabang</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <CheckCircle size={16} className="text-green-500" />
                                        <span><b>{features.users || features.multi_user || 1}</b> Akun Karyawan</span>
                                    </li>
                                </ul>

                                <button 
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={isCurrent || processing || price === 0}
                                    className={`w-full py-3 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2 ${
                                        isCurrent 
                                            ? 'bg-gray-200 text-gray-500 cursor-default' 
                                            : price === 0 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                                    }`}
                                >
                                    {processing === plan.id ? 'Memproses...' : (
                                        isCurrent ? 'Paket Saat Ini' : (price === 0 ? 'Paket Dasar' : 'Pilih & Bayar')
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Riwayat Invoice */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <History size={20} /> Riwayat Pembayaran
                </h3>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">ID Invoice</th>
                                    <th className="px-6 py-4">Nominal</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Belum ada riwayat pembayaran.</td>
                                    </tr>
                                ) : (
                                    invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {new Date(inv.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-mono text-gray-500">{inv.invoice_id || '-'}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                Rp {parseInt(inv.amount).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {inv.status === 'pending' && (
                                                    <a href="#" className="text-blue-600 hover:underline text-sm font-medium">Bayar</a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}