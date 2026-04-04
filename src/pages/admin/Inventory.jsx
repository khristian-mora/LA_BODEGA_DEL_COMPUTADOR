import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { inventoryService } from '../../services/inventoryService';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, PlusCircle, MinusCircle, Upload, Download, FileDown, FileUp, RefreshCw, FileText, Package, AlertTriangle, CheckCircle, TrendingUp, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { buildApiUrl, buildUploadUrl } from '../../config/config';
import { useAudit } from '../../context/AuditContext';
import { useModal } from '../../context/ModalContext';
import PortalWrapper from '../../components/PortalWrapper';
import * as XLSX from 'xlsx';

const AdminInventory = () => {
    const { formatPrice } = useShop();
    const { logAction } = useAudit();
    const { showConfirm, showAlert } = useModal();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [_currentPage, _setCurrentPage] = useState(1);
    const [_totalPages, _setTotalPages] = useState(1);
    const _itemsPerPage = 10;
    const fileInputRef = React.useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);

    const stats = {
        total: products.length,
        lowStock: products.filter(p => p.stock <= (p.minStock || 5)).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        totalValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0)
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userRole = user.role || 'técnico';
    const isAdmin = userRole === 'admin';
    const isVendedor = userRole === 'vendedor';
    const canModify = isAdmin || isVendedor;

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
        builderCategory: '',
        warrantyMonths: 12
    });
    // Specs: array of {key, value} pairs for dynamic editing
    const [specsRows, setSpecsRows] = useState([{ key: '', value: '' }]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getAllProducts();
            // Handle both legacy array and new paginated object
            const productsList = Array.isArray(data) ? data : (data.products || data.data || []);
            setProducts(productsList);
            _setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentProduct(null);
        setFormData({ 
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
        setSpecsRows([{ key: '', value: '' }]);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                name: product.name,
                category: product.category || 'Laptops',
                price: product.price,
                stock: product.stock,
                minStock: product.minStock || 2,
                supplierEmail: product.supplierEmail || '',
                image: product.image || '',
                description: product.description || '',
                builderCategory: product.builderCategory || ''
            });

            if (product.specs) {
                try {
                    const parsedSpecs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
                    setSpecsRows(Object.entries(parsedSpecs).map(([key, value]) => ({ key, value: String(value) })));
                } catch (e) {
                    setSpecsRows([{ key: '', value: '' }]);
                }
            } else {
                setSpecsRows([{ key: '', value: '' }]);
            }
        } else {
            resetForm();
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
            const response = await fetch(buildApiUrl('/api/upload'), {
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

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setImporting(true);
        try {
            const result = await inventoryService.importProducts(file);
            showAlert({ 
                title: 'Importación Exitosa', 
                message: `Se crearon ${result.created} y se actualizaron ${result.updated} productos.`, 
                type: 'success' 
            });
            setShowImportModal(false);
            fetchProducts();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const data = [{
            Nombre: 'Producto Ejemplo',
            Precio: 1500000,
            Categoria: 'Laptops',
            Stock: 10,
            Minimo: 2,
            Proveedor: 'proveedor@ejemplo.com',
            Descripcion: 'Laptop de prueba',
            Especificaciones: 'RAM:16GB, Procesador:i7'
        }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        XLSX.writeFile(wb, 'plantilla_productos_lbdc.xlsx');
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/products/export?format=json&token=${token}`));
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allProducts = await response.json();
            
            const dataToExport = allProducts.map(p => ({
                ID: p.id,
                Nombre: p.name || '',
                Precio: p.price || 0,
                Categoria: p.category || '',
                Stock: p.stock || 0,
                Minimo: p.minStock || 0,
                Proveedor: p.supplierEmail || p.supplier_id || '',
                SKU: p.sku || '',
                Descripcion: p.description || '',
                Especificaciones: p.specs || ''
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
            XLSX.writeFile(wb, `LBDC_INVENTORY_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo exportar el inventario', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Gestión de Inventario">
            <div className="space-y-6 pb-12">
                
                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:scale-110">
                                <Package className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Total SKU</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Productos Únicos</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-600 transition-transform group-hover:scale-110">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-red-500 bg-red-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Stock Bajo</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.lowStock}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Requieren Acción</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">En Stock</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total - stats.lowStock}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Niveles Saludables</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform">
                            <TrendingUp className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl text-white">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Valorización</span>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h4 className="text-3xl font-black text-white tracking-tighter">{formatPrice(stats.totalValue)}</h4>
                            <p className="text-xs font-bold text-white/40 uppercase">Capital en Inventario</p>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden">
                    {/* Industrial Toolbar */}
                    <div className="p-8 border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-center bg-gray-50/20 gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-200">
                                <Package className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-1">Registro Maestro</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{products.length} Entradas Activas</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre o ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm transition-all focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none"
                                />
                            </div>
                            
                            <div className="relative">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select 
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="pl-11 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm transition-all outline-none appearance-none focus:ring-4 focus:ring-slate-100"
                                >
                                    <option value="all">Todas las Categorías</option>
                                    {['Laptops', 'Desktops', 'Monitors', 'Components', 'Peripherals', 'Printers', 'Furniture', 'Gaming'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                                <div className="flex gap-2 w-full lg:w-auto lg:border-l border-gray-100 lg:pl-3">
                                    <Button onClick={handleExportExcel} variant="outline" className="h-12 flex-1 lg:flex-none border-gray-200 rounded-2xl hover:bg-gray-50 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <FileDown className="w-4 h-4" /> Exportar
                                    </Button>
                                    <Button onClick={() => setShowImportModal(true)} variant="outline" className="h-12 flex-1 lg:flex-none border-gray-200 rounded-2xl hover:bg-gray-50 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Importar
                                    </Button>
                                    <Button onClick={() => handleOpenModal()} className="h-12 flex-1 lg:flex-none bg-slate-900 rounded-2xl shadow-xl hover:bg-black font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-white" /> Nuevo
                                    </Button>
                                </div>
                        </div>
                    </div>

                    {/* Industrial Ledger Table */}
                    <div className="overflow-x-auto p-2">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                                    <th className="p-6">Información del Producto</th>
                                    <th className="p-6">Categoría & Clasificación</th>
                                    <th className="p-6">Valuación Unitaria</th>
                                    <th className="p-6">Disponibilidad</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                <AnimatePresence mode="popLayout">
                                    {loading && !isModalOpen ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Almacén...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Package className="w-16 h-16" />
                                                    <p className="text-xs font-black uppercase tracking-widest">No hay registros que coincidan</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredProducts.map((product, idx) => (
                                        <motion.tr 
                                            key={product.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-slate-50/50 transition-all group border-b border-gray-50"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group-hover:scale-105 transition-transform duration-500">
                                                        <img 
                                                            src={buildUploadUrl(product.image)} 
                                                            alt="" 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=IMG' }}
                                                        />
                                                        {product.stock <= (product.minStock || 5) && (
                                                            <div className="absolute top-0 right-0 bg-red-500 p-1 rounded-bl-xl shadow-lg">
                                                                <AlertTriangle className="w-3 h-3 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{product.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-tighter">SKU-{product.id.toString().padStart(6, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="w-fit bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                                                        {product.category}
                                                    </span>
                                                    {product.builderCategory && (
                                                        <span className="w-fit bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1.5">
                                                            <PlusCircle className="w-2.5 h-2.5" /> Componente Builder
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-black text-slate-900 tracking-tighter">
                                                        {formatPrice(product.price)}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Iva Incluido (19%)</p>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between w-32">
                                                        <span className={`text-xs font-black ${product.stock > (product.minStock || 5) ? 'text-slate-900' : 'text-red-600'}`}>
                                                            {product.stock || '0'} <span className="font-normal opacity-50 italic">un.</span>
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-300">/ {product.minStock || 5} min</span>
                                                    </div>
                                                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (product.stock / (product.minStock * 4)) * 100)}%` }}
                                                            className={`h-full rounded-full ${product.stock > (product.minStock || 5) ? 'bg-emerald-400' : 'bg-red-400'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canModify && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleOpenModal(product)}
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                                            title="Editar Registro"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </motion.button>
                                                    )}
                                                    
                                                    {isAdmin && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleDelete(product.id)}
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                                                            title="Eliminar del Sistema"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Industrial Data Entry Modal */}
            <PortalWrapper isOpen={isModalOpen}>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl relative z-10 flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-900 tracking-tight leading-none mb-1">
                                            {currentProduct ? 'Sincronizar Producto' : 'Nueva Entrada de Inventario'}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor de Almacén Maestro</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            <div className="overflow-y-auto p-8 custom-scrollbar">
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
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Meses Garantía</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={formData.warrantyMonths}
                                            onChange={e => setFormData({ ...formData, warrantyMonths: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                            placeholder="12"
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
                    </motion.div>
                </div>
            )}
            </PortalWrapper>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-600" /> Importar Productos
                            </h2>
                            <button onClick={() => setShowImportModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h3 className="text-blue-800 font-bold text-sm mb-2">Instrucciones de Importación</h3>
                                <ul className="text-blue-700 text-xs space-y-2 list-disc pl-4">
                                    <li>Usa archivos <b>.xlsx</b> o <b>.csv</b>.</li>
                                    <li>Columna requerida: <b>Nombre</b>.</li>
                                    <li>Si el producto ya existe (mismo Nombre), se actualizarán sus datos.</li>
                                    <li>Especificaciones deben tener formato: <b>Key:Value, Key:Value</b>.</li>
                                    <li>Columnas: Precio, Categoria, Stock, Minimo, Proveedor, Descripcion.</li>
                                </ul>
                            </div>

                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-blue-400 transition-colors bg-gray-50 group">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleImport}
                                    id="product-import"
                                    className="hidden"
                                    disabled={importing}
                                />
                                <label 
                                    htmlFor="product-import"
                                    className="flex flex-col items-center cursor-pointer"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {importing ? (
                                            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                                        ) : (
                                            <FileText className="w-8 h-8 text-blue-500" />
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {importing ? 'Procesando...' : 'Seleccionar archivo Excel/CSV'}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        O arrastra y suelta aquí
                                    </span>
                                </label>
                            </div>

                            <button 
                                onClick={downloadTemplate}
                                className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <Download className="w-4 h-4" /> Descargar Plantilla de Ejemplo
                            </button>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowImportModal(false)}
                                className="w-full"
                                disabled={importing}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminInventory;
