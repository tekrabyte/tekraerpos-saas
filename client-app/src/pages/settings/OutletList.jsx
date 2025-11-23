import React, { useEffect, useState } from "react";
import api from "../../api/client"; // Pastikan file ini sudah ada dari langkah sebelumnya

export default function OutletList() {
    const [outlets, setOutlets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await api.get("/tenant/outlets"); // Endpoint: rest/class-rest-outlet.php
            setOutlets(res.data.outlets);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd() {
        const name = prompt("Nama Outlet Baru:");
        if (!name) return;
        const address = prompt("Alamat:");

        try {
            await api.post("/tenant/outlets", { name, address });
            alert("Outlet berhasil dibuat!");
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Gagal membuat outlet. Cek kuota Plan Anda.");
        }
    }

    async function handleDelete(id) {
        if (!confirm("Hapus outlet ini? Data transaksi mungkin akan hilang.")) return;
        try {
            await api.delete(`/tenant/outlets/${id}`);
            loadData();
        } catch (err) {
            alert("Gagal menghapus outlet.");
        }
    }

    if (loading) return <div className="p-6">Loading outlets...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Outlet</h1>
                <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    + Tambah Cabang
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Nama Outlet</th>
                            <th className="p-4">Alamat</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outlets.map((o) => (
                            <tr key={o.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{o.name}</td>
                                <td className="p-4 text-gray-500">{o.address}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${o.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {o.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-800 text-sm">
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}