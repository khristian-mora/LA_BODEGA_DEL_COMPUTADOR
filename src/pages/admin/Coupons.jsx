import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    couponService, 
    COUPON_STATUS_CONFIG, 
    COUPON_TYPE_CONFIG 
} from '../../services/couponService';
import { 
    Plus, Tag, Percent, DollarSign, Users, TrendingUp, 
    Download, Filter, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
    Calendar, AlertTriangle, Clock, XCircle, CheckCircle, BarChart3,
    Copy, Eye, RefreshCw, X
} from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { useModal } from '../../context/ModalContext';
import * as XLSX from 'xlsx';

const AdminCoupons = () => {
    const { formatPrice } = useShop();
    const { showConfirm, showAlert } = useModal();
    
    // Data state
    const [coupons, setCoupons] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [showDetail, setShowDetail] = useState(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;
    
    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange] = useState({ start: '', end: '' });
    
    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount: '',
        type: 'percent',
        expiresAt: '',
        minPurchase: '',
        maxUses: '',
        description: ''
    });
    
    const statusOptions = [
        { value: '', label: 'Todos' },
        { value: 'active', label: 'Activo', color: 'bg-green-100 text-green-700' },
        { value: 'expired', label: 'Expirado', color: 'bg-red-100 text-red-700' },
        { value: 'paused', label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' }
    ];
    
    const typeOptions = [
        { value: '', label: 'Todos' },
        { value: 'percent', label: 'Porcentaje' },
        { value: 'fixed', label: 'Monto Fijo' }
    ];

    useEffect(() => {
        fetchCoupons();
    }, [currentPage, filterStatus, filterType]);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage
            };
            if (filterStatus) params.status = filterStatus;
            if (filterType) params.type = filterType;
            if (searchTerm) params.search = searchTerm;
            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const data = await couponService.getCoupons(params);
            setCoupons(data.items || data.coupons || []);
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.total);
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
            showAlert({ title: 'Error', message: 'Error al cargar cupones', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const data = await couponService.getStatistics();
            setStatistics(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchCoupons();
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discount: '',
            type: 'percent',
            expiresAt: '',
            minPurchase: '',
            maxUses: '',
            description: ''
        });
        setEditingCoupon(null);
    };

    const handleOpenForm = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code || '',
                discount: coupon.discount?.toString() || '',
                type: coupon.type || 'percent',
                expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
                minPurchase: coupon.minPurchase?.toString() || '',
                maxUses: coupon.maxUses?.toString() || '',
                description: coupon.description || ''
            });
        } else {
            resetForm();
        }
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.code.trim()) {
            showAlert({ title: 'Error', message: 'El código es requerido', type: 'error' });
            return;
        }
        
        if (!formData.discount || parseFloat(formData.discount) <= 0) {
            showAlert({ title: 'Error', message: 'El descuento debe ser mayor a 0', type: 'error' });
            return;
        }
        
        if (formData.type === 'percent' && parseFloat(formData.discount) > 100) {
            showAlert({ title: 'Error', message: 'El descuento porcentual no puede ser mayor a 100%', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const data = {
                code: formData.code.toUpperCase().trim(),
                discount: parseFloat(formData.discount),
                type: formData.type,
                expiresAt: formData.expiresAt || null,
                minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
                maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
                description: formData.description || null
            };

            if (editingCoupon) {
                await couponService.updateCoupon(editingCoupon.id, data);
                showAlert({ title: 'Éxito', message: 'Cupón actualizado correctamente', type: 'success' });
            } else {
                await couponService.createCoupon(data);
                showAlert({ title: 'Éxito', message: 'Cupón creado correctamente', type: 'success' });
            }
            
            setShowForm(false);
            resetForm();
            await fetchCoupons();
            await fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al guardar cupón', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (coupon) => {
        const actionText = coupon.status === 'active' ? 'pausar' : 'activar';
        showConfirm(`¿Deseas ${actionText} este cupón?`, async () => {
            try {
                await couponService.toggleStatus(coupon.id);
                showAlert({ title: 'Éxito', message: 'Estado actualizado correctamente', type: 'success' });
                await fetchCoupons();
                await fetchStatistics();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message || 'Error al cambiar estado', type: 'error' });
            }
        });
    };

    const handleDelete = async (coupon) => {
        showConfirm(`¿Estás seguro de eliminar el cupón "${coupon.code}"?`, async () => {
            try {
                await couponService.deleteCoupon(coupon.id);
                showAlert({ title: 'Éxito', message: 'Cupón eliminado correctamente', type: 'success' });
                await fetchCoupons();
                await fetchStatistics();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message || 'Error al eliminar cupón', type: 'error' });
            }
        });
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/coupons/export?format=json&token=${token}`));
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allCoupons = await response.json();
            
            const dataToExport = allCoupons.map(coupon => ({
                ID: coupon.id,
                Codigo: coupon.code,
                Tipo: coupon.type === 'percent' ? 'Porcentaje' : 'Monto Fijo',
                Descuento: coupon.discount,
                Min_Compra: coupon.minPurchase || 0,
                Expira: coupon.expiresAt || 'Nunca',
                Estado: coupon.status,
                Usos: coupon.uses || 0,
                Max_Usos: coupon.maxUses || 'Ilimitado'
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Cupones');
            XLSX.writeFile(wb, `cupones_lbdc_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar cupones', type: 'error' });
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        showAlert({ title: 'Copiado', message: `Código "${code}" copiado al portapapeles`, type: 'success' });
    };

    const getStatusBadge = (status) => {
        const config = COUPON_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`${config.color} px-2 py-1 rounded-md text-xs font-bold uppercase`}>
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const config = COUPON_TYPE_CONFIG[type] || { label: type, color: 'text-gray-600' };
        return (
            <span className={`${config.color} text-sm font-medium`}>
                {config.label}
            </span>
        );
    };

    const getDiscountDisplay = (coupon) => {
        if (coupon.type === 'percent') {
            return `${coupon.discount}%`;
        }
        return formatPrice(coupon.discount);
    };

    const isExpiringSoon = (expiresAt) => {
        if (!expiresAt) return false;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    const isExpired = (expiresAt) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    // Client-side search filtering
    const filteredCoupons = useMemo(() => {
        if (!searchTerm) return coupons;
        return coupons.filter(coupon =>
            coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [coupons, searchTerm]);

    if (loading && !statistics) {
        return (
            <AdminLayout title="Cupones">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Cupones de Descuento">
            <div className="space-y-8 animate-fade-in-up">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Gestión de cupones de descuento y códigos promocionales.</p>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar Excel
                        </Button>
                        <Button onClick={() => handleOpenForm()} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nuevo Cupón
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Cupones */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Cupones</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.summary?.totalCoupons || coupons.length}</h3>
                            </div>
                            <Tag className="w-8 h-8 text-purple-200" />
                        </div>
                        <div className="mt-4 flex items-center text-purple-100 text-sm">
                            <span>Códigos creados</span>
                        </div>
                    </div>

                    {/* Cupones Activos */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Activos</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.summary?.activeCoupons || coupons.filter(c => c.status === 'active').length}</h3>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-200" />
                        </div>
                        <div className="mt-4 flex items-center text-green-100 text-sm">
                            <span>Listos para usar</span>
                        </div>
                    </div>

                    {/* Total Usos */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Usos</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.summary?.totalUses || coupons.reduce((sum, c) => sum + (c.uses || 0), 0)}</h3>
                            </div>
                            <Users className="w-8 h-8 text-blue-200" />
                        </div>
                        <div className="mt-4 flex items-center text-blue-100 text-sm">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>Usos acumulados</span>
                        </div>
                    </div>

                    {/* Próximos a Expirar */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Por Expirar</p>
                                <h3 className="text-3xl font-bold mt-2">{statistics?.expiringSoon?.length || coupons.filter(c => isExpiringSoon(c.expiresAt)).length}</h3>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-orange-200" />
                        </div>
                        <div className="mt-4 flex items-center text-orange-100 text-sm">
                            <span>Próximos 7 días</span>
                        </div>
                    </div>
                </div>

                {/* Top Performing Coupons */}
                {statistics?.topCoupons && statistics.topCoupons.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            Cupones Más Utilizados
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {statistics.topCoupons.slice(0, 3).map((coupon, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono font-bold text-gray-800">{coupon.code}</p>
                                            <p className="text-sm text-gray-500">
                                                {coupon.type === 'percent' ? `${coupon.discount}%` : formatPrice(coupon.discount)} de descuento
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-purple-600">{coupon.uses}</p>
                                            <p className="text-xs text-gray-500">usos</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expiring Soon Alerts */}
                {statistics?.expiringSoon && statistics.expiringSoon.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-orange-800">Cupones por expirar pronto</h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    {statistics.expiringSoon.length} cupón(es) expiran en los próximos 7 días:
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {statistics.expiringSoon.map((coupon, idx) => (
                                        <span key={idx} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-mono">
                                            {coupon.code} - {Math.ceil(coupon.daysUntilExpiry)}d
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por código o descripción..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {statusOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        
                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {typeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        
                        {/* Search Button */}
                        <Button onClick={handleSearch} variant="outline" className="flex items-center justify-center gap-2">
                            <Filter className="w-4 h-4" /> Filtrar
                        </Button>
                    </div>
                </div>

                {/* Coupons Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Código</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Descuento</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Tipo</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Usos</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Compra Mín.</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Expiración</th>
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Estado</th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-gray-800">{coupon.code}</span>
                                                <button
                                                    onClick={() => handleCopyCode(coupon.code)}
                                                    className="text-gray-400 hover:text-purple-600 transition-colors"
                                                    title="Copiar código"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {coupon.description && (
                                                <p className="text-xs text-gray-500 mt-1 max-w-xs truncate">{coupon.description}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-semibold text-gray-800">{getDiscountDisplay(coupon)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            {getTypeBadge(coupon.type)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium">{coupon.uses || 0}</span>
                                                {coupon.maxUses && (
                                                    <span className="text-gray-400 text-sm">/ {coupon.maxUses}</span>
                                                )}
                                            </div>
                                            {coupon.maxUses && (
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div 
                                                        className="bg-purple-600 h-1.5 rounded-full" 
                                                        style={{ width: `${Math.min(100, ((coupon.uses || 0) / coupon.maxUses) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {coupon.minPurchase > 0 ? (
                                                <span className="text-gray-600">{formatPrice(coupon.minPurchase)}</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sin mínimo</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {coupon.expiresAt ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className={`text-sm ${isExpired(coupon.expiresAt) ? 'text-red-600' : isExpiringSoon(coupon.expiresAt) ? 'text-orange-600' : 'text-gray-600'}`}>
                                                        {new Date(coupon.expiresAt).toLocaleDateString('es-ES')}
                                                    </span>
                                                    {isExpiringSoon(coupon.expiresAt) && !isExpired(coupon.expiresAt) && (
                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Sin expiración</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(coupon.status)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setShowDetail(coupon)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenForm(coupon)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(coupon)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        coupon.status === 'active' 
                                                            ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50' 
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={coupon.status === 'active' ? 'Pausar' : 'Activar'}
                                                >
                                                    {coupon.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
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
                    
                    {/* Empty State */}
                    {filteredCoupons.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600">No se encontraron cupones</h3>
                            <p className="text-gray-400 mt-1">Crea tu primer cupón para comenzar</p>
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} cupones
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded text-sm ${
                                            currentPage === page 
                                                ? 'bg-purple-600 text-white' 
                                                : 'border border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
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
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
                            </h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código del Cupón <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="Ej: VERANO2024"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                                    disabled={!!editingCoupon}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Discount Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Descuento <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="percent">Porcentaje (%)</option>
                                        <option value="fixed">Monto Fijo ($)</option>
                                    </select>
                                </div>
                                
                                {/* Discount Value */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Valor <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                            {formData.type === 'percent' ? '%' : '$'}
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step={formData.type === 'percent' ? '1' : '0.01'}
                                            max={formData.type === 'percent' ? '100' : undefined}
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                            placeholder="0"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Expiration Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de Expiración
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                
                                {/* Minimum Purchase */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compra Mínima
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.minPurchase}
                                            onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Max Uses */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Máximo de Usos
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.maxUses}
                                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                    placeholder="Ilimitado"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Dejar vacío para usos ilimitados</p>
                            </div>
                            
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción del cupón..."
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : editingCoupon ? 'Actualizar Cupón' : 'Crear Cupón'}
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
                            <h2 className="text-xl font-bold text-gray-800">Detalle del Cupón</h2>
                            <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-purple-50 rounded-xl p-6 text-center">
                                <p className="text-sm text-purple-600 font-medium mb-2">Código del Cupón</p>
                                <p className="text-3xl font-mono font-bold text-purple-700">{showDetail.code}</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <button
                                        onClick={() => handleCopyCode(showDetail.code)}
                                        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                                    >
                                        <Copy className="w-4 h-4" /> Copiar código
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Descuento</p>
                                    <p className="text-xl font-bold text-gray-800">{getDiscountDisplay(showDetail)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Estado</p>
                                    <div className="mt-1">{getStatusBadge(showDetail.status)}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Usos</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {showDetail.uses || 0}
                                        {showDetail.maxUses && <span className="text-sm text-gray-500"> / {showDetail.maxUses}</span>}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Tipo</p>
                                    <p className="text-xl font-bold text-gray-800">{showDetail.type === 'percent' ? 'Porcentaje' : 'Fijo'}</p>
                                </div>
                            </div>
                            
                            {showDetail.expiresAt && (
                                <div className={`rounded-lg p-4 ${isExpired(showDetail.expiresAt) ? 'bg-red-50' : isExpiringSoon(showDetail.expiresAt) ? 'bg-orange-50' : 'bg-green-50'}`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar className={`w-5 h-5 ${isExpired(showDetail.expiresAt) ? 'text-red-600' : isExpiringSoon(showDetail.expiresAt) ? 'text-orange-600' : 'text-green-600'}`} />
                                        <div>
                                            <p className={`text-sm font-medium ${isExpired(showDetail.expiresAt) ? 'text-red-800' : isExpiringSoon(showDetail.expiresAt) ? 'text-orange-800' : 'text-green-800'}`}>
                                                {isExpired(showDetail.expiresAt) ? 'Expirado' : 'Expira el'} {new Date(showDetail.expiresAt).toLocaleDateString('es-ES')}
                                            </p>
                                            {isExpiringSoon(showDetail.expiresAt) && !isExpired(showDetail.expiresAt) && (
                                                <p className="text-xs text-orange-600">¡Próximamente!</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {showDetail.minPurchase > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Compra mínima:</span>
                                    <span className="font-medium">{formatPrice(showDetail.minPurchase)}</span>
                                </div>
                            )}
                            
                            {showDetail.description && (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 mb-1">Descripción</p>
                                    <p className="text-gray-700">{showDetail.description}</p>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Creado: {showDetail.createdAt ? new Date(showDetail.createdAt).toLocaleString('es-ES') : 'N/A'}</p>
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

export default AdminCoupons;
