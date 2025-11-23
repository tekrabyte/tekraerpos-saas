import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Shield, Edit2 } from 'lucide-react';
import Modal from '../../components/Modal';

export default function Pin() {
    const [employees] = useState([
        { id: 1, name: 'Budi Santoso', role: 'Cashier', has_pin: true },
        { id: 2, name: 'Siti Aminah', role: 'Manager', has_pin: true },
        { id: 3, name: 'Rudi Hartono', role: 'Kitchen', has_pin: false },
    ]);
    const [selectedEmp, setSelectedEmp] = useState(null);

    return (
        <div>
            <PageHeader title="Akses PIN" subtitle="Atur PIN 4-6 digit untuk login cepat di POS" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employees.map(emp => (
                    <div key={emp.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${emp.has_pin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Shield size={32} />
                        </div>
                        <h3 className="font-bold text-lg">{emp.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{emp.role}</p>
                        
                        <button 
                            onClick={() => setSelectedEmp(emp)}
                            className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                        >
                            <Edit2 size={14} /> {emp.has_pin ? 'Ubah PIN' : 'Buat PIN'}
                        </button>
                    </div>
                ))}
            </div>

            {selectedEmp && (
                <Modal isOpen={true} onClose={() => setSelectedEmp(null)} title={`Set PIN: ${selectedEmp.name}`}>
                    <div className="p-4">
                        <p className="mb-4 text-sm text-gray-600">Masukkan 6 digit angka untuk akses POS.</p>
                        <input 
                            type="password" 
                            className="w-full text-center text-3xl tracking-[1em] font-bold border-b-2 border-blue-500 outline-none py-2 mb-6" 
                            maxLength={6}
                            placeholder="••••••"
                            autoFocus
                        />
                        <button className="w-full bg-blue-600 text-white py-3 rounded font-bold" onClick={() => setSelectedEmp(null)}>
                            SIMPAN PIN
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}