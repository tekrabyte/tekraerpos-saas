import React from "react";
import { TrendingUp, ShoppingCart, Wallet, Bell } from "lucide-react";

export default function MobileDashboard() {
    return (
        <div className="p-5">
            {/* Header Mobile */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Halo, Kasir 👋</h1>
                    <p className="text-xs text-gray-500">Outlet: Pusat (Jakarta)</p>
                </div>
                <button className="p-2 bg-white border rounded-full shadow-sm relative">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-600/20">
                    <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                        <Wallet size={20} />
                    </div>
                    <p className="text-xs opacity-80 mb-1">Omset Hari Ini</p>
                    <p className="text-lg font-bold">Rp 2.5jt</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-orange-50 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                        <ShoppingCart size={20} />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">Total Order</p>
                    <p className="text-lg font-bold text-gray-800">45</p>
                </div>
            </div>

            {/* Quick Menu */}
            <h3 className="font-bold text-gray-800 mb-3">Menu Cepat</h3>
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Produk', color: 'bg-purple-100 text-purple-600' },
                    { label: 'Stok', color: 'bg-green-100 text-green-600' },
                    { label: 'Shift', color: 'bg-blue-100 text-blue-600' },
                    { label: 'Lainnya', color: 'bg-gray-100 text-gray-600' },
                ].map((m, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center`}>
                            <div className="w-6 h-6 bg-current opacity-20 rounded"></div>
                        </div>
                        <span className="text-[10px] font-medium text-gray-600">{m.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}