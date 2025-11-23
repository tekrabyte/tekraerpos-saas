import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Image, Plus, Trash } from 'lucide-react';

export default function Campaign() {
    const [images, setImages] = useState([
        { id: 1, url: 'https://via.placeholder.com/800x400?text=Promo+Kopi', active: true },
        { id: 2, url: 'https://via.placeholder.com/800x400?text=Menu+Baru', active: true },
    ]);

    return (
        <div>
            <PageHeader title="Campaign CDS" subtitle="Gambar promosi di layar pelanggan (Customer Display)" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Upload Box */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all min-h-[200px] cursor-pointer bg-gray-50">
                    <Plus size={48} className="mb-2" />
                    <span className="font-medium">Upload Gambar Baru</span>
                    <span className="text-xs mt-1">Rekomedasi: 1920x1080px</span>
                </div>

                {/* Existing Images */}
                {images.map((img) => (
                    <div key={img.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group relative">
                        <img src={img.url} alt="Campaign" className="w-full h-40 object-cover" />
                        
                        <div className="p-4 flex justify-between items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={img.active} className="toggle" />
                                <span className="text-sm font-medium text-gray-700">{img.active ? 'Aktif' : 'Nonaktif'}</span>
                            </label>
                            
                            <button className="text-red-500 p-2 hover:bg-red-50 rounded-full" title="Hapus">
                                <Trash size={18} />
                            </button>
                        </div>

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}