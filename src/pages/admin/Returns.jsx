import React, { useEffect, useState, useMemo, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
    returnsService,
    RETURN_STATUSES,
    RETURN_STATUS_CONFIG,
    RETURN_REASON_TYPES,
    RESOLUTION_TYPES,
    STATUS_TRANSITIONS
} from '../../services/returnsService';
import {
    RotateCcw, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Clock,
    Download, Filter, Search, RefreshCw, DollarSign, Package, FileText,
    TrendingUp, TrendingDown, AlertTriangle, Eye, Send, Check, XCircle,
    Calendar, User, Tag, ArrowRight, Info
} from 'lucide-react';
import Button from '../../components/Button';
import { buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import { useShop } from '../../context/ShopContext';

const AdminReturns = () => {
    const { showConfirm, showAlert } = useModal();
    const { formatPrice } = useShop();

    // Data states
    const [returns, setReturns] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingReturn, setEditingReturn] = useState(null);
    const [showResolutionForm, setShowResolutionForm] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailReturn, setDetailReturn] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReturns, setTotalReturns] = useState(0);
    const itemsPerPage = 10;

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterReasonType, setFilterReasonType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Form states
    const [formData, setFormData] = useState({
        orderId: '',
        customerId: '',
        reason: '',
        reasonType: '',
        items: '',
        quantity: 1,
        condition: 'unopened',
        notes: ''
    });

    const [resolutionData, setResolutionData] = useState({
        resolution: 'refund',
        refundAmount: '',
        exchangeProductId: '',
        notes: ''
    });

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [currentPage, filterStatus, filterReasonType, dateRange]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Build returns URL with all filters
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);
            if (filterStatus) params.append('status', filterStatus);
            if (filterReasonType) params.append('reasonType', filterReasonType);
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);

            const [returnsRes, ordersRes, customersRes] = await Promise.all([
                fetch(buildApiUrl(`/api/returns?${params.toString()}`), { headers }),
                fetch(buildApiUrl('/api/orders'), { headers }),
                fetch(buildApiUrl('/api/customers'), { headers })
            ]);

            if (!returnsRes.ok) throw new Error('Error al cargar devoluciones');

            const returnsData = await returnsRes.json();
            if (returnsData.returns) {
                setReturns(returnsData.returns);
                setTotalPages(returnsData.totalPages || 1);
                setTotalReturns(returnsData.total || returnsData.returns.length);
            } else {
                setReturns(returnsData);
                setTotalPages(1);
                setTotalReturns(returnsData.length);
            }

            if (ordersRes.ok) setOrders(await ordersRes.json());
            if (customersRes.ok) setCustomers(await customersRes.json());
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'Error al cargar datos', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStatus, filterReasonType, dateRange, itemsPerPage, showAlert]);

    // Handle create/update submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                ...formData,
                quantity: Number(formData.quantity) || 1
            };

            if (editingReturn) {
                await returnsService.updateReturn(editingReturn.id, data);
                showAlert({ title: 'Éxito', message: 'Devolución actualizada', type: 'success' });
            } else {
                await returnsService.createReturn(data);
                showAlert({ title: 'Éxito', message: 'Devolución creada', type: 'success' });
            }

            setShowForm(false);
            setEditingReturn(null);
            resetForm();
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Handle resolution
    const handleResolution = async (e) => {
        e.preventDefault();
        if (!selectedReturn) return;

        setLoading(true);
        try {
            await returnsService.processResolution(
                selectedReturn.id,
                resolutionData.resolution,
                resolutionData.refundAmount ? Number(resolutionData.refundAmount) : null,
                resolutionData.notes
            );

            showAlert({ title: 'Éxito', message: 'Resolución procesada exitosamente', type: 'success' });
            setShowResolutionForm(false);
            setSelectedReturn(null);
            setResolutionData({ resolution: 'refund', refundAmount: '', exchangeProductId: '', notes: '' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Handle status change with confirmation
    const handleStatusChange = async (id, newStatus) => {
        showConfirm(`¿Cambiar estado a "${RETURN_STATUS_CONFIG[newStatus]?.label || newStatus}"?`, async () => {
            try {
                await returnsService.updateStatus(id, newStatus);
                showAlert({ title: 'Éxito', message: 'Estado actualizado', type: 'success' });
                fetchData();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message || 'Error al actualizar estado', type: 'error' });
            }
        });
    };

    // Handle approve
    const handleApprove = async (id) => {
        showConfirm('¿Aprobar esta devolución?', async () => {
            try {
                await returnsService.approveReturn(id);
                showAlert({ title: 'Éxito', message: 'Devolución aprobada', type: 'success' });
                fetchData();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message, type: 'error' });
            }
        });
    };

    // Handle reject
    const handleReject = async (id) => {
        showConfirm('¿Rechazar esta devolución?', async () => {
            try {
                await returnsService.rejectReturn(id);
                showAlert({ title: 'Éxito', message: 'Devolución rechazada', type: 'success' });
                fetchData();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message, type: 'error' });
            }
        });
    };

    // Handle mark as received
    const handleMarkReceived = async (id) => {
        showConfirm('¿Marcar devolución como recibida?', async () => {
            try {
                await returnsService.markAsReceived(id);
                showAlert({ title: 'Éxito', message: 'Devolución marcada como recibida', type: 'success' });
                fetchData();
            } catch (error) {
                showAlert({ title: 'Error', message: error.message, type: 'error' });
            }
        });
    };

    // Handle delete
    const handleDelete = async (returnId) => {
        const confirmed = await showConfirm({
            title: 'Confirmar eliminación',
            message: '¿Eliminar esta devolución?',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            await returnsService.deleteReturn(returnId);
            showAlert({ title: 'Eliminada', message: 'Devolución eliminada', type: 'success' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al eliminar', type: 'error' });
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (dateRange.start) params.startDate = dateRange.start;
            if (dateRange.end) params.endDate = dateRange.end;

            const csvContent = await returnsService.exportReturns(params);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `devoluciones_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            showAlert({ title: 'Éxito', message: 'Exportación completada', type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar', type: 'error' });
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            orderId: '',
            customerId: '',
            reason: '',
            reasonType: '',
            items: '',
            quantity: 1,
            condition: 'unopened',
            notes: ''
        });
    };

    // View return details
    const viewDetails = (returnItem) => {
        setDetailReturn(returnItem);
        setShowDetailModal(true);
    };

    // Status badge component
    const getStatusBadge = (status) => {
        const config = RETURN_STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold ${config.color} flex items-center gap-1 w-fit`}>
                {config.label}
            </span>
        );
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const pending = returns.filter(r => r.status === 'pending').length;
        const approved = returns.filter(r => r.status === 'approved').length;
        const received = returns.filter(r => r.status === 'received').length;
        const completed = returns.filter(r => r.status === 'refunded' || r.status === 'exchanged').length;
        const rejected = returns.filter(r => r.status === 'rejected').length;
        const totalRefunded = returns.filter(r => r.refundAmount).reduce((sum, r) => sum + (r.refundAmount || 0), 0);
        const awaitingAction = pending + approved;
        return { pending, approved, received, completed, rejected, totalRefunded, awaitingAction };
    }, [returns]);

    // Filtered returns by search
    const filteredReturns = useMemo(() => {
        if (!searchTerm) return returns;
        const term = searchTerm.toLowerCase();
        return returns.filter(r =>
            r.customerName?.toLowerCase().includes(term) ||
            r.reason?.toLowerCase().includes(term) ||
            String(r.id).includes(term) ||
            String(r.orderId).includes(term) ||
            r.items?.toLowerCase().includes(term)
        );
    }, [returns, searchTerm]);

    return (
        <AdminLayout title="Gestión de Devoluciones (RMA)">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                            <RotateCcw className="w-7 h-7 text-blue-600" />
                            Sistema de Devoluciones (RMA)
                        </h2>
                        <p className="text-gray-500 mt-1">Gestión completa de devoluciones, reembolsos y canjes</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </Button>
                        <Button onClick={() => { setEditingReturn(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nueva Devolución
                        </Button>
                    </div>
                </div>

                {/* KPI Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <p className="text-xs font-medium text-yellow-700">Pendientes</p>
                        </div>
                        <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <p className="text-xs font-medium text-blue-700">Aprobadas</p>
                        </div>
                        <p className="text-3xl font-bold text-blue-800">{stats.approved}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-purple-600" />
                            <p className="text-xs font-medium text-purple-700">Recibidas</p>
                        </div>
                        <p className="text-3xl font-bold text-purple-800">{stats.received}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <p className="text-xs font-medium text-green-700">Completadas</p>
                        </div>
                        <p className="text-3xl font-bold text-green-800">{stats.completed}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <p className="text-xs font-medium text-red-700">Rechazadas</p>
                        </div>
                        <p className="text-3xl font-bold text-red-800">{stats.rejected}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <p className="text-xs font-medium text-orange-700">Por Revisar</p>
                        </div>
                        <p className="text-3xl font-bold text-orange-800">{stats.awaitingAction}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                            <p className="text-xs font-medium text-emerald-700">Total Reembolsado</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-800">{formatPrice(stats.totalRefunded)}</p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filtros:</span>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente, pedido, motivo, items..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(RETURN_STATUS_CONFIG).map(([value, config]) => (
                                <option key={value} value={value}>{config.label}</option>
                            ))}
                        </select>

                        {/* Reason Type Filter */}
                        <select
                            value={filterReasonType}
                            onChange={e => { setFilterReasonType(e.target.value); setCurrentPage(1); }}
                            className="p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos los motivos</option>
                            {RETURN_REASON_TYPES.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                className="p-2 border border-gray-200 rounded-lg text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                className="p-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>

                        {/* Clear Filters */}
                        {(filterStatus || filterReasonType || searchTerm || dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => {
                                    setFilterStatus('');
                                    setFilterReasonType('');
                                    setSearchTerm('');
                                    setDateRange({ start: '', end: '' });
                                    setCurrentPage(1);
                                }}
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Limpiar filtros
                            </button>
                        )}

                        <span className="ml-auto text-sm text-gray-500 font-medium">
                            {totalReturns} devolución(es)
                        </span>
                    </div>
                </div>

                {/* Returns Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Devoluciones Registradas
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-12">
                                <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-2" />
                                <p className="text-gray-500">Cargando devoluciones...</p>
                            </div>
                        ) : filteredReturns.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No hay devoluciones registradas</p>
                                <Button onClick={() => { setEditingReturn(null); resetForm(); setShowForm(true); }} className="mt-4">
                                    <Plus className="w-4 h-4 mr-2" /> Crear Primera Devolución
                                </Button>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left p-4 font-bold text-gray-700">ID / Pedido</th>
                                        <th className="text-left p-4 font-bold text-gray-700">Cliente</th>
                                        <th className="text-left p-4 font-bold text-gray-700">Motivo</th>
                                        <th className="text-left p-4 font-bold text-gray-700">Items</th>
                                        <th className="text-left p-4 font-bold text-gray-700">Fecha</th>
                                        <th className="text-left p-4 font-bold text-gray-700">Estado</th>
                                        <th className="text-left p-4 font-bold text-gray-700">Reembolso</th>
                                        <th className="text-right p-4 font-bold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReturns.map((returnItem) => (
                                        <tr key={returnItem.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-gray-900">#{returnItem.id}</p>
                                                <p className="text-xs text-gray-500">Pedido: #{returnItem.orderId}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{returnItem.customerName}</p>
                                                        {returnItem.customerEmail && (
                                                            <p className="text-xs text-gray-500">{returnItem.customerEmail}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                <p className="truncate text-gray-600 font-medium" title={returnItem.reason}>
                                                    {returnItem.reason}
                                                </p>
                                                {returnItem.reasonType && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                        <Tag className="w-3 h-3" />
                                                        {RETURN_REASON_TYPES.find(r => r.value === returnItem.reasonType)?.label || returnItem.reasonType}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-gray-700">{returnItem.items || '-'}</p>
                                                {returnItem.quantity && (
                                                    <p className="text-xs text-gray-500">Cant: {returnItem.quantity}</p>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-500">
                                                {new Date(returnItem.createdAt || returnItem.date).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4">{getStatusBadge(returnItem.status)}</td>
                                            <td className="p-4">
                                                {returnItem.refundAmount ? (
                                                    <span className="font-mono text-green-600 font-bold">
                                                        {formatPrice(returnItem.refundAmount)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    {/* View Details */}
                                                    <button
                                                        onClick={() => viewDetails(returnItem)}
                                                        className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Ver Detalles"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {/* Quick Approve (for pending) */}
                                                    {returnItem.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleApprove(returnItem.id)}
                                                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Quick Reject (for pending) */}
                                                    {returnItem.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleReject(returnItem.id)}
                                                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Mark as Received (for approved) */}
                                                    {returnItem.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleMarkReceived(returnItem.id)}
                                                            className="text-purple-600 hover:text-purple-800 p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Marcar como Recibida"
                                                        >
                                                            <Package className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Process Resolution (for received) */}
                                                    {returnItem.status === 'received' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedReturn(returnItem);
                                                                setResolutionData({ ...resolutionData, refundAmount: returnItem.refundAmount || '' });
                                                                setShowResolutionForm(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Procesar Resolución"
                                                        >
                                                            <DollarSign className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Status Dropdown */}
                                                    {STATUS_TRANSITIONS[returnItem.status]?.length > 0 && (
                                                        <div className="relative group">
                                                            <button
                                                                className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Cambiar Estado"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 hidden group-hover:block z-20 min-w-[150px]">
                                                                <p className="text-xs text-gray-400 mb-2 px-2">Cambiar a:</p>
                                                                {STATUS_TRANSITIONS[returnItem.status].map(status => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => handleStatusChange(returnItem.id, status)}
                                                                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                                                                    >
                                                                        {RETURN_STATUS_CONFIG[status]?.label || status}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => {
                                                            setEditingReturn(returnItem);
                                                            setFormData({
                                                                orderId: returnItem.orderId || '',
                                                                customerId: returnItem.customerId || '',
                                                                reason: returnItem.reason || '',
                                                                reasonType: returnItem.reasonType || '',
                                                                items: returnItem.items || '',
                                                                quantity: returnItem.quantity || 1,
                                                                condition: returnItem.condition || 'unopened',
                                                                notes: returnItem.notes || ''
                                                            });
                                                            setShowForm(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(returnItem.id)}
                                                        className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
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
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-sm text-gray-500">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalReturns)} de {totalReturns} devoluciones
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
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
                                            className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                                                currentPage === page
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Create/Edit Return Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-blue-600" />
                                {editingReturn ? 'Editar Devolución' : 'Nueva Devolución'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingReturn(null); resetForm(); }} className="text-gray-400 hover:text-black transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Order Selection */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            <Tag className="w-4 h-4 inline mr-1" /> Pedido *
                                        </label>
                                        <select
                                            required
                                            value={formData.orderId}
                                            onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccionar pedido</option>
                                            {orders.map(o => (
                                                <option key={o.id} value={o.id}>
                                                    #{o.id} - {o.customerName} - {formatPrice(o.total)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Customer Selection */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            <User className="w-4 h-4 inline mr-1" /> Cliente *
                                        </label>
                                        <select
                                            required
                                            value={formData.customerId}
                                            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccionar cliente</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Reason Type */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            <Tag className="w-4 h-4 inline mr-1" /> Tipo de Motivo
                                        </label>
                                        <select
                                            value={formData.reasonType}
                                            onChange={e => setFormData({ ...formData, reasonType: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccionar motivo</option>
                                            {RETURN_REASON_TYPES.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.quantity}
                                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Items */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Items a Devolver</label>
                                        <input
                                            value={formData.items}
                                            onChange={e => setFormData({ ...formData, items: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: Laptop Dell XPS 13, Cargador original"
                                        />
                                    </div>

                                    {/* Condition */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Condición del Producto</label>
                                        <select
                                            value={formData.condition}
                                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="unopened">Sin abrir</option>
                                            <option value="like_new">Como nuevo</option>
                                            <option value="good">Buen estado</option>
                                            <option value="damaged">Dañado</option>
                                            <option value="defective">Defectuoso</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Motivo Detallado *</label>
                                    <textarea
                                        required
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Describe el motivo de la devolución..."
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Notas Internas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows="2"
                                        placeholder="Notas para el equipo interno..."
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingReturn(null); resetForm(); }}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading ? 'Guardando...' : (editingReturn ? 'Actualizar Devolución' : 'Crear Devolución')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolution Modal */}
            {showResolutionForm && selectedReturn && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-purple-600" />
                                Procesar Resolución
                            </h3>
                            <button onClick={() => { setShowResolutionForm(false); setSelectedReturn(null); }} className="text-gray-400 hover:text-black transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleResolution} className="p-6 space-y-4">
                            {/* Return Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Info className="w-4 h-4" /> Devolución #{selectedReturn.id}
                                </p>
                                <p className="font-bold text-gray-900">{selectedReturn.customerName}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedReturn.reason}</p>
                            </div>

                            {/* Resolution Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Resolución *</label>
                                <select
                                    required
                                    value={resolutionData.resolution}
                                    onChange={e => setResolutionData({ ...resolutionData, resolution: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    {RESOLUTION_TYPES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Refund Amount (for refunds) */}
                            {(resolutionData.resolution === 'refund' || resolutionData.resolution === 'partial_refund') && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Monto a Reembolsar (COP) {resolutionData.resolution === 'partial_refund' ? '*' : ''}
                                    </label>
                                    <input
                                        type="number"
                                        required={resolutionData.resolution === 'partial_refund'}
                                        value={resolutionData.refundAmount}
                                        onChange={e => setResolutionData({ ...resolutionData, refundAmount: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="0"
                                    />
                                </div>
                            )}

                            {/* Resolution Notes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notas de Resolución</label>
                                <textarea
                                    value={resolutionData.notes}
                                    onChange={e => setResolutionData({ ...resolutionData, notes: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    rows="3"
                                    placeholder="Detalles adicionales de la resolución..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => { setShowResolutionForm(false); setSelectedReturn(null); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Procesando...' : 'Procesar Resolución'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && detailReturn && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Eye className="w-5 h-5 text-gray-600" />
                                Detalle de Devolución #{detailReturn.id}
                            </h3>
                            <button onClick={() => { setShowDetailModal(false); setDetailReturn(null); }} className="text-gray-400 hover:text-black transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center gap-4">
                                {getStatusBadge(detailReturn.status)}
                                <span className="text-sm text-gray-500">
                                    {new Date(detailReturn.createdAt || detailReturn.date).toLocaleDateString('es-CO', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Cliente</p>
                                    <p className="font-bold text-gray-900">{detailReturn.customerName}</p>
                                    {detailReturn.customerEmail && (
                                        <p className="text-sm text-gray-600">{detailReturn.customerEmail}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Pedido Relacionado</p>
                                    <p className="font-bold text-gray-900">#{detailReturn.orderId}</p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Motivo de Devolución</p>
                                <p className="font-medium text-gray-900">{detailReturn.reason}</p>
                                {detailReturn.reasonType && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        <Tag className="w-3 h-3" />
                                        {RETURN_REASON_TYPES.find(r => r.value === detailReturn.reasonType)?.label || detailReturn.reasonType}
                                    </span>
                                )}
                            </div>

                            {/* Items & Condition */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Items</p>
                                    <p className="font-medium text-gray-900">{detailReturn.items || '-'}</p>
                                    {detailReturn.quantity && (
                                        <p className="text-sm text-gray-600">Cantidad: {detailReturn.quantity}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Condición</p>
                                    <p className="font-medium text-gray-900 capitalize">{detailReturn.condition || '-'}</p>
                                </div>
                            </div>

                            {/* Resolution Info */}
                            {detailReturn.resolution && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-700 mb-1">Resolución</p>
                                    <p className="font-bold text-green-900">
                                        {RESOLUTION_TYPES.find(r => r.value === detailReturn.resolution)?.label || detailReturn.resolution}
                                    </p>
                                    {detailReturn.refundAmount && (
                                        <p className="text-lg font-bold text-green-700 mt-1">
                                            {formatPrice(detailReturn.refundAmount)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            {detailReturn.notes && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Notas</p>
                                    <p className="text-gray-700">{detailReturn.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                            {detailReturn.status === 'pending' && (
                                <>
                                    <Button onClick={() => { handleApprove(detailReturn.id); setShowDetailModal(false); }} className="bg-green-600 hover:bg-green-700">
                                        <Check className="w-4 h-4 mr-1" /> Aprobar
                                    </Button>
                                    <Button onClick={() => { handleReject(detailReturn.id); setShowDetailModal(false); }} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                                    </Button>
                                </>
                            )}
                            {detailReturn.status === 'approved' && (
                                <Button onClick={() => { handleMarkReceived(detailReturn.id); setShowDetailModal(false); }} className="bg-purple-600 hover:bg-purple-700">
                                    <Package className="w-4 h-4 mr-1" /> Marcar Recibida
                                </Button>
                            )}
                            {detailReturn.status === 'received' && (
                                <Button onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedReturn(detailReturn);
                                    setResolutionData({ ...resolutionData, refundAmount: detailReturn.refundAmount || '' });
                                    setShowResolutionForm(true);
                                }} className="bg-blue-600 hover:bg-blue-700">
                                    <DollarSign className="w-4 h-4 mr-1" /> Procesar Resolución
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => { setShowDetailModal(false); setDetailReturn(null); }}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
};

export default AdminReturns;
