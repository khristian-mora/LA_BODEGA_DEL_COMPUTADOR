import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Calendar, Plus, Edit2, Trash2, X, Clock, User, Wrench, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/Button';
import { API_CONFIG } from '../../config/config';
import { useModal } from '../../context/ModalContext';

const AdminAppointments = () => {
    const { showConfirm, showAlert } = useModal();
    const [appointments, setAppointments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [formData, setFormData] = useState({
        customerId: '', technicianId: '', serviceType: '', scheduledDate: '', notes: '', status: 'Pending'
    });

    const serviceTypes = ['Reparación', 'Mantenimiento', 'Diagnóstico', 'Instalación', 'Consultoría'];
    const statuses = [
        { value: 'Pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
        { value: 'Confirmed', label: 'Confirmada', color: 'bg-blue-100 text-blue-700' },
        { value: 'Completed', label: 'Completada', color: 'bg-green-100 text-green-700' },
        { value: 'Cancelled', label: 'Cancelada', color: 'bg-red-100 text-red-700' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [appointmentsRes, customersRes, usersRes] = await Promise.all([
                fetch(`${API_CONFIG.API_URL}/appointments`, { headers }),
                fetch(`${API_CONFIG.API_URL}/customers`, { headers }),
                fetch(`${API_CONFIG.API_URL}/users`, { headers })
            ]);

            if (!appointmentsRes.ok || !customersRes.ok || !usersRes.ok) throw new Error('Failed to fetch');

            const appointmentsData = await appointmentsRes.json();
            const customersData = await customersRes.json();
            const usersData = await usersRes.json();

            setAppointments(appointmentsData);
            setCustomers(customersData);
            setTechnicians(usersData.filter(u => u.role === 'technician' || u.role === 'admin'));
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al cargar datos',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingAppointment
                ? `${API_CONFIG.API_URL}/appointments/${editingAppointment.id}`
                : `${API_CONFIG.API_URL}/appointments`;

            const method = editingAppointment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar');
            }

            await showAlert({
                title: 'Éxito',
                message: editingAppointment ? 'Cita actualizada' : 'Cita creada',
                type: 'success'
            });
            setShowForm(false);
            setEditingAppointment(null);
            resetForm();
            fetchData();
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
            scheduledDate: appointment.scheduledDate.split('T')[0],
            notes: appointment.notes || '',
            status: appointment.status
        });
        setShowForm(true);
    };

    const handleDelete = async (appointmentId) => {
        const confirmed = await showConfirm({
            title: 'Confirmar eliminación',
            message: '¿Eliminar esta cita?',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_CONFIG.API_URL}/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });

            if (!response.ok) throw new Error('Error al eliminar');

            await showAlert({
                title: 'Cita eliminada',
                message: 'Cita eliminada',
                type: 'success'
            });
            fetchData();
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
        }
    };

    const resetForm = () => {
        setFormData({
            customerId: '', technicianId: '', serviceType: '', scheduledDate: '', notes: '', status: 'Pending'
        });
    };

    const getStatusBadge = (status) => {
        const statusObj = statuses.find(s => s.value === status) || statuses[0];
        return <span className={`px-2 py-1 rounded text-xs font-bold ${statusObj.color}`}>{statusObj.label}</span>;
    };

    const filteredAppointments = appointments.filter(a =>
        a.scheduledDate.startsWith(selectedDate)
    );

    const todayAppointments = appointments.filter(a =>
        a.scheduledDate.startsWith(new Date().toISOString().split('T')[0])
    );

    const upcomingAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.scheduledDate);
        const today = new Date();
        return appointmentDate > today && a.status !== 'Cancelled' && a.status !== 'Completed';
    }).slice(0, 5);

    return (
        <AdminLayout title="Agenda de Citas">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800">Sistema de Citas</h2>
                        <p className="text-sm text-gray-500">Programa servicios técnicos con clientes</p>
                    </div>
                    <Button onClick={() => { setEditingAppointment(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nueva Cita
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Hoy</p>
                        <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Próximas</p>
                        <p className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-600">{appointments.filter(a => a.status === 'Pending').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Completadas</p>
                        <p className="text-2xl font-bold text-green-600">{appointments.filter(a => a.status === 'Completed').length}</p>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        />
                        <span className="text-sm text-gray-600 font-bold">{filteredAppointments.length} citas</span>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>

                    {/* Selected Date Appointments */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800">Citas del {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</h3>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {loading ? (
                                <p className="text-center py-8 text-gray-500">Cargando...</p>
                            ) : filteredAppointments.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">No hay citas para esta fecha</p>
                            ) : filteredAppointments.map(appointment => (
                                <div key={appointment.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{appointment.customerName}</p>
                                            <p className="text-sm text-gray-600">{appointment.serviceType}</p>
                                        </div>
                                        {getStatusBadge(appointment.status)}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {appointment.technicianName && (
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {appointment.technicianName}
                                            </div>
                                        )}
                                    </div>
                                    {appointment.notes && (
                                        <p className="text-xs text-gray-600 mb-3">{appointment.notes}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(appointment)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">
                                            <Edit2 className="w-3 h-3 inline mr-1" />Editar
                                        </button>
                                        <button onClick={() => handleDelete(appointment.id)} className="text-red-600 hover:text-red-800 text-xs font-bold">
                                            <Trash2 className="w-3 h-3 inline mr-1" />Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800">Próximas Citas</h3>
                        </div>
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {upcomingAppointments.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">No hay citas próximas</p>
                            ) : upcomingAppointments.map(appointment => (
                                <div key={appointment.id} className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{appointment.customerName}</p>
                                            <p className="text-sm text-gray-600">{appointment.serviceType}</p>
                                        </div>
                                        {getStatusBadge(appointment.status)}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {new Date(appointment.scheduledDate).toLocaleDateString()} • {new Date(appointment.scheduledDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Calendar className="w-5 h-5" /> {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingAppointment(null); resetForm(); }} className="text-gray-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Cliente *</label>
                                <select required value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} className="w-full p-3 border rounded-lg">
                                    <option value="">Seleccionar cliente</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Servicio *</label>
                                <select required value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })} className="w-full p-3 border rounded-lg">
                                    <option value="">Seleccionar</option>
                                    {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Técnico Asignado</label>
                                <select value={formData.technicianId} onChange={e => setFormData({ ...formData, technicianId: e.target.value })} className="w-full p-3 border rounded-lg">
                                    <option value="">Sin asignar</option>
                                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha y Hora *</label>
                                <input required type="datetime-local" value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} className="w-full p-3 border rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 border rounded-lg">
                                    {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notas</label>
                                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full p-3 border rounded-lg" rows="3"></textarea>
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 mt-4">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingAppointment(null); resetForm(); }}>Cancelar</Button>
                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Guardando...' : (editingAppointment ? 'Actualizar' : 'Crear Cita')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </AdminLayout>
    );
};

export default AdminAppointments;
