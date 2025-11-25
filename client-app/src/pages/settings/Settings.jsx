import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../store/auth';
import { 
    Edit2, Lock, ShieldCheck, Save, X, Loader, User, 
    Building2, CreditCard, CheckCircle, AlertCircle, Send 
} from 'lucide-react';
import Modal from '../../components/Modal'; 
// Pastikan path import FormField benar
import FormField from '../../components/FormField'; 

// --- KOMPONEN DIPINDAHKAN KE LUAR AGAR TIDAK RENDER ULANG (FIX NYANGKUT) ---

const SectionHeader = ({ title, section, icon: Icon, editMode, toggleEdit }) => (
    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Icon size={16} className="text-gray-400"/> {title}
        </h2>
        <button onClick={() => toggleEdit(section)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 bg-white border border-blue-200 px-3 py-1 rounded transition-colors">
            {editMode ? <><X size={12}/> Cancel</> : <><Edit2 size={12}/> Edit</>}
        </button>
    </div>
);

const InputGroup = ({ label, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <label className="font-medium text-gray-600 text-sm">{label}</label>
        <div className="md:col-span-2">{children}</div>
    </div>
);

const NotificationPopup = ({ notification, onClose }) => {
    if (!notification) return null;
    return (
        <div className={`fixed top-5 right-5 z-[100] px-6 py-4 rounded-lg shadow-xl border-l-4 flex items-center gap-3 animate-in slide-in-from-right duration-300 bg-white ${notification.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            {notification.type === 'success' ? <CheckCircle className="text-green-500"/> : <AlertCircle className="text-red-500"/>}
            <div>
                <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {notification.type === 'success' ? 'Sukses' : 'Gagal'}
                </h4>
                <p className="text-xs text-gray-600">{notification.message}</p>
            </div>
            <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600"><X size={16}/></button>
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // --- NOTIFICATION STATE ---
    const [notification, setNotification] = useState(null);

    // --- OTP STATE ---
    const [otpState, setOtpState] = useState({ isOpen: false, field: '', code: '', isLoading: false, target: '' });

    // --- STATE DATA ---
    const [data, setData] = useState({
        // Personal
        name: '',
        phone: '',
        email: '',
        email_verified: false,
        phone_verified: false,
        
        // Business
        business_name: '',
        business_address: '',
        province: '', province_id: '',
        city: '', city_id: '',
        district: '', district_id: '',
        village: '', village_id: '',
        postal_code: '',

        // ID & Tax
        id_name: '',
        id_number: '',
        npwp_name: '',
        npwp_number: ''
    });

    // --- UI STATES ---
    const [editMode, setEditMode] = useState({ personal: false, business: false, id: false, npwp: false });
    const [showPassModal, setShowPassModal] = useState(false);
    const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
    const [passLoading, setPassLoading] = useState(false);
    
    // --- REGION DATA ---
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [villages, setVillages] = useState([]);

    useEffect(() => { loadInitialData(); }, []);

    const showToast = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- HELPER FORMAT PHONE ---
    const formatPhoneForSubmit = (phone) => {
        if (!phone) return '';
        // Hapus karakter non-angka
        let clean = phone.replace(/\D/g, '');
        // Jika user mengetik 0 di depan (cth: 0812), hapus 0 nya
        if (clean.startsWith('0')) {
            clean = clean.substring(1);
        }
        // Jika user belum mengetik 62, tambahkan (karena di UI sudah ada label +62)
        if (!clean.startsWith('62')) {
            return '62' + clean;
        }
        return clean;
    };

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/settings');
            const tenant = res.data.tenant || {};
            
            // Parsing nomor HP untuk tampilan (Hapus 62 di depan agar pas di input)
            let displayPhone = tenant.phone || '';
            if (displayPhone.startsWith('62')) displayPhone = displayPhone.substring(2);
            if (displayPhone.startsWith('+62')) displayPhone = displayPhone.substring(3);

            setData(prev => ({
                ...prev,
                name: tenant.owner_name || user?.display_name || '',
                phone: displayPhone, // Tampilkan tanpa kode negara
                email: tenant.email || user?.email || '',
                email_verified: !!tenant.email, 
                phone_verified: !!tenant.phone,

                business_name: tenant.name || '',
                business_address: tenant.address || '',
                id_number: `ACC-${tenant.id || user?.id}`, 
                id_name: tenant.owner_name || user?.display_name || '' 
            }));

            const provRes = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
            setProvinces(await provRes.json());
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    // --- HANDLERS ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => {
            const updates = { [name]: value };
            if (name === 'email' && value !== prev.email) updates.email_verified = false;
            if (name === 'phone' && value !== prev.phone) updates.phone_verified = false;
            return { ...prev, ...updates };
        });
    };

    const handleRegionChange = async (type, e) => {
        const id = e.target.value;
        const index = e.target.selectedIndex;
        const name = e.target.options[index].text;
        
        if (type === 'province') {
            setData(p => ({ ...p, province: name, province_id: id, city: '', city_id: '', district: '', district_id: '', village: '' }));
            setCities([]); setDistricts([]); setVillages([]);
            if(id) setCities(await (await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`)).json());
        }
        else if (type === 'city') {
            setData(p => ({ ...p, city: name, city_id: id, district: '', district_id: '', village: '' }));
            setDistricts([]); setVillages([]);
            if(id) setDistricts(await (await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`)).json());
        }
        else if (type === 'district') {
            setData(p => ({ ...p, district: name, district_id: id, village: '' }));
            setVillages([]);
            if(id) setVillages(await (await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`)).json());
        }
        else if (type === 'village') {
            setData(p => ({ ...p, village: name, village_id: id, postal_code: name })); 
        }
    };

    const toggleEdit = (section) => setEditMode(p => ({ ...p, [section]: !p[section] }));

    const handleSave = async (section) => {
        try {
            // Siapkan payload, format nomor HP khusus
            const payload = { ...data };
            if (section === 'personal') {
                payload.phone = formatPhoneForSubmit(data.phone);
            }

            await api.post('/tenant/settings/update', { section, ...payload });
            showToast(`Data ${section} berhasil disimpan!`, 'success');
            toggleEdit(section);
        } catch (e) {
            showToast("Gagal menyimpan data.", 'error');
        }
    };

    // --- OTP LOGIC ---

    const requestOTP = async (field) => {
        // Format target sebelum kirim OTP
        let target = field === 'email' ? data.email : data.phone;
        if (field === 'phone') target = formatPhoneForSubmit(target);

        if(!target) return showToast("Isi data terlebih dahulu.", 'error');
        
        setOtpState(prev => ({ ...prev, isLoading: true, field, target }));

        try {
            await api.post('/auth/otp/request', { target, type: field });
            setOtpState({ isOpen: true, field, code: '', isLoading: false, target });
            showToast(`Kode OTP terkirim ke ${target}`, 'success');
        } catch (err) {
            setOtpState(prev => ({ ...prev, isLoading: false }));
            showToast(err.response?.data?.message || "Gagal mengirim OTP.", 'error');
        }
    };

    const verifyOTP = async (e) => {
        e.preventDefault();
        if(otpState.code.length < 6) return showToast("Masukkan 6 digit kode.", 'error');

        try {
            await api.post('/auth/otp/verify', { 
                code: otpState.code, 
                type: otpState.field,
                target: otpState.target 
            });

            setData(p => ({ ...p, [`${otpState.field}_verified`]: true }));
            showToast("Verifikasi Berhasil!", 'success');
            setOtpState({ isOpen: false, field: '', code: '', isLoading: false, target: '' });
        } catch (err) {
            showToast(err.response?.data?.message || "Kode OTP Salah.", 'error');
        }
    };

    // --- PASSWORD LOGIC ---

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passForm.new !== passForm.confirm) return showToast("Password konfirmasi tidak cocok.", 'error');
        
        setPassLoading(true);
        setTimeout(() => {
            setPassLoading(false);
            setShowPassModal(false);
            setPassForm({ old: '', new: '', confirm: '' });
            showToast("Password berhasil diubah!", 'success');
        }, 1000);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin text-blue-600" size={40}/></div>;

    return (
        <div className="h-full flex flex-col bg-gray-50 relative">
            <NotificationPopup notification={notification} onClose={() => setNotification(null)} />

            {/* HEADER */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    <p className="text-xs text-gray-500 mt-1">Kelola profil akun dan informasi bisnis Anda.</p>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* 1. PERSONAL DETAILS */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader 
                            title="Personal Details" 
                            section="personal" 
                            icon={User} 
                            editMode={editMode.personal} 
                            toggleEdit={toggleEdit} 
                        />
                        <div className="p-6 space-y-5">
                            <InputGroup label="Name">
                                <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" 
                                    name="name" value={data.name} onChange={handleChange} disabled={!editMode.personal} />
                            </InputGroup>
                            
                            <InputGroup label="Phone">
                                <div className="relative">
                                    <div className="flex border rounded-lg overflow-hidden disabled:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                                        <span className="bg-gray-100 px-3 py-2 text-gray-500 border-r text-sm flex items-center">🇮🇩 +62</span>
                                        <input 
                                            className="flex-1 px-3 py-2 outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                                            name="phone" 
                                            value={data.phone} 
                                            onChange={handleChange} 
                                            disabled={!editMode.personal} 
                                            placeholder="8123456789"
                                            type="number"
                                        />
                                    </div>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {data.phone_verified ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200"><ShieldCheck size={12}/> Verified</span>
                                        ) : (
                                            <button type="button" onClick={() => requestOTP('phone')} disabled={otpState.isLoading} className="text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50">
                                                {otpState.isLoading && otpState.field === 'phone' ? <Loader size={10} className="animate-spin"/> : 'Verify'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </InputGroup>

                            <InputGroup label="Email">
                                <div className="relative">
                                    <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 pr-24" 
                                        type="email" name="email" value={data.email} onChange={handleChange} disabled={!editMode.personal} />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {data.email_verified ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200"><ShieldCheck size={12}/> Verified</span>
                                        ) : (
                                            <button type="button" onClick={() => requestOTP('email')} disabled={otpState.isLoading} className="text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-1 disabled:opacity-50">
                                                {otpState.isLoading && otpState.field === 'email' ? <Loader size={10} className="animate-spin"/> : 'Verify'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </InputGroup>

                            {editMode.personal && (
                                <div className="flex justify-end pt-2 border-t mt-4">
                                    <button onClick={() => handleSave('personal')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Save size={16}/> Simpan</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. BUSINESS INFO */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader title="Business Info" section="business" icon={Building2} editMode={editMode.business} toggleEdit={toggleEdit} />
                        <div className="p-6 space-y-5">
                            <InputGroup label="Business Name">
                                <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500" 
                                    name="business_name" value={data.business_name} onChange={handleChange} disabled={!editMode.business} />
                            </InputGroup>
                            <InputGroup label="Address">
                                <textarea className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500" 
                                    rows="2" name="business_address" value={data.business_address} onChange={handleChange} disabled={!editMode.business} />
                            </InputGroup>
                            
                            <InputGroup label="Province">
                                <select className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={data.province_id} onChange={(e) => handleRegionChange('province', e)} disabled={!editMode.business}>
                                    <option value="">{data.province || '-- Pilih Provinsi --'}</option>
                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </InputGroup>
                            
                            <InputGroup label="City / Kabupaten">
                                <select className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={data.city_id} onChange={(e) => handleRegionChange('city', e)} disabled={!editMode.business || !data.province_id}>
                                    <option value="">{data.city || '-- Pilih Kota --'}</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </InputGroup>

                            <InputGroup label="Kecamatan">
                                <select className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={data.district_id} onChange={(e) => handleRegionChange('district', e)} disabled={!editMode.business || !data.city_id}>
                                    <option value="">{data.district || '-- Pilih Kecamatan --'}</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </InputGroup>

                            <InputGroup label="Postal Code (Kelurahan)">
                                <select className="w-full border rounded-lg px-3 py-2 bg-white disabled:bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={data.village_id} onChange={(e) => handleRegionChange('village', e)} disabled={!editMode.business || !data.district_id}>
                                    <option value="">{data.village || '-- Pilih Kelurahan --'}</option>
                                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </InputGroup>

                            {editMode.business && (
                                <div className="flex justify-end pt-2 border-t mt-4">
                                    <button onClick={() => handleSave('business')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Save size={16}/> Simpan</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. ID & NPWP */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <SectionHeader title="Legal Information" section="id" icon={CreditCard} editMode={editMode.id} toggleEdit={toggleEdit} />
                        <div className="p-6 space-y-5">
                            <InputGroup label="ID Number (Account)">
                                <div className="relative">
                                    <input className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 font-mono text-sm cursor-not-allowed" 
                                        value={data.id_number} disabled />
                                    <Lock size={14} className="absolute right-3 top-3 text-gray-400"/>
                                </div>
                            </InputGroup>
                            <InputGroup label="Name on ID">
                                 <div className="relative">
                                    <input className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-500 font-medium cursor-not-allowed" 
                                        value={data.id_name} disabled />
                                    <Lock size={14} className="absolute right-3 top-3 text-gray-400"/>
                                </div>
                            </InputGroup>

                            <div className="border-t border-dashed my-4"></div>
                            
                            <InputGroup label="NPWP Name">
                                <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500" 
                                    name="npwp_name" value={data.npwp_name} onChange={handleChange} disabled={!editMode.id} placeholder="(Optional)"/>
                            </InputGroup>
                            <InputGroup label="NPWP Number">
                                <input className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500" 
                                    name="npwp_number" value={data.npwp_number} onChange={handleChange} disabled={!editMode.id} placeholder="(Optional)"/>
                            </InputGroup>

                            {editMode.id && (
                                <div className="flex justify-end pt-2 border-t mt-4">
                                    <button onClick={() => handleSave('id')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Save size={16}/> Simpan</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. SECURITY */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><Lock size={24} /></div>
                            <div><h3 className="font-bold text-gray-800">Password & Security</h3><p className="text-sm text-gray-500">Amankan akun Anda dengan password yang kuat.</p></div>
                        </div>
                        <button onClick={() => setShowPassModal(true)} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm shadow-sm">Change Password</button>
                    </div>

                </div>
            </div>

            {/* MODAL OTP */}
            <Modal isOpen={otpState.isOpen} onClose={() => setOtpState(p=>({...p, isOpen: false}))} title={`Verifikasi ${otpState.field === 'email' ? 'Email' : 'No HP'}`} size="sm">
                <form onSubmit={verifyOTP} className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send size={32}/>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Masukkan Kode OTP</h3>
                    <p className="text-gray-500 text-sm mb-6">Kami telah mengirimkan kode verifikasi ke {otpState.target}.</p>
                    <input autoFocus className="text-center text-3xl tracking-[10px] font-bold border rounded-lg px-4 py-3 w-full mb-6 focus:ring-2 focus:ring-blue-500 outline-none" 
                        maxLength={6} value={otpState.code} onChange={e => setOtpState(p=>({...p, code: e.target.value}))} placeholder="••••••"/>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">Verifikasi</button>
                    <p className="text-xs text-gray-400 mt-4 cursor-pointer hover:text-blue-600">Kirim Ulang Kode</p>
                </form>
            </Modal>

            {/* MODAL CHANGE PASSWORD */}
            <Modal isOpen={showPassModal} onClose={() => setShowPassModal(false)} title="Ganti Password" size="sm">
                <form onSubmit={handleChangePassword} className="p-4 space-y-4">
                    <FormField label="Password Lama" name="old" type="password" value={passForm.old} onChange={e => setPassForm({...passForm, old: e.target.value})} required />
                    <div className="border-t border-gray-100"></div>
                    <FormField label="Password Baru" name="new" type="password" value={passForm.new} onChange={e => setPassForm({...passForm, new: e.target.value})} required />
                    <FormField label="Konfirmasi Password Baru" name="confirm" type="password" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} required />
                    <button type="submit" disabled={passLoading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-70 mt-4 shadow-md">
                        {passLoading && <Loader className="animate-spin" size={16}/>} Update Password
                    </button>
                </form>
            </Modal>

        </div>
    );
}