import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    supplierService, 
    SUPPLIER_STATUS_CONFIG,
    SUPPLIER_CATEGORIES 
} from '../../services/supplierService';
import { 
    Plus, Trash2, Phone, Mail, Box, Edit2, Eye, Download, Upload,
    Search, Filter, RefreshCw, Users, TrendingUp, Package,
    DollarSign, X, Building, MapPin, FileText, ChevronLeft, ChevronRight, Activity, ArrowRight, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import PortalWrapper from '../../components/PortalWrapper';
import { useModal } from '../../context/ModalContext';
import { buildApiUrl } from '../../config/config';
import * as XLSX from 'xlsx';

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
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;
    
    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, _setFilterStatus] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', phone: '', address: '',
        category: 'Hardware', status: 'active', notes: ''
    });

    const categoryOptions = [
        { value: '', label: 'Todas las Categorías' },
        ...SUPPLIER_CATEGORIES
    ];

    useEffect(() => {
        fetchSuppliers();
    }, [currentPage, filterStatus, filterCategory, searchTerm]);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, limit: itemsPerPage };
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;
            if (searchTerm) params.search = searchTerm;

            const data = await supplierService.getSuppliers(params);
            const suppliersList = Array.isArray(data) ? data : (data.suppliers || []);
            setSuppliers(suppliersList);
            
            const pagination = data.pagination || {};
            setTotalPages(pagination.totalPages || 1);
            setTotalItems(pagination.total || suppliersList.length);
        } catch (error) {
            showAlert({ title: 'Error de Red', message: 'Fallo al sincronizar proveedores', type: 'error' });
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

    const handleExport = async () => {
        try {
            const data = await supplierService.exportSuppliers({
                status: filterStatus || null,
                category: filterCategory || null,
                format: 'json'
            });

            if (!data || data.length === 0) {
                showAlert({ title: 'Sin Datos', message: 'No hay proveedores para exportar', type: 'info' });
                return;
            }
            
            const exportData = data.map(s => ({
                'ID': s.id,
                'Nombre / Empresa': s.name,
                'Contacto Principal': s.contact || 'N/A',
                'Correo Electrónico': s.email,
                'Teléfono': s.phone || 'N/A',
                'Dirección Física': s.address || 'N/A',
                'Categoría': s.category,
                'Estado Operativo': s.status === 'active' ? 'ACTIVO' : 'INACTIVO',
                'Total Productos': s.productCount || 0,
                'Fecha Registro': new Date(s.createdAt).toLocaleString(),
                'Notas / Observaciones': s.notes || ''
            }));
            
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');

            // Fit columns
            const wscols = [
                { wch: 10 }, { wch: 30 }, { wch: 25 }, { wch: 30 }, 
                { wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, 
                { wch: 15 }, { wch: 20 }, { wch: 50 }
            ];
            ws['!cols'] = wscols;

            XLSX.writeFile(wb, `Reporte_Proveedores_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Export error:', error);
            showAlert({ title: 'Error', message: 'No se pudo generar el reporte de proveedores', type: 'error' });
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setImporting(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(buildApiUrl('/api/suppliers/import'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });
            
            if (!response.ok) throw new Error('Error en la importación');
            
            showAlert({ title: 'Éxito', message: `Se importaron ${jsonData.length} proveedores`, type: 'success' });
            fetchSuppliers();
            setShowImportModal(false);
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const data = [{
            Nombre: 'Proveedor Ejemplo',
            Contacto: 'Juan Perez',
            Email: 'contacto@proveedor.com',
            Telefono: '3001234567',
            Direccion: 'Calle 123 #45-67',
            Categoria: 'Hardware',
            Estado: 'active',
            Notas: 'Notas opcionales'
        }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
        XLSX.writeFile(wb, 'plantilla_proveedores_lbdc.xlsx');
    };

    const resetForm = () => {
        setFormData({ name: '', contact: '', email: '', phone: '', address: '', category: 'Hardware', status: 'active', notes: '' });
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
        setLoading(true);
        try {
            if (editingSupplier) {
                await supplierService.updateSupplier(editingSupplier.id, formData);
                showAlert({ title: 'Éxito Operativo', message: 'Perfil de proveedor actualizado', type: 'success' });
            } else {
                await supplierService.addSupplier(formData);
                showAlert({ title: 'Éxito Operativo', message: 'Nuevo aliado registrado en la red', type: 'success' });
            }
            setShowForm(false);
            resetForm();
            fetchSuppliers();
            fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Error de Validacion', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (supplierId) => {
        const confirmed = await showConfirm({
            title: 'Desvincular Aliado',
            message: '¿Estás seguro de eliminar este proveedor de la cadena de suministro?',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await supplierService.deleteSupplier(supplierId);
            showAlert({ title: 'Purga Completada', message: 'Proveedor desvinculado exitosamente', type: 'success' });
            fetchSuppliers();
            fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Acceso Denegado', message: error.message, type: 'error' });
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
            case 'inactive': return 'bg-red-500/10 text-red-600 border-red-200';
            default: return 'bg-amber-500/10 text-amber-600 border-amber-200';
        }
    };

    return (
        <AdminLayout title="Centro de Proveedores">
            <div className="space-y-6 pb-12">
                
                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:scale-110">
                                <Building className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Red de Aliados</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{statistics?.summary?.totalSuppliers || totalItems}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Proveedores Activos</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
                                <Package className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Stock Suministrado</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{statistics?.summary?.totalProducts || 0}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">SKUs Vinculados</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform">
                            <Activity className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl text-white">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Flujo Operativo</span>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h4 className="text-3xl font-black text-white tracking-tighter">{formatPrice(statistics?.summary?.totalExpenses || 0)}</h4>
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Gasto Total Acumulado</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 transition-transform group-hover:scale-110">
                                <RefreshCw className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Diversidad</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{statistics?.categoryDistribution?.length || 0}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Categorías de Suministro</p>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden">
                    {/* Industrial Toolbar */}
                    <div className="p-10 border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-center bg-gray-50/10 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 group transition-all hover:scale-105">
                                <Users className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-black text-3xl text-slate-900 tracking-tight leading-none mb-2">Gestión de Proveedores</h3>
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{totalItems} Proveedores Activos</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Nombre de proveedor o contacto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-medium transition-all focus:ring-[6px] focus:ring-slate-50 focus:border-slate-300 outline-none placeholder:text-slate-400"
                                />
                            </div>
                            
                            <select 
                                value={filterCategory}
                                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                className="px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all outline-none appearance-none focus:ring-[6px] focus:ring-slate-50 min-w-[220px] cursor-pointer hover:bg-slate-50"
                            >
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>
                                ))}
                            </select>

                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleExport}
                                className="h-14 px-6 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                            >
                                <Download className="w-4 h-4" /> Exportar
                            </motion.button>
                            
                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => setShowImportModal(true)}
                                className="h-14 px-6 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                            >
                                <Upload className="w-4 h-4" /> Importar
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleOpenForm()}
                                className="h-14 flex-1 lg:flex-none bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 px-8 transition-colors"
                            >
                                <Plus className="w-5 h-5" /> Registrar Proveedor
                            </motion.button>
                        </div>
                    </div>

                    {/* Industrial Grid Ledger */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <div className="col-span-full py-32 text-center flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 border-[6px] border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Módulo de Abasto...</p>
                                </div>
                            ) : suppliers.length === 0 ? (
                                <div className="col-span-full py-32 text-center flex flex-col items-center gap-6 opacity-20">
                                    <Building className="w-24 h-24 text-slate-400" />
                                    <p className="text-xs font-black uppercase tracking-[0.3em]">No se han detectado proveedores vinculados bajo estos parámetros</p>
                                </div>
                            ) : suppliers.map((supplier, idx) => (
                                <motion.div
                                    key={supplier.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-100 transition-all group relative"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-900 font-black text-2xl group-hover:bg-slate-900 group-hover:text-white transition-all cursor-default shadow-sm border border-slate-100">
                                            {supplier.name?.charAt(0)}
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(supplier.status)}`}>
                                            {supplier.status}
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-6">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors uppercase">{supplier.name}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{supplier.category} / Proveedor</p>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-4 text-slate-600">
                                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold truncate">{supplier.email}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600">
                                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold">{supplier.phone || 'COMM-OFFLINE'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600">
                                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <Package className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold">{supplier.productCount || 0} SKUs Registrados</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowDetail(supplier)}
                                            className="flex-1 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleOpenForm(supplier)}
                                            className="flex-1 h-12 bg-white text-indigo-500 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100/50"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDelete(supplier.id)}
                                            className="flex-1 h-12 bg-white text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100/50"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Industrial Pagination */}
                    {totalPages > 1 && (
                        <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Páginas de Suministro: {currentPage} / {totalPages}</p>
                            <div className="flex gap-3">
                                <motion.button 
                                    whileHover={{ x: -2 }}
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-4 bg-white border border-slate-100 rounded-2xl disabled:opacity-30 hover:border-slate-900 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </motion.button>
                                <motion.button 
                                    whileHover={{ x: 2 }}
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-4 bg-white border border-slate-100 rounded-2xl disabled:opacity-30 hover:border-slate-900 transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Industrial Form Modal */}
            <PortalWrapper isOpen={showForm}>
                {showForm && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-900 rounded-[1.75rem] flex items-center justify-center shadow-2xl">
                                        <Building className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-3xl text-slate-900 tracking-tight mb-1">
                                            {editingSupplier ? 'Editar Proveedor' : 'Registrar Proveedor'}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Formulario de Registro de Proveedores</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Entidad Corporativa *</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all placeholder:font-bold placeholder:text-slate-300" 
                                            placeholder="Nombre Comercial del Proveedor..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Persona de Contacto</label>
                                            <input 
                                                type="text" 
                                                value={formData.contact} 
                                                onChange={e => setFormData({ ...formData, contact: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all" 
                                                placeholder="Responsable de Cuenta..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Categoría Técnica *</label>
                                            <select 
                                                required 
                                                value={formData.category} 
                                                onChange={e => setFormData({ ...formData, category: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all px-8 appearance-none"
                                            >
                                                {SUPPLIER_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Canal Digital (Email) *</label>
                                            <input 
                                                required 
                                                type="email" 
                                                value={formData.email} 
                                                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all" 
                                                placeholder="email@proveedor.com"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Línea Telefónica</label>
                                            <input 
                                                type="text" 
                                                value={formData.phone} 
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all" 
                                                placeholder="+XX XXX XXX XXXX"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Domicilio Fiscal / Almacén</label>
                                        <input 
                                            type="text" 
                                            value={formData.address} 
                                            onChange={e => setFormData({ ...formData, address: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all" 
                                            placeholder="Ubicación física de despacho..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Status Operativo</label>
                                            <select 
                                                value={formData.status} 
                                                onChange={e => setFormData({ ...formData, status: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all px-8 appearance-none"
                                            >
                                                <option value="active">ACTIVO - PRIORIDAD 1</option>
                                                <option value="inactive">INACTIVO - STANDBY</option>
                                                <option value="pending">PENDIENTE - AUDITORÍA</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Protocolos / Notas</label>
                                        <textarea 
                                            value={formData.notes} 
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all resize-none" 
                                            rows="4" 
                                            placeholder="Detallar acuerdos de entrega, SLAs o información crítica de suministro..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div> : (editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>

            {/* Industrial Detail Modal */}
            <PortalWrapper isOpen={showDetail}>
                {showDetail && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDetail(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-10 bg-slate-900 text-white relative">
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    <Building className="w-48 h-48" />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-6">
                                        <div className={`w-fit px-4 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(showDetail.status)} bg-white/5 border-white/20`}>
                                            {showDetail.status}
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black tracking-tighter leading-tight uppercase">{showDetail.name}</h3>
                                            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em] italic">{showDetail.category} • MASTER PARTNER</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDetail(null)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X className="w-6 h-6 text-white" /></button>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Enlace Principal</p>
                                        <p className="font-black text-slate-900 text-xl tracking-tight">{showDetail.contact || 'SOPORTE DIRECTO'}</p>
                                        <p className="text-sm font-bold text-slate-500 italic">Delegado de Cuenta</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Cartera de Activos</p>
                                        <p className="font-black text-slate-900 text-xl tracking-tight">{showDetail.productCount || 0} Productos</p>
                                        <p className="text-sm font-bold text-slate-500 italic">Integración de Stock</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <Mail className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal de Comunicación</p>
                                            <p className="font-black text-slate-900 underline decoration-indigo-500/30 underline-offset-4">{showDetail.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <Phone className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Línea de Asistencia</p>
                                            <p className="font-black text-slate-900">{showDetail.phone || 'COMUNICACIÓN LIMITADA'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <MapPin className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logística / Hub</p>
                                            <p className="font-black text-slate-900 truncate">{showDetail.address || 'UBICACIÓN RESERVADA'}</p>
                                        </div>
                                    </div>
                                </div>

                                {showDetail.notes && (
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest pl-2">Bitácora de Relación</p>
                                        <div className="relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-900 rounded-full"></div>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic pl-8 bg-slate-50 py-6 rounded-r-[2rem]">
                                                "{showDetail.notes}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => { setShowDetail(null); handleOpenForm(showDetail); }}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-3"
                                    >
                                        <Edit2 className="w-5 h-5" /> Editar Proveedor
                                    </motion.button>
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDetail(null)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all"
                                    >
                                        Cerrar Vista
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>

            {/* Import Modal */}
            <PortalWrapper isOpen={showImportModal}>
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="font-black text-xl text-slate-900">Importar Proveedores</h3>
                            <p className="text-sm text-slate-500 mt-1">Carga un archivo Excel con los datos de los proveedores</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <button
                                onClick={downloadTemplate}
                                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 text-slate-600 hover:text-indigo-600"
                            >
                                <Download className="w-5 h-5" />
                                <span className="font-bold">Descargar Plantilla</span>
                            </button>
                            
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleImport}
                                    disabled={importing}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className={`w-full p-4 border-2 border-slate-200 rounded-2xl flex items-center justify-center gap-3 ${importing ? 'bg-slate-50 text-slate-400' : 'hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600'} transition-all`}>
                                    {importing ? (
                                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5" />
                                    )}
                                    <span className="font-bold">{importing ? 'Importando...' : 'Seleccionar Archivo Excel'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setShowImportModal(false)}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>
            </PortalWrapper>
        </AdminLayout>
    );
};

export default AdminSuppliers;
