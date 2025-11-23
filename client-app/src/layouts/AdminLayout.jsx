import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../store/auth";
import api from "../api/client"; // Import API Client
import { 
    LayoutDashboard, FileText, Library, Box, Globe, Users, 
    Monitor, Grid, CreditCard, Settings, LogOut, Store, 
    ChevronDown, ChevronRight, ShoppingBag, UserCheck, AlertTriangle 
} from "lucide-react";

// HELPER: Hitung Sisa Hari Trial
function getDaysLeft(createdAt) {
    if (!createdAt) return 0;
    const start = new Date(createdAt);
    const now = new Date();
    const diff = now - start;
    const daysPassed = Math.floor(diff / (1000 * 60 * 60 * 24));
    return 14 - daysPassed;
}

export default function AdminLayout() {
    const { slug } = useParams();
    const { user, token, tenant, login, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State Menu & Trial
    const [openMenus, setOpenMenus] = useState({});
    
    // --- TAMBAHAN: Sync Status Tenant Terbaru ---
    // Ini memastikan banner trial hilang otomatis setelah bayar tanpa perlu relogin
    useEffect(() => {
        async function syncStatus() {
            try {
                const res = await api.get("/tenant/settings");
                if (res.data.success && res.data.tenant) {
                    // Update data tenant di penyimpanan lokal (Store)
                    // Kita memanggil fungsi login ulang dengan data user yang diupdate
                    login({
                        token: token,
                        user: {
                            ...user,
                            tenant: res.data.tenant
                        }
                    });
                }
            } catch (err) {
                console.error("Gagal sinkronisasi status tenant:", err);
            }
        }
        syncStatus();
    }, []); // Jalan sekali saat layout dimuat
    // ---------------------------------------------

    // Hitung status trial
    const daysLeft = tenant ? getDaysLeft(tenant.created_at) : 0;
    const isTrial = tenant?.status === 'trial';

    const toggleMenu = (key) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Struktur Menu
    const menus = [
        {
            title: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: `/${slug}/`
        },
        {
            title: "Reports",
            icon: <FileText size={20} />,
            key: "reports",
            items: [
                { name: "Sales", path: `/${slug}/reports/sales` },
                { name: "Transactions", path: `/${slug}/reports/transactions` },
                { name: "Invoices", path: `/${slug}/reports/invoices` },
                { name: "Shift", path: `/${slug}/reports/shift` }
            ]
        },
        {
            title: "Library",
            icon: <Library size={20} />,
            key: "library",
            items: [
                { name: "Item Library (Produk)", path: `/${slug}/products` },
                { name: "Modifiers", path: `/${slug}/library/modifiers` },
                { name: "Categories", path: `/${slug}/library/categories` },
                { name: "Bundle Package", path: `/${slug}/library/bundles` },
                { name: "Promo", path: `/${slug}/library/promo` },
                { name: "Discounts", path: `/${slug}/library/discounts` },
                { name: "Taxes", path: `/${slug}/library/taxes` },
                { name: "Gratuity", path: `/${slug}/library/gratuity` },
                { name: "Sales Type", path: `/${slug}/library/sales-type` },
                { name: "Brands", path: `/${slug}/library/brands` }
            ]
        },
        {
            title: "Inventory",
            icon: <Box size={20} />,
            key: "inventory",
            items: [
                { name: "Summary", path: `/${slug}/inventory/summary` },
                { name: "Suppliers", path: `/${slug}/inventory/suppliers` },
                { name: "Purchase Order", path: `/${slug}/inventory/po` },
                { name: "Transfer", path: `/${slug}/inventory/transfer` },
                { name: "Adjustment", path: `/${slug}/inventory/adjustment` }
            ]
        },
        {
            title: "Online Channels",
            icon: <Globe size={20} />,
            key: "online",
            items: [
                { name: "TekraPOS Order", path: `/${slug}/online/tekrapos` },
                { name: "Gofood", path: `/${slug}/online/gofood` }
            ]
        },
        {
            title: "Customers",
            icon: <Users size={20} />,
            key: "customers",
            items: [
                { name: "Customers List", path: `/${slug}/customers` },
                { name: "Feedback", path: `/${slug}/customers/feedback` },
                { name: "Loyalty Program", path: `/${slug}/customers/loyalty` }
            ]
        },
        {
            title: "Employees",
            icon: <UserCheck size={20} />,
            key: "employees",
            items: [
                { name: "Employee Slots", path: `/${slug}/employees` },
                { name: "Employee Access", path: `/${slug}/employees/access` },
                { name: "PIN Access", path: `/${slug}/employees/pin` }
            ]
        },
        {
            title: "Customer Display",
            icon: <Monitor size={20} />,
            key: "cds",
            items: [
                { name: "Campaign", path: `/${slug}/cds/campaign` },
                { name: "Settings", path: `/${slug}/cds/settings` }
            ]
        },
        {
            title: "Table Management",
            icon: <Grid size={20} />,
            key: "tables",
            items: [
                { name: "Table Group", path: `/${slug}/tables/group` },
                { name: "Table Map", path: `/${slug}/tables/map` },
                { name: "Table Report", path: `/${slug}/tables/report` }
            ]
        },
        {
            title: "Payments",
            icon: <CreditCard size={20} />,
            key: "payments",
            items: [
                { name: "QRIS", path: `/${slug}/payments/qris` },
                { name: "Configuration", path: `/${slug}/payments/config` }
            ]
        },
        {
            title: "Account Settings",
            icon: <Settings size={20} />,
            key: "settings",
            items: [
               { name: "Account", path: `/${slug}/settings/account` },
                { name: "Billing", path: `/${slug}/settings/billing` },
                { name: "Outlets", path: `/${slug}/settings/outlets` },
                { name: "Bank Account", path: `/${slug}/settings/bank` },
                { name: "Public Profile", path: `/${slug}/settings/profile` },
                { name: "Receipt", path: `/${slug}/settings/receipt` },
                { name: "Checkout", path: `/${slug}/settings/checkout` },
                { name: "Inventory Settings", path: `/${slug}/settings/inventory` },
                { name: "Email Notification", path: `/${slug}/settings/email` }
            ]
        }
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                    <h2 className="text-xl font-bold text-white tracking-tight">{tenant?.name || "TekraERPOS"}</h2>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                        {tenant?.plan_id === '3' ? 'Enterprise' : 'Basic'} Plan
                    </span>
                </div>
                
                <nav className="flex-1 p-3 space-y-1">
                    <Link to={`/${slug}/pos`} className="flex items-center gap-3 px-3 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg mb-6 font-bold transition-colors shadow-lg shadow-green-900/20">
                        <Store size={20} />
                        <span>Buka Kasir (POS)</span>
                    </Link>

                    {menus.map((menu, index) => {
                        if (!menu.items) {
                            return (
                                <Link 
                                    key={index}
                                    to={menu.path} 
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === menu.path ? "bg-slate-800 text-white font-medium" : "hover:bg-slate-800 hover:text-white"}`}
                                >
                                    {menu.icon}
                                    <span>{menu.title}</span>
                                </Link>
                            );
                        }

                        const isOpen = openMenus[menu.key];
                        return (
                            <div key={index} className="mb-1">
                                <button 
                                    onClick={() => toggleMenu(menu.key)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${isOpen ? "bg-slate-800 text-white" : "hover:bg-slate-800 hover:text-white"}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {menu.icon}
                                        <span className="font-medium">{menu.title}</span>
                                    </div>
                                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>

                                {isOpen && (
                                    <div className="ml-4 mt-1 pl-4 border-l border-slate-700 space-y-1">
                                        {menu.items.map((item, idx) => (
                                            <Link 
                                                key={idx}
                                                to={item.path}
                                                className={`block px-3 py-2 rounded text-sm transition-colors ${location.pathname === item.path ? "text-blue-400 bg-slate-800/50" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}
                                            >
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full px-3 py-2 rounded-lg transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                {/* Header */}
                <header className="bg-white h-14 border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
                    <h1 className="font-bold text-gray-700 capitalize">
                        {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Overview'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-gray-500">System Operational</span>
                    </div>
                </header>

                {/* ALERT TRIAL */}
                {isTrial && daysLeft > 0 && (
                    <div className="bg-orange-50 border-b border-orange-200 text-orange-800 px-8 py-3 flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-orange-600" />
                            <span>
                                <b>Masa Trial:</b> Tersisa <b>{daysLeft} Hari</b> lagi. Upgrade ke Pro untuk fitur lengkap.
                            </span>
                        </div>
                        <Link to={`/${slug}/settings/billing`} className="bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 text-xs font-bold transition-colors">
                            Upgrade Sekarang
                        </Link>
                    </div>
                )}

                {isTrial && daysLeft <= 0 && (
                     <div className="bg-red-600 text-white px-8 py-3 text-center font-bold shadow-md">
                        Masa Trial Habis! Toko Anda akan dikunci segera. Silakan bayar tagihan.
                     </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}