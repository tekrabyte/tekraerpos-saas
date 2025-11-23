import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Star, MessageSquare } from 'lucide-react';

export default function Feedback() {
    const [reviews] = useState([
        { id: 1, customer: 'Budi S.', rating: 5, comment: 'Kopi enak, tempat nyaman!', date: '2 jam lalu' },
        { id: 2, customer: 'Siti A.', rating: 4, comment: 'Pelayanan agak lambat hari ini.', date: '1 hari lalu' },
        { id: 3, customer: 'Anonim', rating: 3, comment: 'AC kurang dingin.', date: '2 hari lalu' },
    ]);

    return (
        <div>
            <PageHeader title="Customer Feedback" subtitle="Ulasan dan masukan dari pelanggan" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg border shadow-sm text-center">
                    <h3 className="text-gray-500 text-sm">Rata-rata Rating</h3>
                    <div className="flex justify-center items-center gap-2 mt-2">
                        <span className="text-4xl font-bold text-gray-800">4.5</span>
                        <Star className="fill-yellow-400 text-yellow-400" size={32} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Dari 120 Ulasan</p>
                </div>
            </div>

            <div className="space-y-4">
                {reviews.map(r => (
                    <div key={r.id} className="bg-white p-4 rounded-lg border border-gray-200 flex gap-4">
                        <div className="bg-blue-50 p-3 rounded-full h-fit">
                            <MessageSquare size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800">{r.customer}</h4>
                                <span className="text-xs text-gray-400">{r.date}</span>
                            </div>
                            <div className="flex my-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                                ))}
                            </div>
                            <p className="text-sm text-gray-600">"{r.comment}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}