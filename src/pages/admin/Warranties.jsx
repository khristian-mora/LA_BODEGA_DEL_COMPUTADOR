import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Shield, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/Button';
import { buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';

const AdminWarranties = () => {
    const { showConfirm, showAlert } = useModal();
    const [warranties, setWarranties] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWarranty, setEditingWarranty] = useState(null);

    const [formData, setFormData] = useState({
        ticketId: '', customerId: '', productId: '', startDate: '', endDate: '', terms: '', status: 'Active'
    });

    const statuses = [
        { value: 'Active', label: 'Activa', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        { value: 'Expired', label: 'Expirada', color: 'bg-red-100 text-red-700', icon: AlertCircle },
        { value: 'Claimed', label: 'Reclamada', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [warrantiesRes, customersRes, ticketsRes] = await Promise.all([
                fetch(buildApiUrl('/api/warranties'), { headers }),
                fetch(buildApiUrl('/api/customers'), { headers }),
                fetch(buildApiUrl('/api/tickets'), { headers })
            ]);

            if (!warrantiesRes.ok || !customersRes.ok || !ticketsRes.ok) throw new Error('Failed to fetch');

            setWarranties(await warrantiesRes.json());
            setCustomers(await customersRes.json());
            setTickets(await ticketsRes.json());
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
            const url = editingWarranty
                ? buildApiUrl(`/api/warranties/${editingWarranty.id}`)
                : buildApiUrl('/api/warranties');

            const method = editingWarranty ? 'PUT' : 'POST';

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
                message: editingWarranty ? 'Garantía actualizada' : 'Garantía creada',
                type: 'success'
            });
            setShowForm(false);
            setEditingWarranty(null);
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

    const handleDelete = async (warrantyId) => {
        const confirmed = await showConfirm({
            title: 'Confirmar eliminación',
            message: '¿Eliminar esta garantía?',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch(buildApiUrl(`/api/warranties/${warrantyId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });

            if (!response.ok) throw new Error('Error al eliminar');

            await showAlert({
                title: 'Garantía eliminada',
                message: 'Garantía eliminada',
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
            ticketId: '', customerId: '', productId: '', startDate: '', endDate: '', terms: '', status: 'Active'
        });
    };

    const getStatusBadge = (status) => {
        const statusObj = statuses.find(s => s.value === status) || statuses[0];
        const Icon = statusObj.icon;
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold ${statusObj.color} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {statusObj.label}
            </span>
        );
    };

    const isExpiringSoon = (endDate) => {
        const daysUntilExpiry = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    return (
        <AdminLayout title="Gestión de Garantías">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800">Sistema de Garantías</h2>
                        <p className="text-sm text-gray-500">Registro y seguimiento de garantías</p>
                    </div>
                    <Button onClick={() => { setEditingWarranty(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nueva Garantía
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Activas</p>
                        <p className="text-2xl font-bold text-green-600">{warranties.filter(w => w.status === 'Active').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Por Vencer (30 días)</p>
                        <p className="text-2xl font-bold text-yellow-600">{warranties.filter(w => isExpiringSoon(w.endDate)).length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Expiradas</p>
                        <p className="text-2xl font-bold text-red-600">{warranties.filter(w => w.status === 'Expired').length}</p>
                    </div>
                </div>

                {/* Warranties List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800">Garantías Registradas</h3>
                    </div>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <p className="text-center py-8 text-gray-500">Cargando...</p>
                        ) : warranties.length === 0 ? (
                            <p className="text-center py-8 text-gray-500">No hay garantías registradas</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-3 font-bold text-gray-700">Cliente</th>
                                        <th className="text-left p-3 font-bold text-gray-700">Dispositivo</th>
                                        <th className="text-left p-3 font-bold text-gray-700">Inicio</th>
                                        <th className="text-left p-3 font-bold text-gray-700">Vencimiento</th>
                                        <th className="text-left p-3 font-bold text-gray-700">Estado</th>
                                        <th className="text-right p-3 font-bold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warranties.map((warranty) => (
                                        <tr key={warranty.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-3">
                                                <p className="font-bold text-gray-900">{warranty.customerName}</p>
                                                <p className="text-xs text-gray-500">ID: {warranty.id}</p>
                                            </td>
                                            <td className="p-3">
                                                {warranty.deviceType ? (
                                                    <>
                                                        <p className="font-bold">{warranty.deviceType}</p>
                                                        <p className="text-xs text-gray-500">{warranty.brand} {warranty.model}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-400">-</p>
                                                )}
                                            </td>
                                            <td className="p-3">{new Date(warranty.startDate).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <p>{new Date(warranty.endDate).toLocaleDateString()}</p>
                                                {isExpiringSoon(warranty.endDate) && (
                                                    <p className="text-xs text-yellow-600 font-bold">⚠️ Por vencer</p>
                                                )}
                                            </td>
                                            <td className="p-3">{getStatusBadge(warranty.status)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => { setEditingWarranty(warranty); setFormData({ ...warranty }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(warranty.id)} className="text-red-600 hover:text-red-800">
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
                </div>

            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Shield className="w-5 h-5" /> {editingWarranty ? 'Editar Garantía' : 'Nueva Garantía'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingWarranty(null); resetForm(); }} className="text-gray-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Cliente *</label>
                                    <select required value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} className="w-full p-3 border rounded-lg">
                                        <option value="">Seleccionar cliente</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Ticket (Opcional)</label>
                                    <select value={formData.ticketId} onChange={e => setFormData({ ...formData, ticketId: e.target.value })} className="w-full p-3 border rounded-lg">
                                        <option value="">Sin ticket asociado</option>
                                        {tickets.map(t => <option key={t.id} value={t.id}>#{t.id} - {t.clientName} - {t.deviceType}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Inicio *</label>
                                    <input required type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-3 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Vencimiento *</label>
                                    <input required type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full p-3 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Estado</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 border rounded-lg">
                                        {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Términos y Condiciones</label>
                                    <textarea value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} className="w-full p-3 border rounded-lg" rows="4" placeholder="Detalles de la garantía..."></textarea>
                                </div>
                                <div className="col-span-2 flex justify-end gap-3 mt-4">
                                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingWarranty(null); resetForm(); }}>Cancelar</Button>
                                    <Button type="submit" variant="primary" disabled={loading}>
                                        {loading ? 'Guardando...' : (editingWarranty ? 'Actualizar' : 'Crear Garantía')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


        </AdminLayout>
    );
};

export default AdminWarranties;
