import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Users, Plus, Edit2, Trash2, Search, X, Phone, Mail, MapPin, CreditCard, History, Tag } from 'lucide-react';
import Button from '../../components/Button';
import { API_CONFIG } from '../../config/config';
import { useModal } from '../../context/ModalContext';

const AdminCustomers = () => {
    const { showConfirm, showAlert } = useModal();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', idNumber: '', customerType: 'Regular', notes: ''
    });

    const customerTypes = [
        { value: 'VIP', label: 'VIP', color: 'bg-purple-100 text-purple-700' },
        { value: 'Regular', label: 'Regular', color: 'bg-blue-100 text-blue-700' },
        { value: 'Nuevo', label: 'Nuevo', color: 'bg-green-100 text-green-700' },
        { value: 'Corporativo', label: 'Corporativo', color: 'bg-yellow-100 text-yellow-700' }
    ];

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/customers`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al cargar clientes',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerDetails = async (customerId) => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/customers/${customerId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setSelectedCustomer(data);
            setShowDetails(true);
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al cargar detalles del cliente',
                type: 'error'
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingCustomer
                ? `${API_CONFIG.API_URL}/customers/${editingCustomer.id}`
                : `${API_CONFIG.API_URL}/customers`;

            const method = editingCustomer ? 'PUT' : 'POST';

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
                message: editingCustomer ? 'Cliente actualizado' : 'Cliente creado',
                type: 'success'
            });
            setShowForm(false);
            setEditingCustomer(null);
            resetForm();
            fetchCustomers();
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

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            idNumber: customer.idNumber || '',
            customerType: customer.customerType || 'Regular',
            notes: customer.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (customerId) => {
        const confirmed = await showConfirm({
            title: 'Confirmar eliminación',
            message: '¿Eliminar este cliente? Esta acción no se puede deshacer.',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_CONFIG.API_URL}/customers/${customerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });

            if (!response.ok) throw new Error('Error al eliminar');

            await showAlert({
                title: 'Cliente eliminado',
                message: 'Cliente eliminado',
                type: 'success'
            });
            fetchCustomers();
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
            name: '', email: '', phone: '', address: '', idNumber: '', customerType: 'Regular', notes: ''
        });
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeBadge = (type) => {
        const typeObj = customerTypes.find(t => t.value === type) || customerTypes[1];
        return <span className={`px-2 py-1 rounded text-xs font-bold ${typeObj.color}`}>{typeObj.label}</span>;
    };

    return (
        <AdminLayout title="Gestión de Clientes">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800">Base de Datos de Clientes</h2>
                        <p className="text-sm text-gray-500">CRM - Gestiona clientes y su historial</p>
                    </div>
                    <Button onClick={() => { setEditingCustomer(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Cliente
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total Clientes</p>
                        <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">VIP</p>
                        <p className="text-2xl font-bold text-purple-600">{customers.filter(c => c.customerType === 'VIP').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Corporativos</p>
                        <p className="text-2xl font-bold text-yellow-600">{customers.filter(c => c.customerType === 'Corporativo').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Nuevos</p>
                        <p className="text-2xl font-bold text-green-600">{customers.filter(c => c.customerType === 'Nuevo').length}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email, teléfono o documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        />
                    </div>
                </div>

                {/* Customers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    {loading ? (
                        <div className="col-span-full text-center py-8 text-gray-500">Cargando...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">No hay clientes</div>
                    ) : filteredCustomers.map(customer => (
                        <div key={customer.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => fetchCustomerDetails(customer.id)}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 mb-1">{customer.name}</h3>
                                    {getTypeBadge(customer.customerType)}
                                </div>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-800">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-800">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        {customer.phone}
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {customer.email}
                                    </div>
                                )}
                                {customer.idNumber && (
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        {customer.idNumber}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Users className="w-5 h-5 text-black" /> {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingCustomer(null); resetForm(); }} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Completo *</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">CC/NIT</label>
                                    <input
                                        value={formData.idNumber}
                                        onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Cliente</label>
                                    <div className="relative">
                                        <select
                                            value={formData.customerType}
                                            onChange={e => setFormData({ ...formData, customerType: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none appearance-none"
                                        >
                                            {customerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección</label>
                                    <input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setShowForm(false); setEditingCustomer(null); resetForm(); }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="px-8"
                                    >
                                        {loading ? 'Guardando...' : (editingCustomer ? 'Guardar Cambios' : 'Crear Cliente')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetails && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <History className="w-5 h-5" /> Detalles del Cliente
                            </h3>
                            <button onClick={() => { setShowDetails(false); setSelectedCustomer(null); }} className="text-gray-400 hover:text-black">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5" /> Información Personal
                                </h4>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Nombre</p>
                                        <p className="font-bold">{selectedCustomer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tipo</p>
                                        {getTypeBadge(selectedCustomer.customerType)}
                                    </div>
                                    {selectedCustomer.email && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Email</p>
                                            <p className="font-bold">{selectedCustomer.email}</p>
                                        </div>
                                    )}
                                    {selectedCustomer.phone && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                                            <p className="font-bold">{selectedCustomer.phone}</p>
                                        </div>
                                    )}
                                    {selectedCustomer.idNumber && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">CC/NIT</p>
                                            <p className="font-bold">{selectedCustomer.idNumber}</p>
                                        </div>
                                    )}
                                    {selectedCustomer.address && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Dirección</p>
                                            <p className="font-bold">{selectedCustomer.address}</p>
                                        </div>
                                    )}
                                    {selectedCustomer.notes && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Notas</p>
                                            <p className="text-sm">{selectedCustomer.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Service History */}
                            <div>
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <History className="w-5 h-5" /> Historial de Servicios
                                </h4>
                                {selectedCustomer.tickets && selectedCustomer.tickets.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedCustomer.tickets.map(ticket => (
                                            <div key={ticket.id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold">Ticket #{ticket.id}</p>
                                                        <p className="text-sm text-gray-600">{ticket.deviceType} {ticket.brand} {ticket.model}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                        ticket.status === 'READY' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{ticket.issueDescription}</p>
                                                <p className="text-xs text-gray-400 mt-2">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">No hay servicios registrados</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </AdminLayout>
    );
};

export default AdminCustomers;
