import React from 'react';
import PageHeader from '../../components/PageHeader';

export default function Access() {
    const roles = [
        { name: 'Owner', desc: 'Akses penuh ke semua fitur', users: 1 },
        { name: 'Manager', desc: 'Bisa akses laporan dan inventaris, tidak bisa billing', users: 2 },
        { name: 'Cashier', desc: 'Hanya bisa akses POS dan riwayat transaksi', users: 5 },
        { name: 'Kitchen', desc: 'Hanya akses tampilan pesanan dapur (KDS)', users: 3 },
    ];

    return (
        <div>
            <PageHeader title="Hak Akses (Role)" subtitle="Atur level akses karyawan" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{role.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{role.desc}</p>
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{role.users} User</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button className="text-sm text-blue-600 hover:underline">Edit Permission</button>
                        </div>
                    </div>
                ))}
                
                {/* Add New Role Card */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors min-h-[150px]">
                    <span className="text-2xl font-bold">+</span>
                    <span className="text-sm font-medium">Buat Role Baru</span>
                </div>
            </div>
        </div>
    );
}