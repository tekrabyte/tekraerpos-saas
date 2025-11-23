import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function POSLayout() {
    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header POS */}
            <header className="bg-white h-14 shadow-sm flex items-center px-4 justify-between z-10">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="font-bold text-lg">Mode Kasir</h1>
                </div>
                <div className="text-sm text-green-600 font-medium">● Online</div>
            </header>
            
            {/* POS Content */}
            <div className="flex-1 overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
}