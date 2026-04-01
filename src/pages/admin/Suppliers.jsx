import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    supplierService, 
    SUPPLIER_STATUS_CONFIG,
    SUPPLIER_CATEGORIES 
} from '../../services/supplierService';
import { 
    Plus, Trash2, Phone, Mail, Box, Edit2, Eye, Download,
    Search, Filter, RefreshCw, Users, TrendingUp, Package,
    DollarSign, X, Building, MapPin, FileText
} from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { useModal } from '../../context/ModalContext';

const AdminSuppliers = () => {
    const { formatPrice } = useShop();
    const { showConfirm, showAlert } = useModal();
    
    // Data state
    const [suppliers, setSuppliers] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [showDetail, setShowDetail] = useState(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;
    
    // Filters
    const [filterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        category: 'Hardware',
        status: 'active',
        notes: ''
    });
    

    
    const categoryOptions = [
        { value: '', label: 'Todas' },
        ...SUPPLIER_CATEGORIES
    ];

    useEffect(() => {
        fetchSuppliers();
    }, [currentPage, filterStatus, filterCategory]);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage
            };
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;
            if (searchTerm) params.search = searchTerm;

            const data = await supplierService.getSuppliers(params);
            setSuppliers(data.suppliers || data);
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            showAlert({ title: 'Error', message: 'Error al cargar proveedores', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const data = await supplierService.getStatistics();
            setStatistics(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchSuppliers();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            contact: '',
            email: '',
            phone: '',
            address: '',
            category: 'Hardware',
            status: 'active',
            notes: ''
        });
        setEditingSupplier(null);
    };

    const handleOpenForm = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name || '',
                contact: supplier.contact || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                category: supplier.category || 'Hardware',
                status: supplier.status || 'active',
                notes: supplier.notes || ''
            });
        } else {
            resetForm();
        }
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            showAlert({ title: 'Error', message: 'El nombre es requerido', type: 'error' });
            return;
        }
        
        if (!formData.email.trim()) {
            showAlert({ title: 'Error', message: 'El email es requerido', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            if (editingSupplier) {
                await supplierService.updateSupplier(editingSupplier.id, formData);
                showAlert({ title: 'Éxito', message: 'Proveedor actualizado correctamente', type: 'success' });
            } else {
                await supplierService.addSupplier(formData);
                showAlert({ title: 'Éxito', message: 'Proveedor creado correctamente', type: 'success' });
            }
            
            setShowForm(false);
            resetForm();
            await fetchSuppliers();
            await fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al guardar proveedor', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (supplier) => {
        showConfirm(`¿Estás seguro de eliminar el proveedor "${supplier.name}"?`, async () => {
            try {
                await supplierService.deleteSupplier(supplier.id);
                showAlert({ title: 'Éxito', message: 'Proveedor eliminado correctamente', type: 'success' });
                await fetchSuppliers();
                await fetchStatistics();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message || 'Error al eliminar proveedor', type: 'error' });
            }
        });
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;

            const csvContent = await supplierService.exportSuppliers(params);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar', type: 'error' });
        }
    };

    const getStatusBadge = (status) => {
        const config = SUPPLIER_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`${config.color} px-2 py-1 rounded-md text-xs font-bold uppercase`}>
                {config.label}
            </span>
        );
    };

    // Client-side search filtering
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        return suppliers.filter(supplier =>
            supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [suppliers, searchTerm]);

    // Calculate local stats
    const localStats = useMemo(() => {
        if (!suppliers.length) return null;
        const active = suppliers.filter(s => s.status === 'active').length;
        const inactive = suppliers.filter(s => s.status === 'inactive').length;
        const pending = suppliers.filter(s => s.status === 'pending').length;
        const totalProducts = suppliers.reduce((sum, s) => sum + (s.productCount || 0), 0);
        const totalExpenses = suppliers.reduce((sum, s) => sum + (s.totalExpenses || 0), 0);
        return { active, inactive, pending, totalProducts, totalExpenses };
    }, [suppliers]);

    if (loading && !statistics && suppliers.length === 0) {
        return (
            <AdminLayout title="Proveedores">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Gestión de Proveedores">
            <div className="space-y-8 animate-fade-in-up">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Base de datos de aliados estratégicos y proveedores.</p>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </Button>
                        <Button onClick={() => handleOpenForm()} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nuevo Proveedor
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Proveedores */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Proveedores</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.summary?.totalSuppliers || totalItems || suppliers.length}</h3>
                            </div>
                            <Building className="w-8 h-8 text-blue-200" />
                        </div>
                        <div className="mt-4 flex items-center text-blue-100 text-sm">
                            <span>Registrados</span>
                        </div>
                    </div>

                    {/* Activos */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Activos</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.summary?.activeSuppliers || localStats?.active || suppliers.filter(s => s.status === 'active').length}</h3>
                            </div>
                            <Users className="w-8 h-8 text-green-200" />
                        </div>
                        <div className="mt-4 flex items-center text-green-100 text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>Proveedores activos</span>
                        </div>
                    </div>

                    {/* Productos Totales */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Productos Totales</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.summary?.totalProducts || localStats?.totalProducts || suppliers.reduce((sum, s) => sum + (s.productCount || 0), 0)}</h3>
                            </div>
                            <Package className="w-8 h-8 text-purple-200" />
                        </div>
                        <div className="mt-4 flex items-center text-purple-100 text-sm">
                            <span>De todos los proveedores</span>
                        </div>
                    </div>

                    {/* Gastos Totales */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Gastos Totales</p>
                                <h3 className="text-2xl font-bold mt-2">{formatPrice(statistics?.summary?.totalExpenses || localStats?.totalExpenses || 0)}</h3>
                            </div>
                            <DollarSign className="w-8 h-8 text-orange-200" />
                        </div>
                        <div className="mt-4 flex items-center text-orange-100 text-sm">
                            <span>Registrados en gastos</span>
                        </div>
                    </div>
                </div>

                {/* Category Distribution */}
                {statistics?.categoryDistribution && statistics.categoryDistribution.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Categoría</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {statistics.categoryDistribution.map((cat, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-sm text-gray-500">{cat.category}</p>
                                    <p className="text-2xl font-bold text-gray-800">{cat.count}</p>
                                    <p className="text-xs text-gray-400">{cat.totalProducts || 0} productos</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, contacto o email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        
                        {/* Search Button */}
                        <Button onClick={handleSearch} variant="outline" className="flex items-center justify-center gap-2">
                            <Filter className="w-4 h-4" /> Filtrar
                        </Button>
                    </div>
                </div>

                {/* Suppliers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                        <div key={supplier.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                                    {supplier.name?.substring(0, 2) || '??'}
                                </div>
                                <div className="flex gap-1">
                                    {getStatusBadge(supplier.status)}
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-1">{supplier.name}</h3>
                            <p className="text-gray-500 text-sm mb-1">{supplier.category}</p>
                            <p className="text-gray-500 text-sm mb-4">Contacto: {supplier.contact || 'N/A'}</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{supplier.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {supplier.phone || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    Productos: <span className="font-bold text-gray-800">{supplier.productCount || 0}</span>
                                </div>
                                {supplier.totalExpenses > 0 && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                        Gastos: <span className="font-bold text-gray-800">{formatPrice(supplier.totalExpenses)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={() => setShowDetail(supplier)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Ver detalles"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleOpenForm(supplier)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(supplier)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Empty State */}
                {filteredSuppliers.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">No se encontraron proveedores</h3>
                        <p className="text-gray-400 mt-1">Agrega tu primer proveedor para comenzar</p>
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100">
                        <p className="text-sm text-gray-500">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} proveedores
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                                if (page > totalPages || page < 1) return null;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            currentPage === page 
                                                ? 'bg-blue-600 text-white' 
                                                : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de Empresa <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Microsoft"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Contact */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contacto
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contact}
                                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {SUPPLIER_CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@empresa.com"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dirección
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Dirección de la empresa"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                    <option value="pending">Pendiente</option>
                                </select>
                            </div>
                            
                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notas
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Notas adicionales..."
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Crear Proveedor'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Detalle del Proveedor</h2>
                            <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-2xl uppercase">
                                    {showDetail.name?.substring(0, 2) || '??'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{showDetail.name}</h3>
                                    <p className="text-gray-500">{showDetail.category}</p>
                                    <div className="mt-1">{getStatusBadge(showDetail.status)}</div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Contacto</p>
                                        <p className="text-gray-800">{showDetail.contact || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-gray-800">{showDetail.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Teléfono</p>
                                        <p className="text-gray-800">{showDetail.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                {showDetail.address && (
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Dirección</p>
                                            <p className="text-gray-800">{showDetail.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-purple-700">{showDetail.productCount || 0}</p>
                                    <p className="text-xs text-purple-600">Productos</p>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 text-center">
                                    <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                                    <p className="text-lg font-bold text-orange-700">{formatPrice(showDetail.totalExpenses || 0)}</p>
                                    <p className="text-xs text-orange-600">Gastos</p>
                                </div>
                            </div>
                            
                            {showDetail.notes && (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                        <FileText className="w-4 h-4" />
                                        Notas
                                    </div>
                                    <p className="text-gray-700">{showDetail.notes}</p>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Registrado: {showDetail.createdAt ? new Date(showDetail.createdAt).toLocaleString('es-ES') : 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <Button variant="outline" onClick={() => { setShowDetail(null); handleOpenForm(showDetail); }} className="flex-1">
                                <Edit2 className="w-4 h-4 mr-2" /> Editar
                            </Button>
                            <Button onClick={() => setShowDetail(null)} className="flex-1">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminSuppliers;
