import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { orderService } from '../../services/orderService';
import { Search, Eye, MoreVertical, Download, Package, DollarSign, Clock, CheckCircle, Pencil, Trash2, FileText, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import PortalWrapper from '../../components/PortalWrapper';
import * as XLSX from 'xlsx';
import { useModal } from '../../context/ModalContext';

const StatusBadge = ({ status }) => {
    const styles = {
        'Pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
        'Pagado': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Enviado': 'bg-purple-100 text-purple-700 border-purple-200',
        'Entregado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Cancelado': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return (
        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {status}
        </span>
    );
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const { showAlert, showConfirm } = useModal();

    useEffect(() => { fetchOrders(); }, []);

    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await orderService.getOrders();
            const ordersList = Array.isArray(data) ? data : (data.orders || data.data || []);
            setOrders(ordersList);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchSearch = !searchTerm || 
            (order.customerName || order.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.id || '').toString().includes(searchTerm);
        const matchStatus = !statusFilter || order.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pendiente').length,
        completed: orders.filter(o => o.status === 'Entregado').length,
        revenue: orders.filter(o => o.status !== 'Cancelado').reduce((s, o) => s + Number(o.total || 0), 0)
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await orderService.updateOrderStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
            showAlert({ title: 'Éxito', message: 'Estado actualizado', type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleDeleteOrder = async (id) => {
        const confirmed = await showConfirm({
            title: 'Eliminar Pedido',
            message: '¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.',
            variant: 'danger'
        });
        if (!confirmed) return;
        try {
            await orderService.deleteOrder(id);
            setOrders(prev => prev.filter(o => o.id !== id));
            showAlert({ title: 'Eliminado', message: 'Pedido eliminado correctamente', type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error', message: error.message, type: 'error' });
        }
    };

    const handleSendEmail = (order) => {
        if (order.customerEmail) {
            window.location.href = `mailto:${order.customerEmail}?subject=Pedido #${order.id}`;
        }
    };

    const handleExportExcel = async () => {
        try {
            const exportData = filteredOrders.map(order => ({
                'ID': order.id,
                'Cliente': order.customerName || order.customer,
                'Email': order.customerEmail || '',
                'Teléfono': order.customerPhone || '',
                'Total': order.total,
                'Método Pago': order.paymentMethod,
                'Estado': order.status,
                'Fecha': new Date(order.createdAt || order.date).toLocaleDateString()
            }));
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');
            XLSX.writeFile(workbook, `Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar', type: 'error' });
        }
    };

    return (
        <AdminLayout title="Gestión de Pedidos" fullWidth>
            <div className="space-y-10 pb-32">
                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <motion.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stats.total}</p>
                        </div>
                        <div className="p-4 bg-slate-100 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all"><Package className="w-6 h-6" /></div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Pendientes</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stats.pending}</p>
                        </div>
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all"><Clock className="w-6 h-6" /></div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Completados</p>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stats.completed}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><CheckCircle className="w-6 h-6" /></div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex items-center justify-between group">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Ingresos</p>
                            <p className="text-3xl font-black text-white tracking-tighter leading-none">${stats.revenue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white/10 text-white rounded-2xl group-hover:bg-emerald-500 transition-all"><DollarSign className="w-6 h-6" /></div>
                    </motion.div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar pedidos..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                            >
                                <option value="">Estado</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                            <button 
                                onClick={handleExportExcel}
                                className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-600 transition-all"
                            >
                                <Download className="w-4 h-4" /> Exportar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">#</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Pedido</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Cliente</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Total</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Fecha</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="8" className="px-3 py-8 text-center text-gray-500 text-sm">Cargando...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="8" className="px-3 py-8 text-center text-gray-500 text-sm">No hay pedidos</td></tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 text-gray-400 text-xs">#{order.id}</td>
                                        <td className="px-3 py-2"><span className="font-medium text-sm">{order.orderNumber || `#${order.id}`}</span></td>
                                        <td className="px-3 py-2">
                                            <span className="font-medium text-gray-900 text-sm">{order.customerName || order.customer}</span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-500 truncate max-w-[150px]">{order.customerEmail || '-'}</td>
                                        <td className="px-3 py-2"><span className="font-bold text-sm">${Number(order.total || 0).toLocaleString()}</span></td>
                                        <td className="px-3 py-2"><StatusBadge status={order.status} /></td>
                                        <td className="px-3 py-2 text-xs text-gray-400">{new Date(order.createdAt || order.date).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 text-right relative">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Ver detalles"><Eye className="w-4 h-4 text-gray-400" /></button>
                                                <div className="relative group/menu">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownId(openDropdownId === order.id ? null : order.id);
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Más opciones"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
                                                    <div className={`absolute right-0 top-full mt-1 w-48 bg-white shadow-lg rounded-lg border border-gray-100 z-[100] transition-all ${openDropdownId === order.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                                                        <div className="p-1">
                                                            <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Cambiar Estado</p>
                                                            {['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'].map(s => (
                                                                <button key={s} onClick={() => handleStatusChange(order.id, s)} className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2 ${order.status === s ? 'bg-gray-100 font-bold' : ''}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${s === 'Pendiente' ? 'bg-amber-500' : s === 'Pagado' ? 'bg-indigo-500' : s === 'Enviado' ? 'bg-purple-500' : s === 'Entregado' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                                    {s}
                                                                </button>
                                                            ))}
                                                            <div className="border-t border-gray-100 my-1"></div>
                                                            <button onClick={() => handleSendEmail(order)} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2 text-gray-700">
                                                                <Mail className="w-4 h-4" /> Enviar Email
                                                            </button>
                                                            <button onClick={() => setSelectedOrder(order)} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2 text-gray-700">
                                                                <FileText className="w-4 h-4" /> Ver Detalles
                                                            </button>
                                                            <div className="border-t border-gray-100 my-1"></div>
                                                            <button onClick={() => handleDeleteOrder(order.id)} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-red-50 flex items-center gap-2 text-red-600">
                                                                <Trash2 className="w-4 h-4" /> Eliminar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <PortalWrapper isOpen={selectedOrder !== null}>
                    {selectedOrder && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">Pedido #{selectedOrder.id}</h3>
                                        <p className="text-xs text-gray-500">{new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg"><span className="text-2xl text-gray-400">&times;</span></button>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-gray-50 rounded"><span className="text-xs font-bold text-gray-500">Cliente</span><span className="text-xs">{selectedOrder.customerName || selectedOrder.customer}</span></div>
                                        <div className="flex justify-between p-2 bg-gray-50 rounded"><span className="text-xs font-bold text-gray-500">Email</span><span className="text-xs">{selectedOrder.customerEmail || '-'}</span></div>
                                        <div className="flex justify-between p-2 bg-gray-50 rounded"><span className="text-xs font-bold text-gray-500">Teléfono</span><span className="text-xs">{selectedOrder.customerPhone || '-'}</span></div>
                                        <div className="flex justify-between p-2 bg-gray-50 rounded"><span className="text-xs font-bold text-gray-500">Método</span><span className="text-xs">{selectedOrder.paymentMethod || '-'}</span></div>
                                        <div className="flex justify-between p-2 bg-gray-50 rounded"><span className="text-xs font-bold text-gray-500">Estado</span><StatusBadge status={selectedOrder.status} /></div>
                                        <div className="flex justify-between p-2 bg-indigo-50 rounded"><span className="text-xs font-bold text-indigo-600">Total</span><span className="text-lg font-black text-indigo-600">${Number(selectedOrder.total || 0).toLocaleString()}</span></div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cambiar Estado</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'].map(s => (
                                                <button key={s} onClick={() => { handleStatusChange(selectedOrder.id, s); setSelectedOrder({ ...selectedOrder, status: s }); }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedOrder.status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => handleSendEmail(selectedOrder)} className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-all">
                                            <Mail className="w-4 h-4" /> Enviar Email
                                        </button>
                                        <button onClick={() => { handleDeleteOrder(selectedOrder.id); setSelectedOrder(null); }} className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 transition-all">
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </PortalWrapper>
            </div>
        </AdminLayout>
    );
};

export default AdminOrders;
