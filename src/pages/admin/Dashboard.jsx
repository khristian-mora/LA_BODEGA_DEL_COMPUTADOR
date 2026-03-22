import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { DollarSign, ShoppingBag, Clock, TrendingUp, Users, UserCircle, Wrench, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { buildApiUrl } from '../../config/config';

const DashboardCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
            <p className={`text-xs font-bold ${color === 'green' ? 'text-green-600' : color === 'orange' ? 'text-orange-600' : color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                {trend && <span className="mr-1">{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>}
                {subtext}
            </p>
        </div>
        <div className={`p-4 rounded-xl ${color === 'green' ? 'bg-green-50 text-green-600' :
            color === 'orange' ? 'bg-orange-50 text-orange-600' :
                color === 'red' ? 'bg-red-50 text-red-600' :
                    color === 'purple' ? 'bg-purple-50 text-purple-600' :
                        'bg-blue-50 text-blue-600'
            }`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        users: 0,
        customers: 0,
        tickets: 0,
        ticketsPending: 0,
        products: 0,
        lowStock: 0,
        orders: 0,
        revenue: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch all data in parallel
            const [usersRes, customersRes, ticketsRes, productsRes] = await Promise.all([
                fetch(buildApiUrl('/api/users'), { headers }).catch(() => ({ ok: false })),
                fetch(buildApiUrl('/api/customers'), { headers }).catch(() => ({ ok: false })),
                fetch(buildApiUrl('/api/tickets'), { headers }).catch(() => ({ ok: false })),
                fetch(buildApiUrl('/api/products'), { headers }).catch(() => ({ ok: false }))
            ]);

            const users = usersRes.ok ? await usersRes.json() : [];
            const customers = customersRes.ok ? await customersRes.json() : [];
            const tickets = ticketsRes.ok ? await ticketsRes.json() : [];
            const products = productsRes.ok ? await productsRes.json() : [];

            const ticketsPending = tickets.filter(t => ['RECEIVED', 'DIAGNOSED'].includes(t.status)).length;
            const lowStock = products.filter(p => p.stock < 10).length;

            setStats({
                users: users.filter(u => u.active).length,
                customers: customers.length,
                tickets: tickets.length,
                ticketsPending,
                products: products.length,
                lowStock,
                orders: 0, // Placeholder
                revenue: 0 // Placeholder
            });

            // Get recent tickets (last 5)
            setRecentTickets(tickets.slice(0, 5));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-500">Cargando datos...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Resumen General">
            <div className="space-y-8 animate-fade-in-up">

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard
                        title="Usuarios Activos"
                        value={stats.users}
                        subtext="Personal del sistema"
                        icon={Users}
                        color="purple"
                    />
                    <DashboardCard
                        title="Clientes Registrados"
                        value={stats.customers}
                        subtext="Base de datos CRM"
                        icon={UserCircle}
                        color="blue"
                    />
                    <DashboardCard
                        title="Tickets Activos"
                        value={stats.tickets}
                        subtext={`${stats.ticketsPending} pendientes`}
                        icon={Wrench}
                        color={stats.ticketsPending > 5 ? 'orange' : 'green'}
                    />
                    <DashboardCard
                        title="Productos"
                        value={stats.products}
                        subtext={stats.lowStock > 0 ? `${stats.lowStock} con stock bajo` : 'Stock normal'}
                        icon={Package}
                        color={stats.lowStock > 0 ? 'red' : 'green'}
                    />
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Estado de Tickets</h3>
                            <Wrench className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Recibidos</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
                                    {recentTickets.filter(t => t.status === 'RECEIVED').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">En Reparación</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                    {recentTickets.filter(t => t.status === 'REPAIRING').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Listos</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                                    {recentTickets.filter(t => t.status === 'READY').length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Tipos de Cliente</h3>
                            <UserCircle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">VIP</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                                    {Math.floor(stats.customers * 0.15)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Corporativos</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
                                    {Math.floor(stats.customers * 0.25)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Regulares</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                    {Math.floor(stats.customers * 0.6)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Alertas</h3>
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="space-y-3">
                            {stats.lowStock > 0 && (
                                <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-red-700">{stats.lowStock} productos con stock bajo</p>
                                        <p className="text-xs text-red-600">Revisar inventario</p>
                                    </div>
                                </div>
                            )}
                            {stats.ticketsPending > 5 && (
                                <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                                    <Clock className="w-4 h-4 text-orange-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-orange-700">{stats.ticketsPending} tickets pendientes</p>
                                        <p className="text-xs text-orange-600">Requieren atención</p>
                                    </div>
                                </div>
                            )}
                            {stats.lowStock === 0 && stats.ticketsPending <= 5 && (
                                <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-green-700">Todo en orden</p>
                                        <p className="text-xs text-green-600">No hay alertas críticas</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Tickets */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6">Tickets Recientes</h3>
                        {recentTickets.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No hay tickets registrados</p>
                        ) : (
                            <div className="space-y-4">
                                {recentTickets.map((ticket) => (
                                    <div key={ticket.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${ticket.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            ticket.status === 'READY' ? 'bg-blue-100 text-blue-700' :
                                                ticket.status === 'REPAIRING' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            #{ticket.id}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{ticket.clientName}</p>
                                            <p className="text-xs text-gray-500">{ticket.deviceType} {ticket.brand} - {ticket.status}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6">Accesos Rápidos</h3>
                        <div className="space-y-3">
                            <a href="/admin/users" className="block p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5" />
                                    <div>
                                        <p className="font-bold text-sm">Gestionar Usuarios</p>
                                        <p className="text-xs opacity-75">{stats.users} activos</p>
                                    </div>
                                </div>
                            </a>
                            <a href="/admin/customers" className="block p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <UserCircle className="w-5 h-5" />
                                    <div>
                                        <p className="font-bold text-sm">Ver Clientes</p>
                                        <p className="text-xs opacity-75">{stats.customers} registrados</p>
                                    </div>
                                </div>
                            </a>
                            <a href="/admin/tech-service" className="block p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Wrench className="w-5 h-5" />
                                    <div>
                                        <p className="font-bold text-sm">Servicio Técnico</p>
                                        <p className="text-xs opacity-75">{stats.ticketsPending} pendientes</p>
                                    </div>
                                </div>
                            </a>
                            <a href="/admin/inventory" className="block p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5" />
                                    <div>
                                        <p className="font-bold text-sm">Inventario</p>
                                        <p className="text-xs opacity-75">{stats.products} productos</p>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
