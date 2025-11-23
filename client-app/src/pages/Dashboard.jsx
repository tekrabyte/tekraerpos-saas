import React, { useEffect, useState } from "react";
import api from "../api/client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrasi komponen Chart.js agar tidak error
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // Mengambil data dari endpoint backend WP yang sudah kita buat
                const res = await api.get("/dashboard/sales");
                setStats(res.data);
            } catch (e) {
                console.error("Gagal load dashboard", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center">Memuat data statistik...</div>;
    
    // Data dummy jika API belum ada isinya
    const dataSummary = stats?.summary || { revenue: 0, orders: 0 };
    const dailyData = stats?.daily || [];

    const chartData = {
        labels: dailyData.map(d => d.d).reverse(),
        datasets: [
            {
                label: 'Omset Harian (Rp)',
                data: dailyData.map(d => d.t).reverse(),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 4,
            },
        ],
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h1>

            {/* Kartu Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Pendapatan</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        Rp {parseInt(dataSummary.revenue).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Transaksi</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                        {dataSummary.orders} Order
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Status Toko</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xl font-bold text-green-600">Online</span>
                    </div>
                </div>
            </div>

            {/* Grafik */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Grafik Penjualan 30 Hari</h3>
                <div className="h-80">
                    {dailyData.length > 0 ? (
                        <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Belum ada data penjualan
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}