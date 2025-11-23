import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import FormField from '../../components/FormField';
import api from '../../api/client';

export default function Profile() {
    const [form, setForm] = useState({
        storeName: '', tagline: '', address: '', phone: '', instagram: '', website: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/tenant/options/public_profile').then(res => {
            if(res.data.data) setForm(res.data.data);
        });
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/tenant/options/public_profile', form);
            alert("Profil berhasil diperbarui!");
        } catch (e) { alert("Gagal menyimpan."); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <PageHeader title="Profil Publik" subtitle="Informasi toko yang tampil ke pelanggan" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
                            <span className="text-gray-400 text-sm">Logo</span>
                        </div>
                        <button className="text-sm text-blue-600 font-medium border border-blue-600 px-4 py-1 rounded hover:bg-blue-50">Ganti Logo</button>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 border-b pb-2">Detail Bisnis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Nama Toko" name="storeName" value={form.storeName} onChange={handleChange} required />
                            <FormField label="Tagline" name="tagline" value={form.tagline} onChange={handleChange} />
                        </div>
                        <FormField label="Alamat Lengkap" name="address" type="textarea" value={form.address} onChange={handleChange} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <FormField label="No. Telepon" name="phone" value={form.phone} onChange={handleChange} />
                            <FormField label="Instagram" name="instagram" value={form.instagram} onChange={handleChange} />
                        </div>
                        <FormField label="Website" name="website" value={form.website} onChange={handleChange} />
                        <div className="mt-6 flex justify-end">
                            <button disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold">
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}