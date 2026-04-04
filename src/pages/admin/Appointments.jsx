import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
    appointmentService,
    APPOINTMENT_STATUSES,
    APPOINTMENT_STATUS_CONFIG,
    SERVICE_TYPES,
    STATUS_TRANSITIONS
} from '../../services/appointmentService';
import {
    Calendar, Plus, Edit2, Trash2, X, Clock, User, Wrench, CheckCircle, XCircle,
    Download, Filter, Search, RefreshCw, TrendingUp, AlertTriangle, Eye,
    BarChart3, UserX, CalendarCheck, CalendarX, CalendarDays, AlertCircle,
    ChevronLeft, ChevronRight, Check, MapPin, Phone, Mail, ArrowRight, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PortalWrapper from '../../components/PortalWrapper';
import Button from '../../components/Button';
import { useModal } from '../../context/ModalContext';
import { customerService } from '../../services/customerService';
import { buildApiUrl } from '../../config/config';
import * as XLSX from 'xlsx';
import { ticketService } from '../../services/ticketService';

const AdminAppointments = () => {
    const { showConfirm, showAlert } = useModal();

    // Data states
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userRole = user.role || 'técnico';
    const isAdmin = userRole === 'admin';
    const isVendedor = userRole === 'vendedor';
    const canModify = isAdmin || isVendedor;

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [showDetail, setShowDetail] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterServiceType, setFilterServiceType] = useState('');
    const [filterTechnician, setFilterTechnician] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [statsPeriod, setStatsPeriod] = useState('month');

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        technicianId: '',
        serviceType: '',
        scheduledDate: '',
        duration: 60,
        notes: '',
        status: 'Pending'
    });

    useEffect(() => {
        fetchCustomersAndTechnicians();
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [currentPage, filterStatus, filterServiceType, filterTechnician, searchTerm, dateRange]);

    useEffect(() => {
        fetchStatistics();
    }, [statsPeriod]);

    const fetchCustomersAndTechnicians = async () => {
        try {
            const [customersData, usersData] = await Promise.all([
                customerService.getAllCustomers(),
                ticketService.getTechnicians()
            ]);
            setCustomers(Array.isArray(customersData) ? customersData : (customersData.customers || []));
            setTechnicians(usersData || []);
        } catch (error) {
            console.error('Error fetching customers/technicians:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                status: filterStatus || undefined,
                serviceType: filterServiceType || undefined,
                technicianId: filterTechnician || undefined,
                search: searchTerm || undefined,
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            };
            const data = await appointmentService.getAppointments(params);
            setAppointments(data.appointments || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotalItems(data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const data = await appointmentService.getAppointmentStats(statsPeriod);
            setStatistics(data || {});
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingAppointment) {
                await appointmentService.updateAppointment(editingAppointment.id, formData);
                showAlert({ title: 'Éxito', message: 'Cita actualizada correctamente', type: 'success' });
            } else {
                await appointmentService.createAppointment(formData);
                showAlert({ title: 'Éxito', message: 'Cita creada correctamente', type: 'success' });
            }
            setShowForm(false);
            setEditingAppointment(null);
            resetForm();
            fetchAppointments();
            fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (appointment) => {
        setEditingAppointment(appointment);
        setFormData({
            customerId: appointment.customerId,
            technicianId: appointment.technicianId || '',
            serviceType: appointment.serviceType,
            scheduledDate: appointment.scheduledDate?.slice(0, 16) || '',
            duration: appointment.duration || 60,
            notes: appointment.notes || '',
            status: appointment.status
        });
        setShowForm(true);
    };

    const handleDelete = async (appointmentId) => {
        const confirmed = await showConfirm({
            title: 'Confirmar eliminación',
            message: '¿Estás seguro de eliminar esta cita?',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await appointmentService.deleteAppointment(appointmentId);
            showAlert({ title: 'Eliminada', message: 'Cita eliminada correctamente', type: 'success' });
            fetchAppointments();
            fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/appointments/export?format=json&token=${token}`));
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allAppointments = await response.json();
            
            const headers = [['ID', 'Cliente', 'Cliente_Tel', 'Técnico', 'Servicio', 'Fecha', 'Hora', 'Estado', 'Notas']];
            const dataToExport = allAppointments.map(app => [
                app.id,
                app.customerName || '',
                app.customerPhone || '',
                app.technicianName || '',
                app.serviceType || '',
                app.scheduledDate ? new Date(app.scheduledDate).toLocaleDateString() : '',
                app.scheduledDate ? new Date(app.scheduledDate).toLocaleTimeString() : '',
                app.status || '',
                app.notes || ''
            ]);
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataToExport]);
            XLSX.utils.book_append_sheet(wb, ws, "Citas");
            XLSX.writeFile(wb, "Citas_LBDC.xlsx");
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl('/api/appointments/reminders/daily'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                showAlert({ title: 'Éxito', message: data.message, type: 'success' });
            } else {
                throw new Error(data.error || 'Error enviando recordatorios');
            }
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
            showAlert({
                title: 'Estado actualizado',
                message: `Cita marcada como: ${APPOINTMENT_STATUS_CONFIG[newStatus]?.label || newStatus}`,
                type: 'success'
            });
            fetchAppointments();
            fetchStatistics();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const resetForm = () => {
        setFormData({
            customerId: '',
            technicianId: '',
            serviceType: '',
            scheduledDate: '',
            duration: 60,
            notes: '',
            status: 'Pending'
        });
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
            time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
            case 'Cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
            case 'Confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-200';
            case 'No-Show': return 'bg-orange-500/10 text-orange-600 border-orange-200';
            default: return 'bg-amber-500/10 text-amber-600 border-amber-200';
        }
    };

    return (
        <AdminLayout title="Agenda de Citas">
            <div className="space-y-6 pb-12">
                
                {/* Industrial KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:scale-110">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Total Citas</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{statistics.summary?.totalAppointments || 0}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Registradas</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 transition-transform group-hover:scale-110">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-amber-500 bg-amber-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Pendientes</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{statistics.summary?.pendingAppointments || 0}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Por Confirmar</p>
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
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Completadas</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{statistics.summary?.completedAppointments || 0}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Servicios Exitosos</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-150 transition-transform">
                            <Activity className="w-24 h-24 text-white" />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-white/10 rounded-2xl text-white">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Eficiencia</span>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <h4 className="text-3xl font-black text-white tracking-tighter">{Math.round((statistics.summary?.completedAppointments / statistics.summary?.totalAppointments) * 100) || 0}%</h4>
                            <p className="text-xs font-bold text-white/40 uppercase">Tasa de Conclusión</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-50 rounded-2xl text-red-600 transition-transform group-hover:scale-110">
                                <UserX className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-red-500 bg-red-50/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">No-Asistió</span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{statistics.summary?.noShowAppointments || 0}</h4>
                            <p className="text-xs font-bold text-slate-500 uppercase">Ausentismo</p>
                        </div>
                    </motion.div>
                </div>

                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden">
                    {/* Industrial Toolbar */}
                    <div className="p-8 border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-center bg-gray-50/20 gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-200">
                                <Calendar className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight leading-none mb-1">Centro de Agenda</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{totalItems} Citas en Registro</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar cliente o servicio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm transition-all focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none"
                                />
                            </div>
                            
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-5 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all outline-none appearance-none focus:ring-4 focus:ring-slate-100 min-w-[160px]"
                            >
                                <option value="">Todos los Estados</option>
                                {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([val, cfg]) => (
                                    <option key={val} value={val}>{cfg.label.toUpperCase()}</option>
                                ))}
                            </select>

                            {canModify && (
                                <Button onClick={handleExport} variant="outline" className="h-12 flex-1 lg:flex-none bg-white border border-gray-200 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 px-6 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700">
                                    <Download className="w-4 h-4" /> Exportar
                                </Button>
                            )}
                            {canModify && (
                                <Button onClick={() => setShowForm(true)} className="h-12 flex-1 lg:flex-none bg-slate-900 rounded-2xl shadow-xl hover:bg-black font-bold text-xs uppercase tracking-widest flex items-center gap-2 px-6">
                                    <Plus className="w-4 h-4 text-white" /> Programar Cita
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Industrial Ledger Table */}
                    <div className="overflow-x-auto p-2">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                                    <th className="p-6">Cronograma</th>
                                    <th className="p-6">Identidad Cliente</th>
                                    <th className="p-6">Servicio & Técnico</th>
                                    <th className="p-6">Estado Operativo</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Agenda...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <CalendarX className="w-16 h-16 text-slate-300" />
                                                    <p className="text-xs font-black uppercase tracking-widest">No se encontraron bloques asignados</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : appointments.map((appointment, idx) => {
                                        const { date, time } = formatDateTime(appointment.scheduledDate);
                                        const transitions = STATUS_TRANSITIONS[appointment.status] || [];
                                        return (
                                            <motion.tr 
                                                key={appointment.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="hover:bg-slate-50/50 transition-all group"
                                            >
                                                <td className="p-6">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{date}</p>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter">{time}</span>
                                                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black">{appointment.duration}min</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
                                                            <User className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black text-slate-900 leading-tight">{appointment.customerName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                                <Phone className="w-2.5 h-2.5" /> {appointment.customerPhone || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{appointment.serviceType}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter italic">{appointment.technicianName || 'Mesa Técnica'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-2">
                                                        <div className={`w-fit px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(appointment.status)}`}>
                                                            {appointment.status}
                                                        </div>
                                                        {transitions.length > 0 && (
                                                            <div className="flex gap-1">
                                                                 {transitions.slice(0, 2).map(next => (
                                                                    <button
                                                                        key={next}
                                                                        onClick={() => handleStatusChange(appointment.id, next)}
                                                                        className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                                                                        title={`Mover a ${next}`}
                                                                    >
                                                                        <ArrowRight className="w-3 h-3" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            onClick={() => setShowDetail(appointment)}
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </motion.button>
                                                        {canModify && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleEdit(appointment)}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </motion.button>
                                                        )}
                                                        {isAdmin && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleDelete(appointment.id)}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-gray-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
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
                        <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página {currentPage} de {totalPages}</p>
                            <div className="flex gap-2">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:border-slate-900 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 hover:border-slate-900 transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Industrial Form Modal */}
            <PortalWrapper isOpen={showForm}>
                {showForm && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowForm(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-900 tracking-tight leading-none mb-1">
                                            {editingAppointment ? 'Modificar Registro' : 'Nueva Programación'}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Agenda Operativa</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente Firmante</label>
                                        <select
                                            required
                                            value={formData.customerId}
                                            onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                        >
                                            <option value="">Seleccionar Cliente</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico Asignado</label>
                                        <select
                                            value={formData.technicianId}
                                            onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                        >
                                            <option value="">Cualquier Especialista</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Servicio</label>
                                        <select
                                            required
                                            value={formData.serviceType}
                                            onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                        >
                                            <option value="">Seleccionar Servicio</option>
                                            {SERVICE_TYPES.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronograma (Fecha/Hora)</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={formData.scheduledDate}
                                            onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrucciones Operativas / Notas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                                        placeholder="Detalles adicionales del requerimiento..."
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                                    >
                                        Abortar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all"
                                    >
                                        {editingAppointment ? 'Actualizar Registro' : 'Confirmar Agenda'}
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
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowDetail(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-8 bg-slate-900 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Activity className="w-32 h-32" />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-4">
                                        <div className={`w-fit px-3 py-1 rounded-lg border border-white/20 text-[9px] font-black uppercase tracking-widest ${getStatusStyle(showDetail.status)} bg-white/10`}>
                                            {showDetail.status}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tighter leading-tight">{showDetail.customerName}</h3>
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{showDetail.serviceType} • ID-{showDetail.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDetail(null)} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-all"><X className="w-5 h-5 text-white" /></button>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cronograma</p>
                                        <p className="font-black text-slate-900 text-lg">{formatDateTime(showDetail.scheduledDate).date}</p>
                                        <p className="text-sm font-bold text-slate-500">{formatDateTime(showDetail.scheduledDate).time}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Asignación</p>
                                        <p className="font-black text-slate-900 text-lg">{showDetail.technicianName || 'Mesa Técnica'}</p>
                                        <p className="text-sm font-bold text-slate-500">{showDetail.duration} Minutos</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Phone className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                                            <p className="font-black text-slate-900">{showDetail.customerPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal Digital</p>
                                            <p className="font-black text-slate-900">{showDetail.customerEmail || 'Sin correo'}</p>
                                        </div>
                                    </div>
                                </div>

                                {showDetail.notes && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bitácora Operativa</p>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic border-l-4 border-slate-900 pl-4 bg-slate-50 py-4 rounded-r-2xl">
                                            "{showDetail.notes}"
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        onClick={() => { handleEdit(showDetail); setShowDetail(null); }}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all"
                                    >
                                        Editar Registro
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </PortalWrapper>
        </AdminLayout>
    );
};

export default AdminAppointments;
