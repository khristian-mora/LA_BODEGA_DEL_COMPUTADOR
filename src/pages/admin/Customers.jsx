import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    Users, Plus, Edit2, Trash2, Search, X, Phone, Mail, MapPin, 
    CreditCard, History, Tag, FileDown, FileUp, Info, ChevronRight,
    Star, Briefcase, Zap, UserPlus, Download, Upload, MoreVertical,
    Activity, ShieldCheck, Clock, Calendar
} from 'lucide-react';
import Button from '../../components/Button';
import { buildApiUrl, API_CONFIG } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import PortalWrapper from '../../components/PortalWrapper';

const AdminCustomers = () => {
    const navigate = useNavigate();
    const { showConfirm, showAlert } = useModal();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [showBirthdays, setShowBirthdays] = useState(false);
    const [birthdayCustomers, setBirthdayCustomers] = useState([]);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userRole = user.role || 'técnico';
    const isAdmin = userRole === 'admin';
    const canModify = isAdmin || userRole === 'vendedor';

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', idNumber: '', customerType: 'Regular', notes: '', birthday: ''
    });

    const customerTypes = [
        { value: 'VIP', label: 'VIP', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: Star },
        { value: 'Regular', label: 'Regular', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', icon: Users },
        { value: 'Nuevo', label: 'Nuevo', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: UserPlus },
        { value: 'Corporativo', label: 'Corporativo', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Briefcase }
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const CUSTOMERS_PER_PAGE = 25;

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl('/api/customers'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            const customersList = Array.isArray(data) ? data : (data.customers || data.data || []);
            setCustomers(customersList);
        } catch (error) {
            console.error('Error fetching customers:', error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerDetails = async (customerId) => {
        if (!customerId) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/customers/${customerId}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error fetching customer:', response.status, errorData);
                throw new Error(errorData.error || `Error ${response.status}: Cliente no encontrado`);
            }
            const data = await response.json();
            setSelectedCustomer(data);
            setShowDetails(true);
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: error.message || 'Error al cargar detalles del cliente', type: 'error' });
        }
    };

    const fetchBirthdayCustomers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl('/api/customers/birthdays'), {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Error: ' + response.status);
            const data = await response.json();
            const customersList = Array.isArray(data) ? data : (data.customers || data.data || []);
            setBirthdayCustomers(customersList);
            setShowBirthdays(true);
        } catch (error) {
            console.error('[Birthdays] Error:', error);
            showAlert({ title: 'Error', message: 'Error al cargar cumpleaños: ' + error.message, type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = editingCustomer ? buildApiUrl(`/api/customers/${editingCustomer.id}`) : buildApiUrl('/api/customers');
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
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Error al guardar');
            }
            showAlert({ title: 'Éxito', message: editingCustomer ? 'Registro de cliente actualizado' : 'Nuevo cliente indexado', type: 'success' });
            setShowForm(false);
            setEditingCustomer(null);
            resetForm();
            fetchCustomers();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
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
            notes: customer.notes || '',
            birthday: customer.birthday || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (customerId) => {
        const confirmed = await showConfirm({
            title: 'Protocolo de Purga',
            message: '¿Eliminar este cliente de la base de datos? Esta acción es irreversible.',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            const response = await fetch(buildApiUrl(`/api/customers/${customerId}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Error al eliminar');
            showAlert({ title: 'Purga Completada', message: 'Registro de cliente eliminado satisfactoriamente', type: 'success' });
            fetchCustomers();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const excelData = new FormData();
        excelData.append('file', file);
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl('/api/customers/import'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: excelData
            });
            const result = await response.json();
            if (response.ok) {
                showAlert({
                    title: 'Importación Exitosa',
                    message: `Sincronizados: ${result.created} nuevos, ${result.updated} actualizados. Errores: ${result.errors}.`,
                    type: 'success'
                });
                fetchCustomers();
            } else {
                throw new Error(result.error || 'Fallo en la importación de datos');
            }
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleDownloadTemplate = () => {
        try {
            const headers = [['Nombre Completo', 'Cedula/NIT', 'Email', 'Telefono', 'Direccion', 'Tipo de Cliente', 'Notas']];
            const dummyData = [['Juan Perez', '12345678', 'juan@ejemplo.com', '5551234', 'Calle 123', 'Regular', 'Cliente frecuente']];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([...headers, ...dummyData]);
            XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
            XLSX.writeFile(wb, 'plantilla_clientes_lbdc.xlsx');
        } catch (error) {
            console.error('[Template] Error:', error);
            showAlert({ title: 'Error', message: 'No se pudo descargar la plantilla', type: 'error' });
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl('/api/customers/export'), {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allCustomers = await response.json();
            const customersList = Array.isArray(allCustomers) ? allCustomers : (allCustomers.customers || allCustomers.data || []);
            
            if (customersList.length === 0) {
                showAlert({ title: 'Advertencia', message: 'No hay clientes para exportar', type: 'warning' });
                setLoading(false);
                return;
            }
            
            const dataToExport = customersList.map(c => ({
                ID: c.id,
                Nombre: c.name || '',
                'Cedula/NIT': c.idNumber || '',
                Email: c.email || '',
                Telefono: c.phone || '',
                Direccion: c.address || '',
                Tipo: c.customerType || 'Regular',
                'Total Gastado': c.totalSpent || 0,
                'Ultima Visita': c.lastVisit || '',
                Notas: c.notes || ''
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
            XLSX.writeFile(wb, `LBDC_CUSTOMERS_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('[Export] Error:', error);
            showAlert({ title: 'Error', message: 'No se pudo exportar el listado de clientes: ' + error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', idNumber: '', customerType: 'Regular', notes: '', birthday: '' });
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * CUSTOMERS_PER_PAGE, currentPage * CUSTOMERS_PER_PAGE);

    const getTypeInfo = (type) => {
        return customerTypes.find(t => t.value === type) || customerTypes[1];
    };

    return (
        <AdminLayout title="Centro de Clientes">
            <div className="space-y-10 pb-32">
                
                {/* KPIs Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <motion.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Database</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{customers.length}</p>
                        </div>
                        <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all"><Users className="w-6 h-6" /></div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">VIP Priority</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{customers.filter(c => c.customerType === 'VIP').length}</p>
                        </div>
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Star className="w-6 h-6" /></div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Corporate Accounts</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{customers.filter(c => c.customerType === 'Corporativo').length}</p>
                        </div>
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all"><Briefcase className="w-6 h-6" /></div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Activation Rate</p>
                            <p className="text-4xl font-black text-white tracking-tighter leading-none">94.2%</p>
                        </div>
                        <div className="p-4 bg-white/10 text-white rounded-2xl group-hover:bg-emerald-500 transition-all"><Zap className="w-6 h-6" /></div>
                    </motion.div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre, email, teléfono o documento..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchBirthdayCustomers} className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Cumpleaños
                            </button>
                            {canModify && (
                                <>
                                    <label className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer hover:bg-emerald-600 transition-all">
                                        <Upload className="w-4 h-4" /> Importar
                                        <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                                    </label>
                                    <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-all">
                                        <Download className="w-4 h-4" /> Plantilla
                                    </button>
                                    <button onClick={handleExportExcel} className="px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-all">
                                        <FileDown className="w-4 h-4" /> Exportar
                                    </button>
                                </>
                            )}
                            {canModify && (
                                <button onClick={() => { setEditingCustomer(null); resetForm(); setShowForm(true); }} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Nuevo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">#</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Nombre</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Teléfono</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Tipo</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Total Gastado</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Cumpleaños</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Documento</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="9" className="px-3 py-8 text-center text-gray-500 text-sm">Cargando...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan="9" className="px-3 py-8 text-center text-gray-500 text-sm">No hay clientes</td></tr>
                            ) : paginatedCustomers.map((customer, i) => {
                                const type = getTypeInfo(customer.customerType);
                                return (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fetchCustomerDetails(customer.id)}>
                                        <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                                        <td className="px-3 py-2">
                                            <div>
                                                <span className="font-medium text-gray-900 text-sm">{customer.name}</span>
                                                <span className="ml-2 text-xs text-gray-400">#{customer.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 text-xs">{customer.phone || '-'}</td>
                                        <td className="px-3 py-2 text-gray-600 text-xs truncate max-w-[150px]">{customer.email || '-'}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${type.color.split(' ')[1]} ${type.color.split(' ')[0]}`}>
                                                {customer.customerType}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 text-xs">
                                            {customer.totalSpent ? `$${Number(customer.totalSpent).toLocaleString('es-CO')}` : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 text-xs">
                                            {customer.birthday ? new Date(customer.birthday).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500 text-xs">{customer.idNumber || '-'}</td>
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(customer); }} className="text-blue-600 hover:text-blue-800 p-1">
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }} className="text-red-600 hover:text-red-800 p-1">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
                        >
                            ←
                        </button>
                        <span className="px-3 py-1 text-xs text-gray-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-xs text-gray-400">
                    Mostrando {paginatedCustomers.length} de {filteredCustomers.length} cliente(s)
                </div>

                {/* Profile Detail Modal */}
                <PortalWrapper isOpen={showDetails && selectedCustomer}>
                    {showDetails && selectedCustomer && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                                className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative border border-slate-200"
                            >
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{selectedCustomer.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeInfo(selectedCustomer.customerType).color.split(' ')[1]} ${getTypeInfo(selectedCustomer.customerType).color.split(' ')[0]}`}>
                                                    {selectedCustomer.customerType}
                                                </span>
                                                <span className="text-[10px] text-slate-400">#{selectedCustomer.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDetails(false)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 custom-scrollbar p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos de Contacto</h4>
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Phone className="w-3 h-3" />
                                                    <span className="text-xs">{selectedCustomer.phone || 'No registrado'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-xs">{selectedCustomer.email || 'No registrado'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="text-xs">{selectedCustomer.address || 'No registrado'}</span>
                                                </div>
                                            </div>

                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Identificación</h4>
                                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                <p className="text-xs text-slate-400">Documento</p>
                                                <p className="text-sm font-medium text-slate-900">{selectedCustomer.idNumber || 'No registrado'}</p>
                                            </div>

                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Información Adicional</h4>
                                            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-400">Cumpleaños</span>
                                                    <span className="text-xs font-medium text-slate-900">
                                                        {selectedCustomer.birthday ? new Date(selectedCustomer.birthday).toLocaleDateString('es-CO') : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-400">Total Gastado</span>
                                                    <span className="text-xs font-medium text-slate-900">
                                                        ${Number(selectedCustomer.totalSpent || 0).toLocaleString('es-CO')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-400">Última Compra</span>
                                                    <span className="text-xs font-medium text-slate-900">
                                                        {selectedCustomer.lastPurchaseDate ? new Date(selectedCustomer.lastPurchaseDate).toLocaleDateString('es-CO') : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Servicios Técnicos</h4>
                                            {selectedCustomer.tickets && selectedCustomer.tickets.length > 0 ? (
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {selectedCustomer.tickets.map(ticket => (
                                                        <div 
                                                            key={ticket.id} 
                                                            onClick={() => { setShowDetails(false); navigate(`/admin/tech-service?ticket=${ticket.id}`); }}
                                                            className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                                                        >
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-medium text-slate-900">#{ticket.id} - {ticket.brand} {ticket.model}</span>
                                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ticket.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                        {ticket.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 italic mt-1">{ticket.issueDescription}</p>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-200 text-center">
                                                    <p className="text-xs text-slate-400">Sin servicios técnicos registrados</p>
                                                </div>
                                            )}

                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Notas</h4>
                                            <div className="bg-slate-900 p-3 rounded-lg text-xs text-slate-300 min-h-[60px] italic">
                                                {selectedCustomer.notes || 'Sin notas registradas'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </PortalWrapper>

                {/* Form Intake Modal */}
                <PortalWrapper isOpen={showForm}>
                    {showForm && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200"
                            >
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                        {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                                    </h3>
                                    <button onClick={() => { setShowForm(false); setEditingCustomer(null); resetForm(); }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-4 custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre Completo *</label>
                                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Teléfono</label>
                                            <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Documento (CC/NIT)</label>
                                            <input value={formData.idNumber} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Tipo de Cliente</label>
                                            <select value={formData.customerType} onChange={e => setFormData({ ...formData, customerType: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none">
                                                {customerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Fecha de Nacimiento</label>
                                            <input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Dirección</label>
                                            <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-medium text-slate-500 mb-1 block">Notas</label>
                                            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows="2" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-slate-900 transition-all outline-none" />
                                        </div>

                                        <div className="md:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
                                            <button type="button" onClick={() => { setShowForm(false); setEditingCustomer(null); resetForm(); }} className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
                                            <button type="submit" className="px-6 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-all">{editingCustomer ? 'Guardar' : 'Crear'}</button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </PortalWrapper>

                {/* Info Overlay */}
                <AnimatePresence>
                    {showInstructions && (
                        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white overflow-hidden p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="font-black text-2xl tracking-tighter flex items-center gap-4">
                                        <Info className="w-8 h-8 text-indigo-600" /> Identity Indexing Rules
                                    </h3>
                                    <button onClick={() => setShowInstructions(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                                </div>
                                <div className="space-y-8">
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">El motor de ingesta de datos requiere un mapeo específico para garantizar la integridad de la base de datos industrial de LBDC.</p>
                                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Atributos Permitidos (Columnas):</h4>
                                        <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Nombre</div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Cédula/NIT</div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Email</div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Teléfono</div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Dirección</div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100"><ShieldCheck className="w-3 h-3 text-emerald-500" /> VIP (S/N)</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowInstructions(false)} className="w-full h-16 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all">Confirmar Lectura</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Birthday Customers Modal */}
                <PortalWrapper isOpen={showBirthdays}>
                    {showBirthdays && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[80vh] flex flex-col border border-slate-200"
                            >
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-amber-500" />
                                        Cumpleaños del Mes
                                    </h3>
                                    <button onClick={() => setShowBirthdays(false)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-4 custom-scrollbar">
                                    {birthdayCustomers.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <p className="text-sm">No hay cumpleaños este mes</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-500 mb-3">{birthdayCustomers.length} cliente(s) cumplen años este mes</p>
                                            <div className="space-y-2">
                                                {birthdayCustomers.map((customer) => (
                                                    <div key={customer.id} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                                                <Calendar className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                                                                <p className="text-[10px] text-slate-400">{customer.phone || customer.email || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-bold text-amber-500">{customer.birthdayDay}</p>
                                                            <p className="text-[9px] text-slate-400 uppercase">{new Date().toLocaleString('es-CO', { month: 'short' })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </PortalWrapper>

            </div>
        </AdminLayout>
    );
};

export default AdminCustomers;
