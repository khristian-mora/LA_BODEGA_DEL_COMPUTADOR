import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Shield, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Clock, Download, Filter, Search, FileText, AlertTriangle } from 'lucide-react';
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
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [editingWarranty, setEditingWarranty] = useState(null);
    const [selectedWarranty, setSelectedWarranty] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalWarranties, setTotalWarranties] = useState(0);
    const itemsPerPage = 10;

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterExpiring, setFilterExpiring] = useState(false);

    const [formData, setFormData] = useState({
        ticketId: '', customerId: '', productId: '', startDate: '', endDate: '', terms: '', status: 'Active'
    });

    const [claimData, setClaimData] = useState({
        description: '', priority: 'medium', resolution: ''
    });

    const statuses = [
        { value: '', label: 'Todos' },
        { value: 'Active', label: 'Activa', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        { value: 'Expired', label: 'Expirada', color: 'bg-red-100 text-red-700', icon: AlertCircle },
        { value: 'Claimed', label: 'Reclamada', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
    ];

    const claimPriorities = [
        { value: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-700' },
        { value: 'medium', label: 'Media', color: 'bg-yellow-100 text-yellow-700' },
        { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
        { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-700' }
    ];

    useEffect(() => {
        fetchData();
    }, [currentPage, filterStatus, filterExpiring]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Build warranty URL with pagination and filters
            let warrantyUrl = buildApiUrl('/api/warranties');
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);
            if (filterStatus) params.append('status', filterStatus);
            if (filterExpiring) params.append('expiringSoon', 'true');
            warrantyUrl += `?${params.toString()}`;

            const [warrantiesRes, customersRes, ticketsRes] = await Promise.all([
                fetch(warrantyUrl, { headers }),
                fetch(buildApiUrl('/api/customers'), { headers }),
                fetch(buildApiUrl('/api/tickets'), { headers })
            ]);

            if (!warrantiesRes.ok || !customersRes.ok || !ticketsRes.ok) throw new Error('Failed to fetch');

            const warrantiesData = await warrantiesRes.json();
            // Handle paginated response
            if (warrantiesData.warranties) {
                setWarranties(warrantiesData.warranties);
                setTotalPages(warrantiesData.totalPages || 1);
                setTotalWarranties(warrantiesData.total || warrantiesData.warranties.length);
            } else {
                setWarranties(warrantiesData);
                setTotalPages(1);
                setTotalWarranties(warrantiesData.length);
            }

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

    const handleClaim = async (e) => {
        e.preventDefault();
        if (!selectedWarranty) return;

        setLoading(true);
        try {
            const response = await fetch(buildApiUrl(`/api/warranties/${selectedWarranty.id}/claim`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(claimData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al registrar reclamo');
            }

            await showAlert({
                title: 'Éxito',
                message: 'Reclamo registrado exitosamente',
                type: 'success'
            });
            setShowClaimForm(false);
            setSelectedWarranty(null);
            setClaimData({ description: '', priority: 'medium', resolution: '' });
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

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams();
            params.append('format', 'csv');
            if (filterStatus) params.append('status', filterStatus);
            if (filterExpiring) params.append('expiringSoon', 'true');

            const response = await fetch(buildApiUrl(`/api/warranties/export?${params.toString()}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al exportar');

            const csvContent = await response.text();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `garantias_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar', type: 'error' });
        }
    };

    const resetForm = () => {
        setFormData({
            ticketId: '', customerId: '', productId: '', startDate: '', endDate: '', terms: '', status: 'Active'
        });
    };

    const getStatusBadge = (status) => {
        const statusObj = statuses.find(s => s.value === status) || statuses[1];
        const Icon = statusObj.icon;
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold ${statusObj.color} flex items-center gap-1 w-fit`}>
                <Icon className="w-3 h-3" />
                {statusObj.label}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const priorityObj = claimPriorities.find(p => p.value === priority) || claimPriorities[1];
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold ${priorityObj.color}`}>
                {priorityObj.label}
            </span>
        );
    };

    const isExpiringSoon = (endDate) => {
        const daysUntilExpiry = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    };

    const getDaysUntilExpiry = (endDate) => {
        return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    };

    // Statistics
    const stats = useMemo(() => {
        const active = warranties.filter(w => w.status === 'Active').length;
        const expired = warranties.filter(w => w.status === 'Expired').length;
        const claimed = warranties.filter(w => w.status === 'Claimed').length;
        const expiringSoon = warranties.filter(w => isExpiringSoon(w.endDate)).length;
        const totalClaims = warranties.filter(w => w.claims && w.claims.length > 0)
            .reduce((sum, w) => sum + (w.claims?.length || 0), 0);
        return { active, expired, claimed, expiringSoon, totalClaims };
    }, [warranties]);

    // Filtered warranties by search term
    const filteredWarranties = useMemo(() => {
        if (!searchTerm) return warranties;
        return warranties.filter(w =>
            w.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.deviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(w.id).includes(searchTerm)
        );
    }, [warranties, searchTerm]);

    return (
        <AdminLayout title="Gestión de Garantías">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800">Sistema de Garantías</h2>
                        <p className="text-sm text-gray-500">Registro, seguimiento y reclamos de garantías</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar
                        </Button>
                        <Button onClick={() => { setEditingWarranty(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nueva Garantía
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Activas</p>
                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Por Vencer (30 días)</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Reclamadas</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.claimed}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Expiradas</p>
                        <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Reclamos</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.totalClaims}</p>
                    </div>
                </div>

                {/* Expiring Soon Alert */}
                {stats.expiringSoon > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        <div>
                            <p className="font-bold text-yellow-800">Alerta: {stats.expiringSoon} garantía(s) próximas a vencer</p>
                            <p className="text-sm text-yellow-700">Se vencerán en los próximos 30 días. Considera contactar a los clientes.</p>
                        </div>
                        <button
                            onClick={() => setFilterExpiring(true)}
                            className="ml-auto text-sm text-yellow-700 underline hover:text-yellow-900"
                        >
                            Ver solo próximas a vencer
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filtros:</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente, dispositivo..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="p-2 border rounded-lg text-sm"
                        >
                            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={filterExpiring}
                                onChange={e => { setFilterExpiring(e.target.checked); setCurrentPage(1); }}
                                className="rounded"
                            />
                            Solo próximas a vencer
                        </label>
                        {(filterStatus || filterExpiring || searchTerm) && (
                            <button
                                onClick={() => { setFilterStatus(''); setFilterExpiring(false); setSearchTerm(''); setCurrentPage(1); }}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                        <span className="ml-auto text-sm text-gray-500">
                            {totalWarranties} garantía(s)
                        </span>
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
                        ) : filteredWarranties.length === 0 ? (
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
                                        <th className="text-left p-3 font-bold text-gray-700">Reclamos</th>
                                        <th className="text-right p-3 font-bold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWarranties.map((warranty) => {
                                        const daysLeft = getDaysUntilExpiry(warranty.endDate);
                                        const expSoon = isExpiringSoon(warranty.endDate);
                                        return (
                                            <tr key={warranty.id} className={`border-b border-gray-100 hover:bg-gray-50 ${expSoon ? 'bg-yellow-50/50' : ''}`}>
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
                                                    {expSoon && (
                                                        <p className="text-xs text-yellow-600 font-bold">
                                                            ⚠️ {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vence hoy'}
                                                        </p>
                                                    )}
                                                    {daysLeft <= 0 && warranty.status === 'Active' && (
                                                        <p className="text-xs text-red-600 font-bold">⚠️ Vencida</p>
                                                    )}
                                                </td>
                                                <td className="p-3">{getStatusBadge(warranty.status)}</td>
                                                <td className="p-3">
                                                    {warranty.claims && warranty.claims.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {warranty.claims.slice(0, 2).map((claim, idx) => (
                                                                <div key={idx} className="text-xs">
                                                                    {getPriorityBadge(claim.priority)}
                                                                    <span className="ml-1 text-gray-500 truncate">{claim.description?.substring(0, 30)}...</span>
                                                                </div>
                                                            ))}
                                                            {warranty.claims.length > 2 && (
                                                                <p className="text-xs text-gray-500">+{warranty.claims.length - 2} más</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Sin reclamos</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {warranty.status === 'Active' && (
                                                            <button
                                                                onClick={() => { setSelectedWarranty(warranty); setShowClaimForm(true); }}
                                                                className="text-orange-600 hover:text-orange-800 p-1"
                                                                title="Registrar Reclamo"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => { setEditingWarranty(warranty); setFormData({ ...warranty }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 p-1">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(warranty.id)} className="text-red-600 hover:text-red-800 p-1">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                Página {currentPage} de {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
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
                                            className={`px-3 py-1 border rounded text-sm ${currentPage === page ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
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
                                        {statuses.filter(s => s.value).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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

            {/* Claim Form Modal */}
            {showClaimForm && selectedWarranty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-600" /> Registrar Reclamo de Garantía
                            </h3>
                            <button onClick={() => { setShowClaimForm(false); setSelectedWarranty(null); }} className="text-gray-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleClaim} className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Garantía de:</p>
                                <p className="font-bold">{selectedWarranty.customerName}</p>
                                <p className="text-sm text-gray-600">{selectedWarranty.deviceType} {selectedWarranty.brand} {selectedWarranty.model}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del Problema *</label>
                                <textarea
                                    required
                                    value={claimData.description}
                                    onChange={e => setClaimData({ ...claimData, description: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                    rows="3"
                                    placeholder="Describe el problema reportado por el cliente..."
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Prioridad</label>
                                <select
                                    value={claimData.priority}
                                    onChange={e => setClaimData({ ...claimData, priority: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                >
                                    {claimPriorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Resolución (Opcional)</label>
                                <textarea
                                    value={claimData.resolution}
                                    onChange={e => setClaimData({ ...claimData, resolution: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                    rows="2"
                                    placeholder="Detalles de la resolución..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => { setShowClaimForm(false); setSelectedWarranty(null); }}>Cancelar</Button>
                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Registrando...' : 'Registrar Reclamo'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
};

export default AdminWarranties;
