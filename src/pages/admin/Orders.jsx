import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { orderService } from '../../services/orderService';
import { 
    Search, Filter, MoreVertical, CreditCard, Smartphone, 
    ShoppingBag, Clock, CheckCircle, Truck, XCircle, 
    TrendingUp, ArrowUpRight, ArrowDownRight, Eye, 
    MoreHorizontal, Printer, Mail, Trash2, ChevronRight,
    Package, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PortalWrapper from '../../components/PortalWrapper';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const styles = {
        'Pendiente': 'bg-amber-100 text-amber-700 border-amber-200',
        'Pagado': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Enviado': 'bg-purple-100 text-purple-700 border-purple-200',
        'Entregado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Cancelado': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] border font-black uppercase tracking-widest ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {status}
        </span>
    );
};

const OrderStat = ({ label, value, icon: _Icon, trend, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-sm flex items-center justify-between group"
    >
        <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
            <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
                {trend && (
                    <span className={`flex items-center text-[10px] font-black ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
        <div className={`p-5 rounded-3xl ${color} bg-opacity-10 transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-sm`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
    </motion.div>
);

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        let result = (orders || []);
        if (statusFilter !== 'Todos') {
            result = result.filter(o => o.status === statusFilter);
        }
        if (searchTerm) {
            result = result.filter(o => 
                o.id.toString().includes(searchTerm) || 
                o.customer.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredOrders(result);
    }, [statusFilter, orders, searchTerm]);

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

    const handleStatusChange = async (id, newStatus) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        await orderService.updateOrderStatus(id, newStatus);
    };

    const handleExportExcel = async () => {
        try {
            const allOrders = await orderService.exportOrders({
                status: statusFilter !== 'Todos' ? statusFilter : null
            });

            if (!allOrders || allOrders.length === 0) {
                alert('No hay datos para exportar');
                return;
            }

            const exportData = allOrders.map(order => ({
                'ID Pedido': order.orderNumber || order.id,
                'Cliente': order.customerName || order.customer,
                'Email': order.customerEmail || '',
                'Teléfono': order.customerPhone || '',
                'Total': order.total,
                'Subtotal': order.subtotal || 0,
                'Descuento': order.discount || 0,
                'Método Pago': order.paymentMethod,
                'Estado': order.status,
                'Fecha': new Date(order.createdAt || order.date).toLocaleString(),
                'Ítems': order.items ? (typeof order.items === 'string' ? order.items : JSON.stringify(order.items)) : 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

            // Add some column widths
            const wscols = [
                { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, 
                { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
                { wch: 15 }, { wch: 20 }, { wch: 40 }
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Reporte_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error al generar el reporte de Excel');
        }
    };

    const stats = {
        total: orders.length,
        revenue: orders.filter(o => o.status !== 'Cancelado').reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        pending: orders.filter(o => o.status === 'Pendiente').length,
        growth: 12.5 // Mock growth
    };

    return (
        <AdminLayout title="Gestión de Pedidos y Ventas">
            <div className="space-y-10 pb-32">
                
                {/* Metrics Hub */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <OrderStat label="Volumen Total" value={stats.total} icon={Package} color="bg-indigo-600" trend={8.4} />
                    <OrderStat label="Facturación" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-600" trend={12.5} />
                    <OrderStat label="Pendientes" value={stats.pending} icon={Clock} color="bg-amber-600" trend={-2.1} />
                    <OrderStat label="Cumplimiento" value="98.2%" icon={CheckCircle} color="bg-slate-900" />
                </div>

                {/* Main Command Panel */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-white shadow-[0_32px_128px_rgba(0,0,0,0.05)]">
                    
                    {/* Header & Controls */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex bg-slate-100/50 p-2 rounded-[1.5rem] border border-slate-100 w-full lg:w-auto overflow-x-auto">
                            {['Todos', 'Pendiente', 'Pagado', 'Enviado', 'Entregado'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full sm:w-auto"
                            >
                                <Download className="w-4 h-4" />
                                Exportar Excel
                            </button>

                            <div className="relative w-full lg:w-96 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="ID Pedido o Cliente..."
                                    className="w-full h-14 pl-16 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Unified Ledger Table */}
                    <div className="overflow-x-auto -mx-10 px-10">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">
                                    <th className="p-8">UID</th>
                                    <th className="p-8">Identidad Cliente</th>
                                    <th className="p-8">Logística</th>
                                    <th className="p-8">Valor Final</th>
                                    <th className="p-8 text-right">Comandos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-20 text-center text-slate-300 italic">Sincronizando registros...</td></tr>
                                ) : filteredOrders.map((order, i) => (
                                    <motion.tr 
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-indigo-50/20 group transition-all"
                                    >
                                        <td className="p-8">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-black text-slate-900 tracking-tighter">#{order.id.toString().padStart(5, '0')}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(order.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 tracking-tight text-sm leading-none mb-1">{order.customer}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.items} sku units</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <StatusBadge status={order.status} />
                                            <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-400 uppercase">
                                                {order.paymentMethod === 'Tarjeta' ? <CreditCard className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                                {order.paymentMethod} • Gateway
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <div className="text-sm font-black text-slate-900 tracking-tight">${Number(order.total).toLocaleString()}</div>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-[70%]" />
                                            </div>
                                        </td>
                                        <td className="p-8 text-right relative">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setSelectedOrder(order)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <div className="relative group/menu">
                                                    <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-4 w-56 bg-slate-900 text-white shadow-2xl rounded-[1.5rem] border border-white/10 z-[50] p-4 opacity-0 scale-95 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:scale-100 group-hover/menu:pointer-events-auto transition-all origin-top-right">
                                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">Workflow Action</p>
                                                        {['Pagado', 'Enviado', 'Entregado', 'Cancelado'].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleStatusChange(order.id, s)}
                                                                className="w-full text-left p-3 text-[11px] font-black rounded-xl hover:bg-white/10 flex items-center justify-between group/item uppercase tracking-widest transition-colors"
                                                            >
                                                                {s}
                                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover/item:text-white transition-transform transform translate-x-0 group-hover/item:translate-x-1" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Modal */}
                <PortalWrapper isOpen={selectedOrder !== null}>
                    {selectedOrder && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-12 bg-slate-900/60 backdrop-blur-xl">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                                className="bg-white rounded-[4rem] w-full max-w-4xl shadow-[0_64px_256px_rgba(0,0,0,0.4)] overflow-hidden relative border border-white"
                            >
                                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white">
                                            <Package className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Pedido #{selectedOrder.id}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <StatusBadge status={selectedOrder.status} />
                                                <span className="text-[10px] font-bold text-slate-400 italic">Auth UID: {(selectedOrder.customer || '').substring(0,3).toUpperCase()}-{selectedOrder.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedOrder(null)} className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-10">
                                        <section>
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Detalle Logístico</h4>
                                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
                                                    <span className="text-xs font-black text-slate-900">{selectedOrder.status}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método Pago</span>
                                                    <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                                                        <CreditCard className="w-4 h-4" /> {selectedOrder.paymentMethod}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítems</span>
                                                    <span className="text-xs font-black text-slate-900">{selectedOrder.items} Unidades</span>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-indigo-600/5 p-8 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6">
                                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                                <Printer className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Terminal de Impresión</p>
                                                <p className="text-sm font-bold text-slate-900 leading-tight">Generar Factura Legal (PDF)</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-indigo-300" />
                                        </section>
                                    </div>

                                    <div className="space-y-10">
                                        <section>
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Auditoría Visual</h4>
                                            <div className="aspect-video bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex items-center justify-center text-white/5 group">
                                                <Package className="w-24 h-24 absolute group-hover:scale-110 group-hover:opacity-10 transition-all" />
                                                <div className="relative z-10 text-center">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Hardware Evidence</p>
                                                    <p className="text-[9px] font-bold text-white/10 uppercase mt-1">S/N: {selectedOrder.id || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="bg-slate-950 p-10 rounded-[2.5rem] shadow-2xl text-white">
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Transacción</p>
                                            <h5 className="text-5xl font-black tracking-tighter leading-none">${Number(selectedOrder.total).toLocaleString()}</h5>
                                            <button className="w-full h-16 bg-white text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] mt-10 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-95">NOTIFICAR CLIENTE</button>
                                        </div>
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
