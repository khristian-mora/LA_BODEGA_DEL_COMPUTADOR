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
    ChevronLeft, ChevronRight, Check, MapPin, Phone, Mail
} from 'lucide-react';
import Button from '../../components/Button';
import { useModal } from '../../context/ModalContext';
import { buildApiUrl } from '../../config/config';

const AdminAppointments = () => {
    const { showConfirm, showAlert } = useModal();

    // Data states
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // Load initial data
    useEffect(() => {
        fetchCustomersAndTechnicians();
    }, []);

    // Load appointments when filters change
    useEffect(() => {
        fetchAppointments();
    }, [currentPage, filterStatus, filterServiceType, filterTechnician, searchTerm, dateRange]);

    // Load statistics when period changes
    useEffect(() => {
        fetchStatistics();
    }, [statsPeriod]);

    const fetchCustomersAndTechnicians = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [customersRes, usersRes] = await Promise.all([
                fetch(buildApiUrl('/customers'), { headers }),
                fetch(buildApiUrl('/users'), { headers })
            ]);

            if (!customersRes.ok || !usersRes.ok) throw new Error('Failed to fetch');

            const customersData = await customersRes.json();
            const usersData = await usersRes.json();

            setCustomers(customersData.customers || customersData || []);
            setTechnicians((usersData.users || usersData || []).filter(u => u.role === 'technician' || u.role === 'admin'));
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
            showAlert({
                title: 'Error',
                message: 'Error al cargar las citas',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const data = await appointmentService.getAppointmentStats(statsPeriod);
            setStatistics(data);
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
                await showAlert({
                    title: 'Éxito',
                    message: 'Cita actualizada correctamente',
                    type: 'success'
                });
            } else {
                await appointmentService.createAppointment(formData);
                await showAlert({
                    title: 'Éxito',
                    message: 'Cita creada correctamente',
                    type: 'success'
                });
            }
            setShowForm(false);
            setEditingAppointment(null);
            resetForm();
            fetchAppointments();
            fetchStatistics();
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
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
            message: '¿Estás seguro de eliminar esta cita? Esta acción no se puede deshacer.',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            await appointmentService.deleteAppointment(appointmentId);
            await showAlert({
                title: 'Eliminada',
                message: 'Cita eliminada correctamente',
                type: 'success'
            });
            fetchAppointments();
            fetchStatistics();
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
        }
    };

    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
            await showAlert({
                title: 'Estado actualizado',
                message: `Cita marcada como: ${APPOINTMENT_STATUS_CONFIG[newStatus]?.label || newStatus}`,
                type: 'success'
            });
            fetchAppointments();
            fetchStatistics();
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
        }
    };

    const handleExport = async () => {
        try {
            await appointmentService.exportAppointments({
                status: filterStatus || undefined,
                technicianId: filterTechnician || undefined,
                startDate: dateRange.start || undefined,
                endDate: dateRange.end || undefined
            });
        } catch (error) {
            showAlert({
                title: 'Error',
                message: 'Error al exportar las citas',
                type: 'error'
            });
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

    const clearFilters = () => {
        setFilterStatus('');
        setFilterServiceType('');
        setFilterTechnician('');
        setSearchTerm('');
        setDateRange({ start: '', end: '' });
        setCurrentPage(1);
    };

    // Status badge component
    const getStatusBadge = (status) => {
        const config = APPOINTMENT_STATUS_CONFIG[status] || APPOINTMENT_STATUS_CONFIG[APPOINTMENT_STATUSES.PENDING];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    // Service type badge
    const getServiceBadge = (serviceType) => {
        const service = SERVICE_TYPES.find(s => s.value === serviceType);
        return service ? (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.color}`}>
                {service.label}
            </span>
        ) : <span className="text-gray-500 text-xs">{serviceType}</span>;
    };

    // Get available status transitions for an appointment
    const getAvailableTransitions = (currentStatus) => {
        return STATUS_TRANSITIONS[currentStatus] || [];
    };

    // Format date and time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
            time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <AdminLayout title="Agenda de Citas">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-indigo-600" />
                            Sistema de Gestión de Citas
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Programa, gestiona y da seguimiento a servicios técnicos</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </Button>
                        <Button onClick={() => { setEditingAppointment(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nueva Cita
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {/* Total Appointments */}
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl shadow-sm text-white">
                            <div className="flex items-center justify-between mb-2">
                                <CalendarDays className="w-5 h-5 opacity-80" />
                                <span className="text-xs opacity-80">Total</span>
                            </div>
                            <p className="text-2xl font-bold">{statistics.summary?.totalAppointments || 0}</p>
                            <p className="text-xs opacity-80">Citas</p>
                        </div>

                        {/* Pending */}
                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-xl shadow-sm text-white">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-5 h-5 opacity-80" />
                                <span className="text-xs opacity-80">Pendientes</span>
                            </div>
                            <p className="text-2xl font-bold">{statistics.summary?.pendingAppointments || 0}</p>
                            <p className="text-xs opacity-80">Por confirmar</p>
                        </div>

                        {/* Confirmed */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-sm text-white">
                            <div className="flex items-center justify-between mb-2">
                                <CalendarCheck className="w-5 h-5 opacity-80" />
                                <span className="text-xs opacity-80">Confirmadas</span>
                            </div>
                            <p className="text-2xl font-bold">{statistics.summary?.confirmedAppointments || 0}</p>
                            <p className="text-xs opacity-80">Programadas</p>
                        </div>

                        {/* Completed */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl shadow-sm text-white">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="w-5 h-5 opacity-80" />
                                <span className="text-xs opacity-80">Completadas</span>
                            </div>
                            <p className="text-2xl font-bold">{statistics.summary?.completedAppointments || 0}</p>
                            <p className="text-xs opacity-80">Servicios OK</p>
                        </div>

                        {/* Cancelled */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl shadow-sm text-white">
                            <div className="flex items-center justify-between mb-2">
                                <CalendarX className="w-5 h-5 opacity-80" />
                                <span className="text-xs opacity-80">Canceladas</span>
                            </div>
                            <p className="text-2xl font-bold">{statistics.summary?.cancelledAppointments || 0}</p>
                            <p className="text-xs opacity-80">Canceladas</p>
                        </div>

                        {/* No-Show */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl shadow-sm text-white">
                            <div className="flex items-center justify-between mb-2">
                                <UserX className="w-5 h-5 opacity-80" />
                                <span className="text-xs opacity-80">No Asistió</span>
                            </div>
                            <p className="text-2xl font-bold">{statistics.summary?.noShowAppointments || 0}</p>
                            <p className="text-xs opacity-80">
                                {statistics.cancellationRate || 0}% tasa
                            </p>
                        </div>
                    </div>
                )}

                {/* Statistics Period Selector & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                    {/* Period Selector */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Estadísticas
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            {['week', 'month', 'quarter'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setStatsPeriod(period)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                                        statsPeriod === period
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Trimestre'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Service Types Distribution */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-purple-600" />
                            Por Tipo de Servicio
                        </h3>
                        <div className="space-y-2">
                            {statistics.serviceTypes?.slice(0, 4).map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{item.serviceType}</span>
                                    <span className="font-semibold text-gray-800">{item.count}</span>
                                </div>
                            ))}
                            {(!statistics.serviceTypes || statistics.serviceTypes.length === 0) && (
                                <p className="text-sm text-gray-400 text-center">Sin datos</p>
                            )}
                        </div>
                    </div>

                    {/* Technician Performance */}
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            Rendimiento Técnicos
                        </h3>
                        <div className="space-y-2">
                            {statistics.technicianStats?.slice(0, 4).map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{item.technicianName || 'Sin nombre'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{item.completedCount || 0}/{item.appointmentCount || 0}</span>
                                        <span className="font-semibold text-green-600 text-xs">
                                            {item.appointmentCount > 0 
                                                ? Math.round((item.completedCount || 0) / item.appointmentCount * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!statistics.technicianStats || statistics.technicianStats.length === 0) && (
                                <p className="text-sm text-gray-400 text-center">Sin datos</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente, teléfono, servicio..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([value, config]) => (
                                <option key={value} value={value}>{config.label}</option>
                            ))}
                        </select>

                        {/* Service Type Filter */}
                        <select
                            value={filterServiceType}
                            onChange={(e) => { setFilterServiceType(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los servicios</option>
                            {SERVICE_TYPES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>

                        {/* Technician Filter */}
                        <select
                            value={filterTechnician}
                            onChange={(e) => { setFilterTechnician(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos los técnicos</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>

                        {/* Date Range */}
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder="Desde"
                        />
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder="Hasta"
                        />

                        {/* Clear Filters */}
                        <button
                            onClick={clearFilters}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Limpiar filtros"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <span className="text-sm text-gray-500 font-medium">
                            {totalItems} cita{totalItems !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Appointments Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha/Hora</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Servicio</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Técnico</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notas</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center">
                                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                                            <p className="text-gray-500 mt-2">Cargando citas...</p>
                                        </td>
                                    </tr>
                                ) : appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-12 text-center">
                                            <Calendar className="w-12 h-12 mx-auto text-gray-300" />
                                            <p className="text-gray-500 mt-2">No se encontraron citas</p>
                                            <p className="text-sm text-gray-400">Ajusta los filtros o crea una nueva cita</p>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appointment) => {
                                        const { date, time } = formatDateTime(appointment.scheduledDate);
                                        const availableTransitions = getAvailableTransitions(appointment.status);
                                        
                                        return (
                                            <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{date}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {time}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{appointment.customerName || 'Cliente no encontrado'}</p>
                                                        {appointment.customerPhone && (
                                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Phone className="w-3 h-3" /> {appointment.customerPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getServiceBadge(appointment.serviceType)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {appointment.technicianName || (
                                                        <span className="text-gray-400 italic">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(appointment.status)}
                                                        {/* Quick status actions */}
                                                        {availableTransitions.length > 0 && (
                                                            <div className="relative group">
                                                                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                                                </button>
                                                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[140px]">
                                                                    {availableTransitions.map(newStatus => (
                                                                        <button
                                                                            key={newStatus}
                                                                            onClick={() => handleStatusChange(appointment.id, newStatus)}
                                                                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2 ${
                                                                                newStatus === 'No-Show' ? 'text-orange-600' :
                                                                                newStatus === 'Completed' ? 'text-green-600' :
                                                                                newStatus === 'Cancelled' ? 'text-red-600' :
                                                                                'text-blue-600'
                                                                            }`}
                                                                        >
                                                                            {newStatus === 'Completed' && <Check className="w-3 h-3" />}
                                                                            {newStatus === 'Cancelled' && <XCircle className="w-3 h-3" />}
                                                                            {newStatus === 'No-Show' && <UserX className="w-3 h-3" />}
                                                                            {newStatus === 'Confirmed' && <CheckCircle className="w-3 h-3" />}
                                                                            {APPOINTMENT_STATUS_CONFIG[newStatus]?.label || newStatus}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {appointment.notes ? (
                                                        <p className="text-xs text-gray-500 max-w-[150px] truncate" title={appointment.notes}>
                                                            {appointment.notes}
                                                        </p>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => setShowDetail(appointment)}
                                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Ver detalles"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(appointment)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(appointment.id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upcoming Appointments Alert */}
                {statistics?.upcoming && statistics.upcoming.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4" />
                            Próximas 7 días ({statistics.upcoming.length} citas)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {statistics.upcoming.slice(0, 6).map((apt) => {
                                const { date, time } = formatDateTime(apt.scheduledDate);
                                return (
                                    <div key={apt.id} className="bg-white p-3 rounded-lg border border-blue-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{apt.customerName}</p>
                                                <p className="text-xs text-gray-500">{apt.serviceType}</p>
                                            </div>
                                            {getStatusBadge(apt.status)}
                                        </div>
                                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {date} • {time}
                                        </p>
                                        {apt.technicianName && (
                                            <p className="text-xs text-gray-500 mt-1">{apt.technicianName}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingAppointment(null); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
                            {/* Customer */}
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Cliente * <span className="text-gray-400 font-normal">(requerido)</span>
                                </label>
                                <select
                                    required
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar cliente</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Service Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Servicio *</label>
                                <select
                                    required
                                    value={formData.serviceType}
                                    onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar servicio</option>
                                    {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>

                            {/* Technician */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Técnico Asignado</label>
                                <select
                                    value={formData.technicianId}
                                    onChange={e => setFormData({ ...formData, technicianId: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Sin asignar</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            {/* Date & Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha y Hora *</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.scheduledDate}
                                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Duración (minutos)</label>
                                <input
                                    type="number"
                                    min="15"
                                    max="480"
                                    step="15"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Status (only for editing) */}
                            {editingAppointment && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([value, config]) => (
                                            <option key={value} value={value}>{config.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="Detalles del servicio, instrucciones especiales..."
                                ></textarea>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingAppointment(null); resetForm(); }}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Guardando...' : (editingAppointment ? 'Actualizar Cita' : 'Crear Cita')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Detalles de la Cita
                            </h3>
                            <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Status */}
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Estado</span>
                                {getStatusBadge(showDetail.status)}
                            </div>

                            {/* Customer */}
                            <div className="border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-indigo-600" /> Cliente
                                </h4>
                                <p className="font-medium">{showDetail.customerName || 'No encontrado'}</p>
                                {showDetail.customerEmail && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {showDetail.customerEmail}
                                    </p>
                                )}
                                {showDetail.customerPhone && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {showDetail.customerPhone}
                                    </p>
                                )}
                            </div>

                            {/* Service Details */}
                            <div className="border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-purple-600" /> Servicio
                                </h4>
                                <div className="mb-2">{getServiceBadge(showDetail.serviceType)}</div>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Duración: {showDetail.duration || 60} minutos
                                </p>
                            </div>

                            {/* Schedule */}
                            <div className="border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" /> Programación
                                </h4>
                                <p className="text-sm">
                                    {new Date(showDetail.scheduledDate).toLocaleDateString('es-ES', { 
                                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                    })}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(showDetail.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {/* Technician */}
                            {showDetail.technicianName && (
                                <div className="border-b border-gray-100 pb-4">
                                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-green-600" /> Técnico
                                    </h4>
                                    <p className="text-sm">{showDetail.technicianName}</p>
                                </div>
                            )}

                            {/* Notes */}
                            {showDetail.notes && (
                                <div className="pb-4">
                                    <h4 className="font-semibold text-gray-800 mb-2">Notas</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{showDetail.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    onClick={() => { setShowDetail(null); handleEdit(showDetail); }}
                                    className="flex items-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" /> Editar
                                </Button>
                                <div className="flex gap-2">
                                    {getAvailableTransitions(showDetail.status).map(newStatus => (
                                        <Button
                                            key={newStatus}
                                            onClick={async () => {
                                                await handleStatusChange(showDetail.id, newStatus);
                                                setShowDetail(null);
                                            }}
                                            variant={newStatus === 'Completed' ? 'primary' : 'outline'}
                                            className="text-xs"
                                        >
                                            {APPOINTMENT_STATUS_CONFIG[newStatus]?.label || newStatus}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
};

export default AdminAppointments;
