import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useNavigate } from 'react-router-dom';
import { 
    DollarSign, ShoppingBag, Clock, TrendingUp, Users, 
    UserCircle, Wrench, Package, AlertTriangle, CheckCircle,
    Activity, Sparkles, ArrowUp, ArrowDown, ShieldCheck,
    RefreshCw, Zap
} from 'lucide-react';
import { buildApiUrl } from '../../config/config';
import { motion, AnimatePresence } from 'framer-motion';

const GlassCard = ({ children, className = "", delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className={`bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 ${className}`}
    >
        {children}
    </motion.div>
);

const PremiumStatCard = ({ title, value, subtext, icon: Icon, color, trend, delay = 0 }) => {
    const colorMap = {
        green: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-100",
        blue: "from-blue-500/20 to-blue-500/5 text-blue-600 border-blue-100",
        purple: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 border-indigo-100",
        orange: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-100",
        red: "from-rose-500/20 to-rose-500/5 text-rose-600 border-rose-100",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, type: "spring" }}
            className={`relative overflow-hidden group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color].split(' ')[0]} -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-gray-500 text-[10px] font-black tracking-widest uppercase">{title}</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    <div className="flex items-center gap-2">
                        {trend && (
                            <span className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {trend > 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{subtext}</p>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-6 h-6 stroke-[2.5px]" />
                </div>
            </div>
        </motion.div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userRole = adminUser.role;

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
    const [refreshing, setRefreshing] = useState(false);
    const [serverOnline, setServerOnline] = useState(true);

    useEffect(() => {
        if (userRole === 'técnico') {
            navigate('/admin/tech-service');
            return;
        }
        fetchDashboardData();
    }, [userRole, navigate]);

    const fetchDashboardData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const safeFetch = async (url) => {
                try {
                    const res = await fetch(buildApiUrl(url), { headers });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.json();
                } catch (e) {
                    console.warn(`[DASHBOARD] Failed to fetch ${url}:`, e.message);
                    return { data: [], ok: false };
                }
            };

            const [usersData, customersData, ticketsData, productsData, ordersData] = await Promise.all([
                safeFetch('/api/users'),
                safeFetch('/api/customers'),
                safeFetch('/api/tickets'),
                safeFetch('/api/products'),
                safeFetch('/api/orders')
            ]);

            const users = Array.isArray(usersData) ? usersData : (usersData.users || usersData.data || []);
            const customers = Array.isArray(customersData) ? customersData : (customersData.customers || customersData.data || []);
            const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData.tickets || ticketsData.data || []);
            const products = Array.isArray(productsData) ? productsData : (productsData.products || productsData.data || []);
            const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || ordersData.data || []);

            const ticketsPending = tickets.filter(t => ['RECEIVED', 'DIAGNOSED'].includes(t.status)).length;
            const lowStock = products.filter(p => p.stock < 10).length;
            const activeOrders = ordersList.filter(o => o.status !== 'Cancelado');
            const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);

            setStats({
                users: users.filter(u => u.active).length,
                customers: customers.length,
                tickets: tickets.length,
                ticketsPending,
                products: products.length,
                lowStock,
                orders: ordersList.length,
                revenue: totalRevenue
            });

            setRecentTickets(tickets.slice(0, 8));
            setServerOnline(true);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setServerOnline(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(value || 0);
    };

    if (loading) {
        return (
            <AdminLayout title="Terminal LBDC">
                <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                    <motion.div 
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="p-5 bg-indigo-50 rounded-3xl text-indigo-600 shadow-xl shadow-indigo-100/50 border border-indigo-100"
                    >
                        <Zap className="w-12 h-12 fill-indigo-600" />
                    </motion.div>
                    <p className="text-gray-400 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Cargando núcleo operativo...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Panel de Control Central">
            <div className="max-w-[1600px] mx-auto space-y-8 pb-12 animate-fade-in">
                
                {/* Dashboard Control Bar */}
                <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                                Dashboard Central
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{serverOnline ? 'Online' : 'Offline'}</span>
                                </div>
                            </h1>
                        </div>
                        <p className="text-gray-400 font-bold text-sm flex items-center gap-2">
                            Módulo de gestión integral y auditoría de procesos
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                         <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Operador Activo</p>
                                <p className="text-xs font-black text-gray-700 leading-none">{adminUser.name || 'Admin User'}</p>
                            </div>
                            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">
                                {adminUser.name?.charAt(0) || 'A'}
                            </div>
                         </div>
                         <button 
                            onClick={() => fetchDashboardData(true)}
                            disabled={refreshing}
                            className={`p-3 rounded-2xl transition-all duration-300 ${refreshing ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 shadow-sm'}`}
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Primary KPI Mesh */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumStatCard
                        title="Personal Activo"
                        value={stats.users}
                        subtext="Operadores verificados"
                        icon={Users}
                        color="purple"
                        delay={0.1}
                    />
                    <PremiumStatCard
                        title="Cartera CRM"
                        value={stats.customers}
                        subtext="Registros comerciales"
                        icon={UserCircle}
                        color="blue"
                        trend={15}
                        delay={0.2}
                    />
                    <PremiumStatCard
                        title="Tickets Operativos"
                        value={stats.tickets}
                        subtext={`${stats.ticketsPending} requieren diagnóstico`}
                        icon={Wrench}
                        color={stats.ticketsPending > 5 ? 'orange' : 'green'}
                        delay={0.3}
                    />
                    <PremiumStatCard
                        title="Patrimonio Inventario"
                        value={formatCurrency(stats.revenue)}
                        subtext="Valoración de stock"
                        icon={Package}
                        color={stats.lowStock > 0 ? 'red' : 'green'}
                        trend={-2}
                        delay={0.4}
                    />
                </div>

                {/* Analytical Matrices */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Activity Feed / Recent Tickets */}
                    <GlassCard className="lg:col-span-2 flex flex-col" delay={0.5}>
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Registro de Servicios</h3>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Últimos tickets procesados</p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/admin/tech-service')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">
                                Ver Todo
                            </button>
                        </div>
                        <div className="p-8 space-y-4 max-h-[500px] overflow-auto scroll-premium">
                            {recentTickets.length === 0 ? (
                                <div className="py-20 text-center opacity-30">
                                    <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <p className="font-black uppercase text-xs tracking-widest text-gray-500">Sin actividad reciente</p>
                                </div>
                            ) : (
                                recentTickets.map((ticket, idx) => (
                                    <motion.div 
                                        key={ticket.id}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 + (idx * 0.05) }}
                                        className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 shadow-sm"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-xs border shadow-inner ${
                                            ticket.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            ticket.status === 'READY' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            ticket.status === 'REPAIRING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        }`}>
                                            <span className="text-[8px] opacity-50 uppercase tracking-tighter">ID</span>
                                            {ticket.id}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-gray-800 text-sm truncate uppercase tracking-tight">{ticket.clientName}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                {ticket.deviceType} {ticket.brand} <span className="mx-1">•</span> {ticket.status}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                {new Date(ticket.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </div>
                                            {ticket.estimatedCost > 0 && (
                                                <p className="text-[10px] font-black text-indigo-600">{formatCurrency(ticket.estimatedCost)}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </GlassCard>

                    {/* Industrial Logic Column */}
                    <div className="space-y-8">
                        
                        {/* Rapid Action Module */}
                        <GlassCard className="p-8 border-none bg-gray-900 text-white shadow-2xl shadow-black/20" delay={0.6}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-indigo-500 rounded-xl">
                                    <Zap className="w-5 h-5 fill-white text-white" />
                                </div>
                                <h3 className="font-black uppercase text-sm tracking-widest">Accesos Rápidos</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: 'Ecosistema Usuarios', path: '/admin/users', icon: Users, color: 'hover:bg-purple-500/10 hover:text-purple-400' },
                                    { label: 'Matriz de Clientes', path: '/admin/customers', icon: UserCircle, color: 'hover:bg-blue-500/10 hover:text-blue-400' },
                                    { label: 'Centro de Servicios', path: '/admin/tech-service', icon: Wrench, color: 'hover:bg-amber-500/10 hover:text-amber-400' },
                                    { label: 'Logística Inventario', path: '/admin/inventory', icon: Package, color: 'hover:bg-emerald-500/10 hover:text-emerald-400' },
                                    { label: 'Terminal de Reportes', path: '/admin/reports', icon: TrendingUp, color: 'hover:bg-indigo-500/10 hover:text-indigo-400' }
                                ].map((action, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ x: 5 }}
                                        onClick={() => navigate(action.path)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 text-left ${action.color}`}
                                    >
                                        <action.icon className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{action.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Critical Alerts Mesh */}
                        <GlassCard className="p-8" delay={0.7}>
                             <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Alertas de Sistema</h3>
                            </div>
                            <div className="space-y-3">
                                {stats.lowStock > 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4">
                                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                                            <ShoppingBag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Agotamiento de Stock</h5>
                                            <p className="text-xs font-bold text-rose-600 leading-tight mt-1">{stats.lowStock} productos por debajo del umbral de seguridad.</p>
                                        </div>
                                    </motion.div>
                                )}
                                {stats.ticketsPending > 5 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Saturación Laboral</h5>
                                            <p className="text-xs font-bold text-amber-600 leading-tight mt-1">{stats.ticketsPending} equipos esperando diagnóstico inicial.</p>
                                        </div>
                                    </motion.div>
                                )}
                                {stats.lowStock === 0 && stats.ticketsPending <= 5 && (
                                    <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center">
                                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistemas Integrales OK</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Industrial Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-12 pt-8 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    {[
                        { icon: ShieldCheck, label: 'LBDC Protocolo de Seguridad v2.4' },
                        { icon: Activity, label: 'Flujo de Datos en Tiempo Real' },
                        { icon: Building2, label: 'Infraestructura Empresarial' },
                        { icon: CheckCircle, label: 'Integridad Certificada' }
                    ].map((badge, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {badge.icon && <badge.icon className="w-4 h-4" />}
                            <span className="font-black text-[9px] uppercase tracking-[0.2em]">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

// Mock Building2 if not available
const Building2 = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M15 2h2"/><path d="M15 6h2"/><path d="M15 10h2"/><path d="M15 14h2"/></svg>
);

export default AdminDashboard;
