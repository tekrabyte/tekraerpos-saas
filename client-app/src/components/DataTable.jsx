import React, { useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ 
    columns, 
    data, 
    onAdd, 
    onEdit, 
    onDelete,
    onExport,
    loading = false,
    searchPlaceholder = "Cari data..."
}) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter data berdasarkan search
    const filteredData = data.filter(item => {
        const searchLower = search.toLowerCase();
        return columns.some(col => {
            const value = col.accessor(item);
            return value && value.toString().toLowerCase().includes(searchLower);
        });
    });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex justify-between items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        data-testid="table-search-input"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            data-testid="export-button"
                        >
                            <Download size={18} />
                            <span>Export</span>
                        </button>
                    )}
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            data-testid="add-button"
                        >
                            + Tambah Data
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500" data-testid="loading-state">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2">Memuat data...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center text-gray-500" data-testid="empty-state">
                        <p className="text-lg font-medium">Tidak ada data</p>
                        <p className="text-sm mt-1">Silakan tambah data baru</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full" data-testid="data-table">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {columns.map((col, idx) => (
                                        <th key={idx} className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            {col.header}
                                        </th>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors" data-testid={`table-row-${idx}`}>
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className="px-6 py-4 text-sm text-gray-900">
                                                {col.render ? col.render(item) : col.accessor(item)}
                                            </td>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex gap-3">
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(item)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                            data-testid={`edit-button-${idx}`}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(item)}
                                                            className="text-red-600 hover:text-red-800 font-medium"
                                                            data-testid={`delete-button-${idx}`}
                                                        >
                                                            Hapus
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                <div className="text-sm text-gray-600" data-testid="pagination-info">
                                    Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid="prev-page-button"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="px-4 py-1 text-sm text-gray-700" data-testid="current-page">
                                        Halaman {currentPage} dari {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid="next-page-button"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}