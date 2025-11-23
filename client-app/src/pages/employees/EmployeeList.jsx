import React, { useEffect, useState } from "react";
import api from "../../api/client";

export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await api.get("/tenant/employees"); // Endpoint: rest/class-rest-employees.php
            setEmployees(res.data.employees);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleAdd() {
        const name = prompt("Nama Karyawan:");
        const email = prompt("Email Login:");
        const password = prompt("Password:");

        if (!name || !email || !password) return;

        try {
            await api.post("/tenant/employees", { name, email, password });
            alert("Karyawan berhasil ditambahkan.");
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Gagal menambah user.");
        }
    }

    async function handleDelete(id) {
        if(!confirm("Hapus akses karyawan ini?")) return;
        await api.delete(`/tenant/employees/${id}`);
        loadData();
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manajemen Karyawan</h1>
                <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    + Tambah Kasir
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employees.map((e) => (
                    <div key={e.id} className="bg-white p-4 rounded shadow border border-gray-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{e.name}</h3>
                            <p className="text-gray-500 text-sm">{e.email}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
                                {e.role}
                            </span>
                        </div>
                        <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                            Hapus
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}