import React from "react";

export default function Settings() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Pengaturan Toko</h1>
            <div className="bg-white p-6 rounded shadow max-w-lg">
                <form>
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Nama Toko</label>
                        <input type="text" className="w-full border p-2 rounded" placeholder="Contoh: Kopi Kenangan" />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
                </form>
            </div>
        </div>
    );
}