import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import POSLayout from "./layouts/POSLayout";

// Pages - Auth & POS
import Login from "./pages/Login";
import POSPage from "./pages/pos/POSPage";
import Dashboard from "./pages/Dashboard";

// Pages - Reports
import SalesReport from "./pages/reports/SalesReport";
import TransactionsReport from "./pages/reports/TransactionsReport";
import InvoicesReport from "./pages/reports/InvoicesReport";
import ShiftReport from "./pages/reports/ShiftReport";

// Pages - Library
import ProductList from "./pages/library/ProductList";
import Modifiers from "./pages/library/Modifiers";
import Categories from "./pages/library/Categories";
import Bundles from "./pages/library/Bundles";
import Promo from "./pages/library/Promo";
import Discounts from "./pages/library/Discounts";
import Taxes from "./pages/library/Taxes";
import Gratuity from "./pages/library/Gratuity";
import SalesType from "./pages/library/SalesType";
import Brands from "./pages/library/Brands";

// Pages - Inventory (NEW)
import InventorySummary from "./pages/inventory/Summary";
import Suppliers from "./pages/inventory/Suppliers";
import PurchaseOrder from "./pages/inventory/PurchaseOrder";
import Transfer from "./pages/inventory/Transfer";
import Adjustment from "./pages/inventory/Adjustment";

// Pages - Online (NEW)
import TekraPos from "./pages/online/TekraPos";
import Gofood from "./pages/online/Gofood";

// Pages - Customers (NEW)
import CustomerList from "./pages/customers/CustomerList";
import Feedback from "./pages/customers/Feedback";
import Loyalty from "./pages/customers/Loyalty";

// Pages - Employees Extras (NEW)
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeAccess from "./pages/employees/Access";
import PinAccess from "./pages/employees/Pin";

// Pages - CDS (NEW)
import CdsCampaign from "./pages/cds/Campaign";
import CdsSettings from "./pages/cds/Settings";

// Pages - Tables (NEW)
import TableGroups from "./pages/tables/Groups";
import TableMap from "./pages/tables/Map";
import TableReport from "./pages/tables/Report";

// Pages - Payments (NEW)
import PaymentQris from "./pages/payments/Qris";
import PaymentConfig from "./pages/payments/Config";

// Pages - Settings Extras (NEW)
import Billing from "./pages/settings/Billing";
import Settings from "./pages/settings/Settings";
import OutletList from "./pages/settings/OutletList";
import BankAccount from "./pages/settings/Bank";
import PublicProfile from "./pages/settings/Profile";
import ReceiptSettings from "./pages/settings/Receipt";
import CheckoutSettings from "./pages/settings/Checkout";
import InventorySettings from "./pages/settings/Inventory";
import EmailNotification from "./pages/settings/Email";

function ProtectedRoute({ children }) {
    const user = useAuth((s) => s.user);
    if (!user) return <Navigate to="/login" />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ROUTE 1: LOGIN UMUM */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" />} />

                {/* ROUTE 2: LOGIN SPESIFIK TENANT */}
                <Route path="/:slug/login" element={<Login />} />

                {/* ROUTE 3: DASHBOARD ADMIN */}
                <Route path="/:slug/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    {/* Core */}
                    <Route index element={<Dashboard />} />
                    
                    {/* Reports */}
                    <Route path="reports/sales" element={<SalesReport />} />
                    <Route path="reports/transactions" element={<TransactionsReport />} />
                    <Route path="reports/invoices" element={<InvoicesReport />} />
                    <Route path="reports/shift" element={<ShiftReport />} />
                    
                    {/* Library */}
                    <Route path="products" element={<ProductList />} />
                    <Route path="library/modifiers" element={<Modifiers />} />
                    <Route path="library/categories" element={<Categories />} />
                    <Route path="library/bundles" element={<Bundles />} />
                    <Route path="library/promo" element={<Promo />} />
                    <Route path="library/discounts" element={<Discounts />} />
                    <Route path="library/taxes" element={<Taxes />} />
                    <Route path="library/gratuity" element={<Gratuity />} />
                    <Route path="library/sales-type" element={<SalesType />} />
                    <Route path="library/brands" element={<Brands />} />
                    
                    {/* Inventory */}
                    <Route path="inventory/summary" element={<InventorySummary />} />
                    <Route path="inventory/suppliers" element={<Suppliers />} />
                    <Route path="inventory/po" element={<PurchaseOrder />} />
                    <Route path="inventory/transfer" element={<Transfer />} />
                    <Route path="inventory/adjustment" element={<Adjustment />} />
                    
                    {/* Online Channels */}
                    <Route path="online/tekrapos" element={<TekraPos />} />
                    <Route path="online/gofood" element={<Gofood />} />
                    
                    {/* Customers */}
                    <Route path="customers" element={<CustomerList />} />
                    <Route path="customers/feedback" element={<Feedback />} />
                    <Route path="customers/loyalty" element={<Loyalty />} />
                    
                    {/* Employees */}
                    <Route path="employees" element={<EmployeeList />} />
                    <Route path="employees/access" element={<EmployeeAccess />} />
                    <Route path="employees/pin" element={<PinAccess />} />
                    
                    {/* Customer Display (CDS) */}
                    <Route path="cds/campaign" element={<CdsCampaign />} />
                    <Route path="cds/settings" element={<CdsSettings />} />
                    
                    {/* Table Management */}
                    <Route path="tables/group" element={<TableGroups />} />
                    <Route path="tables/map" element={<TableMap />} />
                    <Route path="tables/report" element={<TableReport />} />
                    
                    {/* Payments */}
                    <Route path="payments/qris" element={<PaymentQris />} />
                    <Route path="payments/config" element={<PaymentConfig />} />
                    
                    {/* Account Settings */}
                    <Route path="settings/account" element={<Settings />} />
                    <Route path="settings/billing" element={<Billing />} />
                    <Route path="settings/outlets" element={<OutletList />} />
                    <Route path="settings/bank" element={<BankAccount />} />
                    <Route path="settings/profile" element={<PublicProfile />} />
                    <Route path="settings/receipt" element={<ReceiptSettings />} />
                    <Route path="settings/checkout" element={<CheckoutSettings />} />
                    <Route path="settings/inventory" element={<InventorySettings />} />
                    <Route path="settings/email" element={<EmailNotification />} />
                </Route>

                {/* ROUTE 4: MODE KASIR (POS) */}
                <Route path="/:slug/pos" element={<ProtectedRoute><POSLayout /></ProtectedRoute>}>
                    <Route index element={<POSPage />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}