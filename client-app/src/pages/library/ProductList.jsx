import React, { useEffect, useState } from "react";
import productsAPI from "../../api/products";
import { X, Edit, Trash2, Plus, Package } from "lucide-react";

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        price: "",
        stock: "",
        category: "",
        description: "",
        image_url: ""
    });

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const res = await productsAPI.list();
            setProducts(res.data.products || []);
        } catch (error) {
            console.error("Error loading products:", error);
            setProducts([]);
        }
    }

    function openAddModal() {
        setEditMode(false);
        setCurrentProduct(null);
        setFormData({
            name: "",
            sku: `SKU-${Date.now()}`,
            price: "",
            stock: "",
            category: "",
            description: "",
            image_url: ""
        });
        setShowModal(true);
    }

    function openEditModal(product) {
        setEditMode(true);
        setCurrentProduct(product);
        setFormData({
            name: product.name || "",
            sku: product.sku || "",
            price: product.price || "",
            stock: product.stock || "",
            category: product.category || "",
            description: product.description || "",
            image_url: product.image_url || ""
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditMode(false);
        setCurrentProduct(null);
        setFormData({
            name: "",
            sku: "",
            price: "",
            stock: "",
            category: "",
            description: "",
            image_url: ""
        });
    }

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validation
        if (!formData.name || !formData.price) {
            alert("Nama produk dan harga wajib diisi!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                sku: formData.sku || `SKU-${Date.now()}`,
                price: parseInt(formData.price) || 0,
                stock: parseInt(formData.stock) || 0,
                category: formData.category || "",
                description: formData.description || "",
                image_url: formData.image_url || ""
            };

            if (editMode && currentProduct) {
                // Update existing product
                await productsAPI.update(currentProduct.id, payload);
            } else {
                // Create new product
                await productsAPI.create(payload);
            }
            
            await load();
            closeModal();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Gagal menyimpan produk. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
        
        try {
            await productsAPI.delete(id);
            await load();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Gagal menghapus produk.");
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Daftar Produk</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola semua produk Anda di sini</p>
                </div>
                <button 
                    onClick={openAddModal} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Tambah Produk
                </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {products.length === 0 ? (
                    <div className="text-center py-16">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">Belum ada produk</p>
                        <button 
                            onClick={openAddModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Tambah Produk Pertama
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-700">Produk</th>
                                    <th className="p-4 font-semibold text-gray-700">SKU</th>
                                    <th className="p-4 font-semibold text-gray-700">Kategori</th>
                                    <th className="p-4 font-semibold text-gray-700">Harga</th>
                                    <th className="p-4 font-semibold text-gray-700">Stok</th>
                                    <th className="p-4 font-semibold text-gray-700">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        <Package size={24} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">{p.name}</div>
                                                    {p.description && (
                                                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 text-sm">{p.sku}</td>
                                        <td className="p-4">
                                            {p.category ? (
                                                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                                    {p.category}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-semibold text-gray-900">
                                            Rp {parseInt(p.price || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`font-medium ${parseInt(p.stock || 0) > 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                {p.stock || 0}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => openEditModal(p)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Add/Edit Product */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editMode ? "Edit Produk" : "Tambah Produk Baru"}
                            </h2>
                            <button 
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                {/* Nama Produk */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Produk <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Contoh: Kopi Latte"
                                        required
                                    />
                                </div>

                                {/* SKU */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        SKU (Stock Keeping Unit)
                                    </label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Otomatis dibuat jika kosong"
                                    />
                                </div>

                                {/* Kategori */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kategori
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Contoh: Minuman, Makanan, Snack"
                                    />
                                </div>

                                {/* Price & Stock */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Harga (Rp) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stok
                                        </label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {/* Image URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        URL Gambar
                                    </label>
                                    <input
                                        type="url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {formData.image_url && (
                                        <div className="mt-2">
                                            <img 
                                                src={formData.image_url} 
                                                alt="Preview" 
                                                className="h-24 w-24 object-cover rounded-lg"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        placeholder="Deskripsi produk (opsional)"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    {loading ? "Menyimpan..." : (editMode ? "Simpan Perubahan" : "Tambah Produk")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}