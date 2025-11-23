import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Import useParams
import api from "../api/client";
import { useAuth } from "../store/auth";

export default function Login() {
    const { slug } = useParams(); // Tangkap slug dari URL jika ada (misal /kopi/login)
    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const login = useAuth((s) => s.login);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await api.post("/auth/login", { email, password });
            
            if (res.data.success) {
                const tenantSlug = res.data.user.tenant.slug;
                
                // Validasi: Jika login di URL toko A tapi user milik toko B, tolak (opsional)
                if (slug && slug !== tenantSlug) {
                     setError(`Akun ini bukan milik toko "${slug}". Silakan login di link toko Anda.`);
                     setLoading(false);
                     return;
                }

                // Simpan session
                login(res.data); 

                // Redirect ke Dashboard spesifik tenant
                // Contoh: /kopikenangan/
                navigate(`/${tenantSlug}/`);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Email atau Password salah.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-2 text-center">
                    {slug ? `Login ${slug}` : "TekraERPOS Login"}
                </h2>
                <p className="text-center text-gray-500 text-sm mb-6">Masuk untuk mengelola toko Anda</p>
                
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="password" className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none" value={password} onChange={e => setPass(e.target.value)} required />
                    </div>
                    <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition">
                        {loading ? "Memproses..." : "Masuk Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    );
}