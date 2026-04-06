import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    Shield, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Clock, 
    Download, Filter, Search, FileText, AlertTriangle, Eye, 
    TrendingUp, Calendar, ChevronLeft, ChevronRight, Activity, 
    ShieldCheck, ShieldAlert, ShieldOff, ClipboardList, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/Button';
import { buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import PortalWrapper from '../../components/PortalWrapper';
import * as XLSX from 'xlsx';

const AdminWarranties = () => {
    const { showConfirm, showAlert } = useModal();
    
    // Data States
    const [warranties, setWarranties] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [showForm, setShowForm] = useState(false);
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [editingWarranty, setEditingWarranty] = useState(null);
    const [selectedWarranty, setSelectedWarranty] = useState(null);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userRole = user.role || 'técnico';
    const isAdmin = userRole === 'admin';
    const isVendedor = userRole === 'vendedor';
    const canModify = isAdmin || isVendedor;

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalWarranties, setTotalWarranties] = useState(0);
    const itemsPerPage = 10;

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpiring, _setFilterExpiring] = useState(false);

    const [formData, setFormData] = useState({
        ticketId: '', customerId: '', productId: '', startDate: '', endDate: '', terms: '', status: 'Active'
    });

    const [claimData, setClaimData] = useState({
        description: '', priority: 'medium', resolution: ''
    });

    const statuses = [
        { value: '', label: 'Todos' },
        { value: 'Active', label: 'Activa', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-200', icon: ShieldCheck },
        { value: 'Expired', label: 'Expirada', color: 'text-red-500 bg-red-500/10 border-red-200', icon: ShieldOff },
        { value: 'Claimed', label: 'Reclamada', color: 'text-amber-500 bg-amber-500/10 border-amber-200', icon: Clock }
    ];

    const claimPriorities = [
        { value: 'low', label: 'Baja', color: 'bg-slate-100 text-slate-500' },
        { value: 'medium', label: 'Media', color: 'bg-indigo-100 text-indigo-700' },
        { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
        { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-700' }
    ];

    useEffect(() => {
        fetchData();
    }, [currentPage, filterStatus, filterExpiring, searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            let warrantyUrl = buildApiUrl('/api/warranties');
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);
            if (filterStatus) params.append('status', filterStatus);
            if (filterExpiring) params.append('expiringSoon', 'true');
            if (searchTerm) params.append('search', searchTerm);
            warrantyUrl += `?${params.toString()}`;

            const [warrantiesRes, customersRes, ticketsRes] = await Promise.all([
                fetch(warrantyUrl, { headers }),
                fetch(buildApiUrl('/api/customers'), { headers }),
                fetch(buildApiUrl('/api/tickets'), { headers })
            ]);

            if (!warrantiesRes.ok || !customersRes.ok || !ticketsRes.ok) throw new Error('Failed to synchronize repository tokens');

            const warrantiesData = await warrantiesRes.json();
            if (warrantiesData.warranties) {
                setWarranties(warrantiesData.warranties);
                setTotalPages(warrantiesData.totalPages || 1);
                setTotalWarranties(warrantiesData.total || warrantiesData.warranties.length);
            } else {
                setWarranties(warrantiesData);
                setTotalPages(1);
                setTotalWarranties(warrantiesData.length);
            }

            const customersData = await customersRes.json();
            const ticketsData = await ticketsRes.json();
            setCustomers(Array.isArray(customersData) ? customersData : (customersData.customers || []));
            setTickets(Array.isArray(ticketsData) ? ticketsData : (ticketsData.tickets || []));
        } catch (error) {
            showAlert({ title: 'System Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/warranties/export?format=json&token=${token}`));
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allWarranties = await response.json();
            
            const dataToExport = allWarranties.map(w => ({
                ID: w.id,
                Cliente: w.customerName || 'N/A',
                Dispositivo: `${w.brand || ''} ${w.model || ''}`,
                Serial: w.serial || '',
                Inicio: w.startDate,
                Fin: w.endDate,
                Estado: w.status,
                Tipo: w.warrantyType || 'Estandar'
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Garantías');
            XLSX.writeFile(wb, `LBDC_WARRANTIES_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar garantías', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.customerId) {
            showAlert({ title: 'Error', message: 'Debes seleccionar un cliente', type: 'error' });
            return;
        }
        
        if (!formData.startDate) {
            showAlert({ title: 'Error', message: 'Debes seleccionar fecha de inicio', type: 'error' });
            return;
        }
        
        if (!formData.endDate) {
            showAlert({ title: 'Error', message: 'Debes seleccionar fecha de fin', type: 'error' });
            return;
        }
        
        setLoading(true);
        try {
            const url = editingWarranty ? buildApiUrl(`/api/warranties/${editingWarranty.id}`) : buildApiUrl('/api/warranties');
            const method = editingWarranty ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }
            
            showAlert({ title: 'Protocol Success', message: editingWarranty ? 'Warranty Updated' : 'Warranty Registered', type: 'success' });
            setShowForm(false);
            setEditingWarranty(null);
            resetForm();
            fetchData();
        } catch (error) {
            showAlert({ title: 'Access Denied', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        if (!selectedWarranty) return;
        setLoading(true);
        try {
            const response = await fetch(buildApiUrl(`/api/warranties/${selectedWarranty.id}/claim`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: JSON.stringify(claimData)
            });
            if (!response.ok) throw new Error('Claim registration failed');
            showAlert({ title: 'Claim Confirmed', message: 'The warranty claim has been logs successfully', type: 'success' });
            setShowClaimForm(false);
            setSelectedWarranty(null);
            setClaimData({ description: '', priority: 'medium', resolution: '' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (warrantyId) => {
        const confirmed = await showConfirm({ title: 'Terminate Policy', message: 'Are you sure about deleting this warranty record?', variant: 'danger' });
        if (!confirmed) return;
        try {
            const response = await fetch(buildApiUrl(`/api/warranties/${warrantyId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Critical deletion error');
            showAlert({ title: 'Terminated', message: 'The policy has been purged from logs', type: 'success' });
            fetchData();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const resetForm = () => {
        setFormData({ ticketId: '', customerId: '', productId: '', startDate: '', endDate: '', terms: '', status: 'Active' });
    };

    const getStatusStyle = (status) => {
        const found = statuses.find(s => s.value === status);
        return found ? found.color : 'text-slate-500 bg-slate-500/10 border-slate-200';
    };

    const isExpiringSoon = (endDate) => {
        const daysUntilExpiry = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    const stats = useMemo(() => {
        const active = warranties.filter(w => w.status === 'Active').length;
        const expired = warranties.filter(w => w.status === 'Expired').length;
        const claimed = warranties.filter(w => w.status === 'Claimed').length;
        const expiringSoon = warranties.filter(w => isExpiringSoon(w.endDate)).length;
        return { active, expired, claimed, expiringSoon };
    }, [warranties]);

    return (
        <AdminLayout title="Protocolo de Garantías">
            <div className="space-y-6 pb-12">
                
                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Polizas Activas</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.active}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Protección Vigente</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 transition-transform group-hover:scale-110">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Vencimiento Próximo</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.expiringSoon}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Alerta de Caducidad</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:scale-110">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Reclamos Registrados</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.claimed}</h4>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Operaciones de Garantía</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform">
                            <ShieldAlert className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl text-white">
                                <ShieldOff className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Inactivas</span>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h4 className="text-4xl font-black text-white tracking-tighter">{stats.expired}</h4>
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Pólizas Caducadas</p>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden">
                    {/* Industrial Toolbar */}
                    <div className="p-10 border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-center bg-gray-50/10 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 group transition-all hover:scale-105">
                                <Shield className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
                            </div>
                            <div>
                                <h3 className="font-black text-3xl text-slate-900 tracking-tight leading-none mb-2">Pólizas de Garantía</h3>
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{totalWarranties} Expedientes Protegidos</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por cliente, dispositivo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-medium transition-all focus:ring-[6px] focus:ring-slate-50 focus:border-slate-300 outline-none placeholder:text-slate-400"
                                />
                            </div>
                            
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all outline-none appearance-none focus:ring-[6px] focus:ring-slate-50 min-w-[200px] cursor-pointer hover:bg-slate-50"
                            >
                                {statuses.map(s => <option key={s.value} value={s.value}>{s.label.toUpperCase()}</option>)}
                            </select>

                            <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleExportExcel()}
                                className="h-14 px-6 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all"
                            >
                                <Download className="w-4 h-4" /> Exportar
                            </motion.button>

                            {canModify && (
                                <motion.button 
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => { setEditingWarranty(null); resetForm(); setShowForm(true); }}
                                    className="h-14 flex-1 lg:flex-none bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-black font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 px-8 transition-colors"
                                >
                                    <Plus className="w-5 h-5" /> Nueva Póliza
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Industrial Ledger Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-50/50">
                                    <th className="p-8 border-b border-gray-100/50">Identidad Cliente</th>
                                    <th className="p-8 border-b border-gray-100/50">Activo Protegido</th>
                                    <th className="p-8 border-b border-gray-100/50">Temporalidad / Vencimiento</th>
                                    <th className="p-8 border-b border-gray-100/50">Status Operativo</th>
                                    <th className="p-8 border-b border-gray-100/50 text-right">Comandos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="p-32 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-16 h-16 border-[6px] border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Bóveda de Datos...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (warranties.length === 0) ? (
                                        <tr>
                                            <td colSpan="5" className="p-32 text-center">
                                                <div className="flex flex-col items-center gap-6 opacity-20">
                                                    <ShieldOff className="w-24 h-24 text-slate-400" />
                                                    <p className="text-xs font-black uppercase tracking-[0.3em]">No hay protocolos registrados en este segmento</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : warranties.map((warranty, idx) => {
                                        const expSoon = isExpiringSoon(warranty.endDate);
                                        return (
                                            <motion.tr 
                                                key={warranty.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className={`hover:bg-slate-50/70 transition-all group ${expSoon ? 'bg-amber-50/30' : ''}`}
                                            >
                                                <td className="p-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:border-indigo-200 transition-colors">
                                                            <div className="text-slate-900 font-black text-sm italic">{warranty.customerName?.charAt(0)}</div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-black text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors leading-none">{warranty.customerName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <Activity className="w-3 h-3 text-emerald-400" /> EXP-00{warranty.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                                                            <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{warranty.deviceType || 'Hardware Indefinido'}</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-400 uppercase italic pl-4 border-l-2 border-slate-100">Mod: {warranty.brand} {warranty.model}</p>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-4 h-4 text-slate-300" />
                                                            <span className="text-[11px] font-bold text-slate-600 uppercase italic">{new Date(warranty.startDate).toLocaleDateString()}</span>
                                                            <ArrowRight className="w-3 h-3 text-slate-300" />
                                                            <span className={`text-[11px] font-black uppercase ${expSoon ? 'text-amber-500' : 'text-slate-900'}`}>{new Date(warranty.endDate).toLocaleDateString()}</span>
                                                        </div>
                                                        {expSoon && (
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full w-fit">
                                                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter italic">Vencimiento Crítico detectado</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <div className={`w-fit px-4 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(warranty.status)}`}>
                                                        {warranty.status}
                                                    </div>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        {warranty.status === 'Active' && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => { setSelectedWarranty(warranty); setShowClaimForm(true); }}
                                                                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                                                title="Registrar Reclamo"
                                                            >
                                                                <FileText className="w-5 h-5" />
                                                            </motion.button>
                                                        )}
                                                        {canModify && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => { setEditingWarranty(warranty); setFormData({ ...warranty }); setShowForm(true); }}
                                                                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Edit2 className="w-5 h-5" />
                                                            </motion.button>
                                                        )}
                                                        {isAdmin && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleDelete(warranty.id)}
                                                                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Navegación de Protocolo: {currentPage} / {totalPages}</p>
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
                            className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                                        <Shield className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-2">
                                            {editingWarranty ? 'Actualizar Protocolo' : 'Registro de Póliza'}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hardening de Activos de Cliente</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 overflow-y-auto custom-scrollbar space-y-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Identidad Cliente *</label>
                                            <select 
                                                required 
                                                value={formData.customerId} 
                                                onChange={e => setFormData({ ...formData, customerId: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all"
                                            >
                                                <option value="">Seleccionar Titular</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Ticket Origen (Vincular)</label>
                                            <select 
                                                value={formData.ticketId} 
                                                onChange={e => setFormData({ ...formData, ticketId: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all"
                                            >
                                                <option value="">Sin Trazabilidad de Ticket</option>
                                                {tickets.map(t => <option key={t.id} value={t.id}>#{t.id} - {t.clientName}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Despliegue Cobertura *</label>
                                            <input 
                                                required 
                                                type="date" 
                                                value={formData.startDate} 
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Cierre de Póliza *</label>
                                            <input 
                                                required 
                                                type="date" 
                                                value={formData.endDate} 
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })} 
                                                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Status de Póliza</label>
                                        <select 
                                            value={formData.status} 
                                            onChange={e => setFormData({ ...formData, status: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all"
                                        >
                                            {statuses.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label.toUpperCase()}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Dictamen / Términos Operativos</label>
                                        <textarea 
                                            value={formData.terms} 
                                            onChange={e => setFormData({ ...formData, terms: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-indigo-100 outline-none transition-all resize-none" 
                                            rows="4" 
                                            placeholder="Detallar condiciones técnicas y legales de la cobertura..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all"
                                    >
                                        Abortar Registro
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingWarranty ? 'Confirmar Cambios' : 'Firmar Póliza')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>

            {/* Claim Implementation Modal */}
            <PortalWrapper isOpen={showClaimForm && selectedWarranty}>
                {showClaimForm && selectedWarranty && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowClaimForm(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-orange-50/30">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-orange-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-orange-100">
                                        <FileText className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-1">Ejecución de Reclamo</h3>
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Protocolo de Contingencia</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowClaimForm(false)} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleClaim} className="p-10 space-y-8">
                                <div className="p-6 bg-slate-900 rounded-[1.5rem] space-y-3 relative overflow-hidden">
                                    <Shield className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-5 rotate-12" />
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Poliza Vinculada:</p>
                                    <h4 className="text-xl font-black text-white tracking-tight">{selectedWarranty.customerName}</h4>
                                    <p className="text-[11px] font-bold text-white/60 uppercase">{selectedWarranty.deviceType} • ID-{selectedWarranty.id}</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Evidencia de Falla (Detallado) *</label>
                                    <textarea 
                                        required 
                                        value={claimData.description} 
                                        onChange={e => setClaimData({ ...claimData, description: e.target.value })} 
                                        className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-orange-100 outline-none transition-all resize-none" 
                                        rows="4" 
                                        placeholder="Describir los síntomas detectados en el activo protegido..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Prioridad Operativa</label>
                                        <select 
                                            value={claimData.priority} 
                                            onChange={e => setClaimData({ ...claimData, priority: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-orange-100 outline-none transition-all px-6"
                                        >
                                            {claimPriorities.map(p => <option key={p.value} value={p.value}>{p.label.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Propuesta de Resolución</label>
                                        <input 
                                            type="text" 
                                            value={claimData.resolution} 
                                            onChange={e => setClaimData({ ...claimData, resolution: e.target.value })} 
                                            className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-bold focus:bg-white focus:border-orange-100 outline-none transition-all" 
                                            placeholder="Acción inmediata sugerida..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowClaimForm(false)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all"
                                    >
                                        Descartar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="flex-1 py-5 bg-orange-500 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-orange-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirmar Reclamo'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>
        </AdminLayout>
    );
};

export default AdminWarranties;
