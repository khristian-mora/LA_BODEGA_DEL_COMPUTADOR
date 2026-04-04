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
    Calendar, User, Tag, ArrowRight, Info, Activity, ChevronLeft, ChevronRight, ShieldCheck, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import { buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import PortalWrapper from '../../components/PortalWrapper';
import { useShop } from '../../context/ShopContext';
import * as XLSX from 'xlsx';

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
    const [filterReasonType, _setFilterReasonType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, _setDateRange] = useState({ start: '', end: '' });

    // Form states
    const [formData, setFormData] = useState({
        orderId: '', customerId: '', reason: '', reasonType: '', items: '', quantity: 1, condition: 'unopened', notes: ''
    });

    const [resolutionData, setResolutionData] = useState({
        resolution: 'refund', refundAmount: '', exchangeProductId: '', notes: ''
    });

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [currentPage, filterStatus, filterReasonType, dateRange, searchTerm]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);
            if (filterStatus) params.append('status', filterStatus);
            if (filterReasonType) params.append('reasonType', filterReasonType);
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);
            if (searchTerm) params.append('search', searchTerm);

            const [returnsRes, ordersRes, customersRes] = await Promise.all([
                fetch(buildApiUrl(`/api/returns?${params.toString()}`), { headers }),
                fetch(buildApiUrl('/api/orders'), { headers }),
                fetch(buildApiUrl('/api/customers'), { headers })
            ]);

            if (returnsRes.ok) {
                const returnsData = await returnsRes.json();
                setReturns(returnsData.returns || returnsData.data || []);
                setTotalPages(returnsData.totalPages || 1);
                setTotalReturns(returnsData.total || 0);
            }

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData.orders || ordersData.data || []);
            }
            if (customersRes.ok) {
                const customersData = await customersRes.json();
                setCustomers(customersData.customers || customersData.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStatus, filterReasonType, dateRange, itemsPerPage, searchTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { ...formData, quantity: Number(formData.quantity) || 1 };
            if (editingReturn) {
                await returnsService.updateReturn(editingReturn.id, data);
                showAlert({ title: 'RMA Actualizada', message: 'Registro de devolución modificado', type: 'success' });
            } else {
                await returnsService.createReturn(data);
                showAlert({ title: 'RMA Iniciada', message: 'Nueva solicitud de devolución registrada', type: 'success' });
            }
            setShowForm(false);
            setEditingReturn(null);
            resetForm();
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error RMA', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
            showAlert({ title: 'Caso Cerrado', message: 'Resolución procesada y registrada exitosamente', type: 'success' });
            setShowResolutionForm(false);
            setSelectedReturn(null);
            setResolutionData({ resolution: 'refund', refundAmount: '', exchangeProductId: '', notes: '' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error de Resolución', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus, message) => {
        const confirmed = await showConfirm({
            title: 'Actualizar RMA',
            message: `¿Confirmar transición de estado a: ${RETURN_STATUS_CONFIG[newStatus]?.label}?`,
            variant: 'info'
        });
        if (!confirmed) return;
        try {
            await returnsService.updateStatus(id, newStatus);
            showAlert({ title: 'Estado Sincronizado', message: message || 'Flujo de RMA actualizado', type: 'success' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Fallo de Transición', message: error.message, type: 'error' });
        }
    };

    const handleDelete = async (returnId) => {
        const confirmed = await showConfirm({
            title: 'Eliminar Registro RMA',
            message: 'Esta acción purgará el registro de devolución permanentemente.',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await returnsService.deleteReturn(returnId);
            showAlert({ title: 'Registro Purgado', message: 'Devolución eliminada del historial', type: 'success' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error de Purga', message: error.message, type: 'error' });
        }
    };

    const handleExportExcel = async () => {
        try {
            const allReturns = await returnsService.exportReturns({
                status: filterStatus || null,
                startDate: dateRange.start || null,
                endDate: dateRange.end || null,
                format: 'json'
            });

            if (!allReturns || allReturns.length === 0) {
                showAlert({ title: 'Sin Datos', message: 'No hay devoluciones para exportar con los filtros actuales', type: 'info' });
                return;
            }

            const exportData = allReturns.map(rma => ({
                'ID RMA': rma.id,
                'Código RMA': rma.rmaCode || 'N/A',
                'Orden #': rma.orderId,
                'Cliente': rma.customerNameFull || rma.customerName,
                'Email': rma.customerEmail || '',
                'Producto': rma.product || rma.items,
                'Cantidad': rma.quantity || 1,
                'Motivo': rma.reason,
                'Categoría': rma.reasonCategory || rma.reasonType,
                'Estado': RETURN_STATUS_CONFIG[rma.status]?.label || rma.status,
                'Monto Reembolso': rma.refundAmount || 0,
                'Fecha Creación': new Date(rma.createdAt).toLocaleString(),
                'Fecha Resolución': rma.resolvedAt ? new Date(rma.resolvedAt).toLocaleString() : 'Pendiente',
                'Notas': rma.notes || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Devoluciones');

            const wscols = [
                { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 30 }, 
                { wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 40 }, 
                { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, 
                { wch: 20 }, { wch: 40 }
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Reporte_Devoluciones_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            showAlert({ title: 'Error Exportación', message: 'No se pudo generar el archivo Excel', type: 'error' });
        }
    };

    const resetForm = () => {
        setFormData({ orderId: '', customerId: '', reason: '', reasonType: '', items: '', quantity: 1, condition: 'unopened', notes: '' });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-200';
            case 'approved': return 'bg-blue-500/10 text-blue-600 border-blue-200';
            case 'received': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
            case 'refunded':
            case 'exchanged': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
            case 'rejected': return 'bg-red-500/10 text-red-600 border-red-200';
            default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
        }
    };

    const stats = useMemo(() => {
        const pending = returns.filter(r => r.status === 'pending').length;
        const processed = returns.filter(r => ['refunded', 'exchanged', 'rejected'].includes(r.status)).length;
        const totalRefunded = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
        return { pending, processed, totalRefunded };
    }, [returns]);

    return (
        <AdminLayout title="Centro de Retornos (RMA)">
            <div className="space-y-6 pb-12">
                
                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 transition-transform group-hover:scale-110">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Acción Requerida</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.pending}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">RMAs Pendientes</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Tasa de Cierre</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.processed}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Casos Resueltos</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                        className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform">
                            <RotateCcw className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl text-white">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Impacto Financiero</span>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h4 className="text-3xl font-black text-white tracking-tighter">{formatPrice(stats.totalRefunded)}</h4>
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Liquidez Retornada</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:scale-110">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Carga de Red</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{totalReturns}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Solicitudes Totales</p>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden">
                    {/* Industrial Toolbar */}
                    <div className="p-10 border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-center bg-gray-50/10 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 group transition-all hover:scale-105">
                                <RotateCcw className="w-8 h-8 text-white group-hover:rotate-[120deg] transition-transform duration-700" />
                            </div>
                            <div>
                                <h3 className="font-black text-3xl text-slate-900 tracking-tight leading-none mb-2">Monitor RMA & Logística Inversa</h3>
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Flujo Operativo de Garantías y Retornos</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="ID, Cliente o Motivo de RMA..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-medium transition-all focus:ring-[6px] focus:ring-slate-50 focus:border-slate-300 outline-none placeholder:text-slate-400"
                                />
                            </div>
                            
                            <select 
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                className="px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all outline-none appearance-none focus:ring-[6px] focus:ring-slate-50 min-w-[220px] cursor-pointer"
                            >
                                <option value="">TODOS LOS ESTADOS</option>
                                {Object.entries(RETURN_STATUS_CONFIG).map(([val, cfg]) => <option key={val} value={val}>{cfg.label.toUpperCase()}</option>)}
                            </select>

                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleExportExcel}
                                className="h-14 flex-1 lg:flex-none bg-emerald-500 text-white rounded-[1.5rem] shadow-2xl shadow-emerald-100 hover:bg-emerald-600 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 px-8 transition-colors"
                            >
                                <Download className="w-5 h-5" /> Exportar Excel
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => { setEditingReturn(null); resetForm(); setShowForm(true); }}
                                className="h-14 flex-1 lg:flex-none bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 px-8 transition-colors"
                            >
                                <Plus className="w-5 h-5" /> Nueva RMA
                            </motion.button>
                        </div>
                    </div>

                    {/* Industrial Ledger Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-gray-100/50">
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Identificador</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Titular / Orden</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Motivo / RMA</th>
                                    <th className="px-10 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-10 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="py-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-12 h-12 border-[4px] border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando Mallas de RMA...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : returns.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-32 text-center opacity-20">
                                                <RotateCcw className="w-20 h-20 mx-auto mb-6 text-slate-400" />
                                                <p className="text-xs font-black uppercase tracking-[0.3em]">No se han detectado solicitudes de retorno en el perímetro</p>
                                            </td>
                                        </tr>
                                    ) : returns.map((rma, idx) => (
                                        <motion.tr 
                                            key={rma.id}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                                                        #{rma.id}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Expedido</span>
                                                        <span className="block text-sm font-bold text-slate-800 tracking-tight italic">{new Date(rma.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{rma.customerName}</p>
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                        Orden <span className="underline italic">#{rma.orderId}</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 max-w-sm">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-700 leading-tight line-clamp-1 italic">"{rma.reason}"</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Tag className="w-3 h-3" /> {rma.reasonType}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={`w-fit px-4 py-1.5 rounded-xl border-2 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${getStatusStyle(rma.status)}`}>
                                                    {RETURN_STATUS_CONFIG[rma.status]?.label}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                        onClick={() => { setDetailReturn(rma); setShowDetailModal(true); }}
                                                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </motion.button>
                                                    
                                                    {/* Workflows based on status */}
                                                    {rma.status === 'pending' && (
                                                        <>
                                                            <motion.button 
                                                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleStatusUpdate(rma.id, 'approved', 'Solicitud autorizada por administración')}
                                                                className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-sm"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </motion.button>
                                                            <motion.button 
                                                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleStatusUpdate(rma.id, 'rejected', 'Solicitud denegada')}
                                                                className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white shadow-sm"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </motion.button>
                                                        </>
                                                    )}

                                                    {rma.status === 'approved' && (
                                                        <motion.button 
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleStatusUpdate(rma.id, 'received', 'Equipo ingresado a laboratorio')}
                                                            className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm"
                                                        >
                                                            <Package className="w-4 h-4" />
                                                        </motion.button>
                                                    )}

                                                    {rma.status === 'received' && (
                                                        <motion.button 
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            onClick={() => { setSelectedReturn(rma); setShowResolutionForm(true); }}
                                                            className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg"
                                                        >
                                                            <DollarSign className="w-4 h-4" />
                                                        </motion.button>
                                                    )}

                                                    <motion.button 
                                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDelete(rma.id)}
                                                        className="w-10 h-10 bg-white border border-red-100 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Industrial Pagination */}
                    {totalPages > 1 && (
                        <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Páginas de RMA: {currentPage} / {totalPages}</p>
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

            {/* Industrial RMA Modal Form */}
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
                                        <RotateCcw className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-3xl text-slate-900 tracking-tight mb-1">
                                            {editingReturn ? 'Revisión RMA' : 'Iniciación RMA'}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Configuración de Reversión Logística</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Vínculo de Orden *</label>
                                            <select 
                                                required 
                                                value={formData.orderId} 
                                                onChange={e => setFormData({ ...formData, orderId: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all px-8 appearance-none"
                                            >
                                                <option value="">SELECCIONAR ORDEN...</option>
                                                {(orders || []).map(o => <option key={o.id} value={o.id}>#{o.id} - {o.customerName}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Titular de Cuenta *</label>
                                            <select 
                                                required 
                                                value={formData.customerId} 
                                                onChange={e => setFormData({ ...formData, customerId: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all px-8 appearance-none"
                                            >
                                                <option value="">RECONOCER CLIENTE...</option>
                                                {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Tipo de Incidencia *</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {RETURN_REASON_TYPES.map(type => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, reasonType: type.value })}
                                                    className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${
                                                        formData.reasonType === type.value 
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Identificación de Activos *</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={formData.items} 
                                            onChange={e => setFormData({ ...formData, items: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all placeholder:text-slate-300" 
                                            placeholder="Describir equipos o componentes a retornar..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Cantidad Unitaria</label>
                                            <input 
                                                type="number" 
                                                value={formData.quantity} 
                                                onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all px-8 appearance-none" 
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Estado Físico al Arribo</label>
                                            <select 
                                                value={formData.condition} 
                                                onChange={e => setFormData({ ...formData, condition: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all px-8 appearance-none"
                                            >
                                                <option value="unopened">SELLADO / ORIGINAL</option>
                                                <option value="opened">ABIERTO / INTEGRIDAD OK</option>
                                                <option value="damaged">DAÑADO / REVISIÓN TÉCNICA</option>
                                                <option value="defective">DEFECTUOSO DE FÁBRICA</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Justificación de Retorno *</label>
                                        <textarea 
                                            required 
                                            value={formData.reason} 
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all resize-none" 
                                            rows="4" 
                                            placeholder="Detallar causa técnica o comercial del flujo inverso..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all"
                                    >
                                        Abortar RMA
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div> : (editingReturn ? 'Guardar Cambios' : 'Confirmar RMA')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>

            {/* Resolution Modal */}
            <PortalWrapper isOpen={showResolutionForm}>
                {showResolutionForm && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowResolutionForm(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative z-10 p-10"
                        >
                            <div className="flex flex-col items-center text-center gap-6 mb-10">
                                <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Resolución de RMA</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cierre Definitivo de Logística Inversa</p>
                                </div>
                            </div>

                            <form onSubmit={handleResolution} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Protocolo de Cierre *</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {RESOLUTION_TYPES.map(type => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setResolutionData({ ...resolutionData, resolution: type.value })}
                                                className={`py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all ${
                                                    resolutionData.resolution === type.value 
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl' 
                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {resolutionData.resolution === 'refund' && (
                                    <div className="space-y-3 animate-fade-in">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Monto a Liquidar *</label>
                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</div>
                                            <input 
                                                required 
                                                type="number" 
                                                value={resolutionData.refundAmount} 
                                                onChange={e => setResolutionData({ ...resolutionData, refundAmount: e.target.value })} 
                                                className="w-full pl-12 pr-8 py-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-xl font-black text-emerald-600 focus:bg-white focus:border-emerald-100 outline-none transition-all placeholder:text-slate-300" 
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Notas de Resolución</label>
                                    <textarea 
                                        value={resolutionData.notes} 
                                        onChange={e => setResolutionData({ ...resolutionData, notes: e.target.value })} 
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.75rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all resize-none italic" 
                                        rows="3" 
                                        placeholder="Declaración final de cierre de caso..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowResolutionForm(false)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sellar Caso'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>

            {/* Detail View Modal */}
            <PortalWrapper isOpen={showDetailModal && detailReturn}>
                {showDetailModal && detailReturn && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDetailModal(false)}
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
                                    <RotateCcw className="w-48 h-48" />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-6">
                                        <div className={`w-fit px-4 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(detailReturn.status)} bg-white/5 border-white/20`}>
                                            {RETURN_STATUS_CONFIG[detailReturn.status]?.label || detailReturn.status}
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black tracking-tighter leading-tight uppercase">RMA-#{detailReturn.id}</h3>
                                            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em] italic">{detailReturn.customerName} • ORDEN #{detailReturn.orderId}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDetailModal(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X className="w-6 h-6 text-white" /></button>
                                </div>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Activos en Retorno</p>
                                        <p className="font-black text-slate-900 text-xl tracking-tight">{detailReturn.items}</p>
                                        <p className="text-sm font-bold text-slate-500 italic">Unidades: {detailReturn.quantity || 1}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Identificador de Origen</p>
                                        <p className="font-black text-slate-900 text-xl tracking-tight">PEDIDO-#{detailReturn.orderId}</p>
                                        <p className="text-sm font-bold text-slate-500 italic">Fecha: {new Date(detailReturn.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <AlertTriangle className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivación del Flujo</p>
                                            <p className="font-black text-slate-900 italic line-clamp-2">"{detailReturn.reason}"</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <Box className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Físico Verificado</p>
                                            <p className="font-black text-slate-900 uppercase tracking-tighter">{detailReturn.condition || 'AUDITORÍA PENDIENTE'}</p>
                                        </div>
                                    </div>
                                    {detailReturn.refundAmount && (
                                        <div className="flex items-center gap-5 pt-4 border-t border-slate-100">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Liquidación RMA</p>
                                                <p className="font-black text-2xl text-emerald-700 tracking-tighter">{formatPrice(detailReturn.refundAmount)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDetailModal(false)}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.75rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black transition-all"
                                    >
                                        Finalizar Inspección
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>
        </AdminLayout>
    );
};

export default AdminReturns;
