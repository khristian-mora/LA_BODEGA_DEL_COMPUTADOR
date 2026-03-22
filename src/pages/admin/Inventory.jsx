import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { inventoryService } from '../../services/inventoryService';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, PlusCircle, MinusCircle } from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { buildUploadUrl } from '../../config/config';
import { useAudit } from '../../context/AuditContext';
import { useModal } from '../../context/ModalContext';

const AdminInventory = () => {
    const { formatPrice } = useShop();
    const { logAction } = useAudit();
    const { showConfirm, showAlert } = useModal();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null); // For editing
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: 'Laptops',
        price: '',
        stock: 10,
        minStock: 2,
        supplierEmail: '',
        image: '',
        description: '',
        builderCategory: ''
    });
    // Specs: array of {key, value} pairs for dynamic editing
    const [specsRows, setSpecsRows] = useState([{ key: '', value: '' }]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const data = await inventoryService.getAllProducts();
        setProducts(data);
        setLoading(false);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                minStock: product.minStock || 2,
                supplierEmail: product.supplierEmail || '',
                image: product.image,
                description: product.description || '',
                builderCategory: product.builderCategory || ''
            });
            // Load specs as key-value rows
            const existingSpecs = product.specs && typeof product.specs === 'object' ? product.specs : {};
            const rows = Object.entries(existingSpecs).map(([key, value]) => ({ key, value: String(value) }));
            setSpecsRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
        } else {
            setCurrentProduct(null);
            setFormData({ name: '', category: 'Laptops', price: '', stock: 10, minStock: 2, supplierEmail: '', image: '', description: '', builderCategory: '' });
            setSpecsRows([{ key: '', value: '' }]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Build specs object from key-value rows
            const specsObj = {};
            specsRows.forEach(({ key, value }) => {
                const trimmedKey = key.trim();
                if (trimmedKey) specsObj[trimmedKey] = value.trim();
            });

            const payload = {
                ...formData,
                price: Number(formData.price),
                specs: specsObj
            };

            if (currentProduct) {
                await inventoryService.updateProduct(currentProduct.id, payload);
                logAction('UPDATE_PRODUCT', 'Inventario', `Actualizó producto: ${formData.name} (ID: ${currentProduct.id})`);
            } else {
                await inventoryService.addProduct(payload);
                logAction('CREATE_PRODUCT', 'Inventario', `Creó nuevo producto: ${formData.name}`);
            }
            await fetchProducts();
            setIsModalOpen(false);
        } catch (error) {
            showAlert({
                title: 'Error',
                message: 'Error al guardar el producto',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm({
            title: 'Confirmar eliminación',
            message: '¿Estás seguro de eliminar este producto?',
            variant: 'danger'
        });
        if (confirmed) {
            setLoading(true);
            const prodToDelete = products.find(p => p.id === id);
            await inventoryService.deleteProduct(id);
            logAction('DELETE_PRODUCT', 'Inventario', `Eliminó producto: ${prodToDelete?.name || 'ID: ' + id}`);
            await fetchProducts();
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: uploadFormData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al subir imagen',
                type: 'error'
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <AdminLayout title="Gestión de Inventario">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">

                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Productos ({products.length})</h3>
                        <p className="text-sm text-gray-500">Administra tu catálogo digital</p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Producto</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Precio</th>
                                <th className="p-4">Stock</th>
                                <th className="p-4 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && !isModalOpen ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando inventario...</td></tr>
                            ) : products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                <img src={buildUploadUrl(product.image)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm line-clamp-1 w-64">{product.name}</p>
                                                <p className="text-xs text-gray-500">ID: {product.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">{product.category}</span>
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-900 font-bold">
                                        {formatPrice(product.price)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${product.stock > 5 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="text-sm text-gray-700">{product.stock || '12'} un.</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="p-2 hover:bg-black hover:text-white rounded-lg text-gray-400 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-bold text-xl">{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Producto</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoría</label>
                                        <div className="relative">
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none appearance-none"
                                            >
                                                {['Laptops', 'Desktops', 'Monitors', 'Components', 'Peripherals', 'Printers', 'Furniture', 'Gaming'].map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Stock Actual</label>
                                        <input
                                            type="number"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-red-500 uppercase mb-2">Alerta Stock Bajo</label>
                                        <input
                                            type="number"
                                            value={formData.minStock}
                                            onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                                            className="w-full p-3 bg-red-50 border-transparent focus:border-red-500 focus:bg-white rounded-xl transition-all outline-none text-red-900"
                                            placeholder="Ej: 2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Proveedor</label>
                                        <input
                                            type="email"
                                            value={formData.supplierEmail}
                                            onChange={e => setFormData({ ...formData, supplierEmail: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                            placeholder="pedidos@prov.com"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            id="builderCheck"
                                            checked={!!formData.builderCategory}
                                            onChange={e => setFormData({ ...formData, builderCategory: e.target.checked ? 'processor' : '' })}
                                            className="rounded border-gray-300 text-black focus:ring-black w-4 h-4"
                                        />
                                        <label htmlFor="builderCheck" className="text-sm font-bold text-gray-700">Disponible en "Arma tu PC"</label>
                                    </div>

                                    {formData.builderCategory && (
                                        <div className="mt-3 pl-6">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Componente (Builder)</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.builderCategory}
                                                    onChange={e => setFormData({ ...formData, builderCategory: e.target.value })}
                                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none appearance-none"
                                                >
                                                    <option value="processor">Procesador</option>
                                                    <option value="motherboard">Board</option>
                                                    <option value="ram">Memoria RAM</option>
                                                    <option value="gpu">Tarjeta Gráfica</option>
                                                    <option value="storage">Almacenamiento</option>
                                                    <option value="psu">Fuente de Poder</option>
                                                    <option value="case">Chasis / Caja</option>
                                                    <option value="monitor">Monitor</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción del Producto</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none resize-none text-sm"
                                        placeholder="Descripción breve para mostrar en la tienda..."
                                    />
                                </div>

                                {/* Specifications */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Especificaciones</label>
                                        <button
                                            type="button"
                                            onClick={() => setSpecsRows(prev => [...prev, { key: '', value: '' }])}
                                            className="flex items-center gap-1 text-xs text-black font-semibold hover:text-gray-600 transition-colors"
                                        >
                                            <PlusCircle className="w-4 h-4" /> Agregar
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {specsRows.map((row, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    value={row.key}
                                                    onChange={e => {
                                                        const updated = [...specsRows];
                                                        updated[idx] = { ...updated[idx], key: e.target.value };
                                                        setSpecsRows(updated);
                                                    }}
                                                    placeholder="Clave (ej: RAM)"
                                                    className="flex-1 p-2 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-lg text-xs transition-all outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={row.value}
                                                    onChange={e => {
                                                        const updated = [...specsRows];
                                                        updated[idx] = { ...updated[idx], value: e.target.value };
                                                        setSpecsRows(updated);
                                                    }}
                                                    placeholder="Valor (ej: 16GB)"
                                                    className="flex-1 p-2 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-lg text-xs transition-all outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setSpecsRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ key: '', value: '' }])}
                                                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                                >
                                                    <MinusCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Precio (COP)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagen del Producto</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {formData.image ? (
                                                <img src={buildUploadUrl(formData.image)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={triggerFileInput}
                                                disabled={uploading}
                                                className="mb-2 w-full md:w-auto"
                                            >
                                                {uploading ? 'Subiendo...' : 'Subir Imagen'}
                                            </Button>
                                            <p className="text-xs text-gray-500 mb-1">O ingresa URL manual:</p>
                                            <input
                                                type="text"
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                className="w-full p-2 bg-gray-50 border-transparent rounded-lg text-xs focus:bg-white focus:border-black transition-all outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3 border-t border-gray-100">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                    <Button type="submit" variant="primary" className="flex-1">{loading ? 'Guardando...' : 'Guardar'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminInventory;
