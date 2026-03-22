import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { orderService } from '../../services/orderService';
import { Search, Filter, MoreVertical, CreditCard, Smartphone } from 'lucide-react';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [loading, setLoading] = useState(true);

    const statusColors = {
        'Pendiente': 'bg-yellow-100 text-yellow-700',
        'Pagado': 'bg-blue-100 text-blue-700',
        'Enviado': 'bg-purple-100 text-purple-700',
        'Entregado': 'bg-green-100 text-green-700',
        'Cancelado': 'bg-red-100 text-red-700',
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (statusFilter === 'Todos') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(o => o.status === statusFilter));
        }
    }, [statusFilter, orders]);

    const fetchOrders = async () => {
        const data = await orderService.getOrders();
        setOrders(data);
        setLoading(false);
    };

    const handleStatusChange = async (id, newStatus) => {
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        await orderService.updateOrderStatus(id, newStatus);
    };

    return (
        <AdminLayout title="Gestión de Pedidos">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">

                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, ID o monto..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['Todos', 'Pendiente', 'Pagado', 'Enviado'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-6">ID Pedido</th>
                                <th className="p-6">Cliente</th>
                                <th className="p-6">Fecha</th>
                                <th className="p-6">Total</th>
                                <th className="p-6">Pago</th>
                                <th className="p-6">Estado</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-gray-500">Cargando pedidos...</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-6 font-bold text-gray-900">
                                        #{order.id}
                                    </td>
                                    <td className="p-6">
                                        <p className="font-bold text-gray-900">{order.customer}</p>
                                        <p className="text-xs text-gray-500">{order.items} artículos</p>
                                    </td>
                                    <td className="p-6 text-gray-600 text-sm">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-6 font-mono text-sm">
                                        ${order.total.toLocaleString()}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            {order.paymentMethod === 'Tarjeta' ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                                            {order.paymentMethod}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-100'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right relative group">
                                        <button className="text-gray-400 hover:text-black">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>

                                        {/* Dropdown for demo status change - visible on hover or with lg peer */}
                                        <div className="absolute right-6 top-10 hidden group-hover:block lg:group-hover:block w-40 bg-white shadow-xl rounded-lg border border-gray-100 z-10 p-2">
                                            <p className="text-xs text-gray-400 px-2 py-1 mb-1">CAMBIAR ESTADO</p>
                                            {orders && ['Pagado', 'Enviado', 'Entregado'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleStatusChange(order.id, s)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded text-gray-700"
                                                >
                                                    Marcar {s}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminOrders;
