import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, FileText, User, Menu } from "lucide-react";

export default function MobileLayout() {
    const location = useLocation();
    const activePath = location.pathname;

    const menus = [
        { icon: LayoutDashboard, label: "Home", path: "/mobile/dashboard" },
        { icon: ShoppingBag, label: "Kasir", path: "/mobile/pos" },
        { icon: FileText, label: "Laporan", path: "/mobile/reports" },
        { icon: User, label: "Akun", path: "/mobile/settings" },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Content Area (Scrollable) */}
            <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                <Outlet />
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {menus.map((m, idx) => {
                    const isActive = activePath.includes(m.path);
                    return (
                        <Link 
                            key={idx} 
                            to={m.path} 
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <m.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-bold">{m.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    );
}