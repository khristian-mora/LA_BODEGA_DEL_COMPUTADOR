import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    History, Search, Download, RefreshCw, User, Shield, 
    Settings, ShoppingCart, Users, Box, DollarSign, FileText,
    ChevronLeft, ChevronRight, Filter, Clock, Activity, BarChart3,
    Zap, Sparkles, ArrowUp, ArrowDown, ShieldCheck, Mail, Globe,
    Terminal, Database, Lock, Eye, CheckCircle, AlertTriangle,
    UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';


// Configuración de módulos para la auditoría
const getModuleSettings = (icons) => ({
    'users': { label: 'Usuarios', icon: icons.Users, color: 'purple', gradient: 'from-purple-500/20 to-purple-500/5', text: 'text-purple-600', border: 'border-purple-100' },
    'customers': { label: 'Clientes', icon: icons.UserCircle, color: 'blue', gradient: 'from-blue-500/20 to-blue-500/5', text: 'text-blue-600', border: 'border-blue-100' },
    'tickets': { label: 'Tickets', icon: icons.FileText, color: 'indigo', gradient: 'from-indigo-500/20 to-indigo-500/5', text: 'text-indigo-600', border: 'border-indigo-100' },
    'products': { label: 'Productos', icon: icons.Box, color: 'orange', gradient: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-600', border: 'border-amber-100' },
    'orders': { label: 'Pedidos', icon: icons.ShoppingCart, color: 'emerald', gradient: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-600', border: 'border-emerald-100' },
    'finance': { label: 'Finanzas', icon: icons.DollarSign, color: 'rose', gradient: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-600', border: 'border-rose-100' },
    'settings': { label: 'Sistema', icon: icons.Settings, color: 'slate', gradient: 'from-slate-500/20 to-slate-500/5', text: 'text-slate-600', border: 'border-slate-100' },
    'auth': { label: 'Acceso', icon: icons.Lock, color: 'pink', gradient: 'from-pink-500/20 to-pink-500/5', text: 'text-pink-600', border: 'border-pink-100' },
});

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

const PremiumStatCard = ({ title, value, subtext, icon: _Icon, color, delay = 0 }) => {
    const colorMap = {
        purple: "from-purple-500/20 to-purple-500/5 text-purple-600 border-purple-100",
        blue: "from-blue-500/20 to-blue-500/5 text-blue-600 border-blue-100",
        indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 border-indigo-100",
        amber: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-100",
        emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-100",
        rose: "from-rose-500/20 to-rose-500/5 text-rose-600 border-rose-100",
        slate: "from-slate-500/20 to-slate-500/5 text-slate-600 border-slate-100",
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
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{subtext}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <_Icon className="w-5 h-5 stroke-[2.5px]" />
                </div>
            </div>
        </motion.div>
    );
};

const Audit = () => {
    const { showAlert } = useModal();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('logs');
    const [refreshing, setRefreshing] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;
    
    // Filters
    const [filters, setFilters] = useState({
        module: '',
        action: '',
        userId: '',
        startDate: '',
        endDate: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const moduleConfig = useMemo(() => getModuleSettings({
        Users, UserCircle, FileText, Box, ShoppingCart, DollarSign, Settings, Lock
    }), []);

    const fetchLogs = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const token = localStorage.getItem('adminToken');
        const params = new URLSearchParams({
            page: currentPage,
            limit: limit,
            ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
        });

        try {
            const response = await fetch(buildApiUrl(`/api/audit/logs?${params}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setLogs(data.items || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotalItems(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error('[AUDIT] Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, filters]);

    const fetchStats = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(buildApiUrl('/api/audit/stats'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('[AUDIT] Stats Error:', error);
        }
    }, []);

    const fetchRecentActivity = useCallback(async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(buildApiUrl('/api/audit/recent?limit=15'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRecentActivity(data || []);
            }
        } catch (error) {
            console.error('[AUDIT] Recent Error:', error);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchStats();
        fetchRecentActivity();
    }, [fetchLogs, fetchStats, fetchRecentActivity]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getModuleConfig = (module) => {
        return moduleConfig[module?.toLowerCase()] || { label: module || 'Sistema', icon: Activity, color: 'slate', gradient: 'from-gray-500/20 to-gray-500/5', text: 'text-gray-600', border: 'border-gray-100' };
    };

    const getActionStyle = (action) => {
        const act = action?.toLowerCase();
        if (['create', 'post', 'insert'].includes(act)) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (['update', 'put', 'edit', 'patch'].includes(act)) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (['delete', 'remove'].includes(act)) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (['login', 'auth'].includes(act)) return 'bg-purple-50 text-purple-600 border-purple-100';
        if (['view', 'read'].includes(act)) return 'bg-slate-50 text-slate-600 border-slate-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    };

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        const search = searchTerm.toLowerCase();
        return logs.filter(log => 
            log.userName?.toLowerCase().includes(search) ||
            log.action?.toLowerCase().includes(search) ||
            log.module?.toLowerCase().includes(search) ||
            log.entityType?.toLowerCase().includes(search)
        );
    }, [logs, searchTerm]);

    const handleExport = async (_format) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/audit/export?format=json&token=${token}`));
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allLogs = await response.json();
            
            const dataToExport = allLogs.map(log => ({
                ID: log.id,
                Usuario: log.userName || 'N/A',
                Email: log.userEmail || 'N/A',
                Modulo: log.module,
                Accion: log.action,
                Entidad: log.entityType,
                Fecha: new Date(log.timestamp).toLocaleString(),
                Detalles: JSON.stringify(log.newValue || log.details || {})
            }));
            
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
            XLSX.writeFile(wb, `auditoria_lbdc_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo exportar la auditoría', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Terminal de Auditoría">
            <div className="max-w-[1600px] mx-auto space-y-8 pb-12 animate-fade-in font-sans">
                
                {/* Control Bar */}
                <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Terminal de Auditoría</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Protocol v2.4</span>
                            </div>
                        </div>
                        <p className="text-gray-400 font-bold text-sm flex items-center gap-2">
                            Registro de integridad y flujo de datos operativos
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fetchLogs(true)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all flex items-center gap-2"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            Sincronizar
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleExport('excel')}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-emerald-600 hover:border-emerald-100 shadow-sm transition-all flex items-center gap-2"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Exportar Excel
                        </motion.button>
                        <div className="h-8 w-px bg-gray-200 mx-1" />
                        <div className="flex p-1 bg-gray-100 rounded-2xl">
                            {['logs', 'stats', 'recent'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab === 'logs' ? 'Registro' : tab === 'stats' ? 'Métricas' : 'Actividad'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KPI Mesh */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    <PremiumStatCard
                        title="Transacciones Totales"
                        value={stats?.totalActions?.toLocaleString() || '0'}
                        subtext="Logs persistidos"
                        icon={Database}
                        color="indigo"
                        delay={0.1}
                    />
                    <PremiumStatCard
                        title="Actividad 24h"
                        value={`+${stats?.actionsToday || '0'}`}
                        subtext="Eventos capturados"
                        icon={Zap}
                        color="amber"
                        delay={0.2}
                    />
                    <PremiumStatCard
                        title="Usuarios Activos"
                        value={stats?.mostActiveUsers?.length || '0'}
                        subtext="Operadores en registro"
                        icon={Users}
                        color="blue"
                        delay={0.3}
                    />
                    <PremiumStatCard
                        title="Modulo Crítico"
                        value={stats?.actionsByModule?.[0]?.module?.toUpperCase() || '-'}
                        subtext="Mayor flujo de logs"
                        icon={AlertTriangle}
                        color="rose"
                        delay={0.4}
                    />
                    <PremiumStatCard
                        title="Seguridad"
                        value="100%"
                        subtext="Cifrado y redacción TLS"
                        icon={Lock}
                        color="slate"
                        delay={0.5}
                    />
                    <PremiumStatCard
                        title="Estado Núcleo"
                        value="LIVE"
                        subtext="Streaming operacional"
                        icon={Globe}
                        color="emerald"
                        delay={0.6}
                    />
                </div>

                {/* Filter Matrix */}
                <GlassCard className="p-8 border-none shadow-xl shadow-indigo-500/5 bg-white/40 backdrop-blur-3xl overflow-hidden relative" delay={0.7}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-30" />
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Search className="w-3 h-3" /> Buscar Flux
                            </label>
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ID, Usuario, Acción o Módulo..."
                                className="w-full bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-gray-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar Módulo</label>
                            <select 
                                value={filters.module}
                                onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
                                className="w-full bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="">Global</option>
                                {Object.keys(moduleConfig).map(k => (
                                    <option key={k} value={k}>{moduleConfig[k].label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Terminal className="w-3 h-3" /> Acción
                            </label>
                            <select 
                                value={filters.action}
                                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                                className="w-full bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                            >
                                <option value="">Cualquier comando</option>
                                <option value="create">Creación (POST)</option>
                                <option value="update">Modificación (PUT)</option>
                                <option value="delete">Eliminación (DELETE)</option>
                                <option value="login">Acceso (AUTH)</option>
                                <option value="view">Visualización (READ)</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => setFilters({ module: '', action: '', userId: '', startDate: '', endDate: '' })}
                            className="bg-gray-900 text-white p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Resetear
                        </button>
                    </div>
                </GlassCard>

                {/* Audit Grid/Table */}
                <AnimatePresence mode="wait">
                    {activeTab === 'logs' ? (
                        <GlassCard className="overflow-hidden border-none shadow-2xl shadow-indigo-100/20" key="logs" delay={0.8}>
                            <div className="overflow-x-auto scroll-premium">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronología</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operador</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Comando</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Carga Útil / Payload</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rede / IP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            Array(8).fill(0).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 rounded-lg w-full" /></td>)}
                                                </tr>
                                            ))
                                        ) : filteredLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-20 text-center opacity-30">
                                                    <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                    <p className="font-black uppercase text-xs tracking-widest">Flux de datos vacío</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLogs.map((log, idx) => (
                                                <motion.tr 
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group hover:bg-indigo-50/20 transition-all duration-300"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-gray-900 leading-tight uppercase">{formatTimestamp(log.timestamp).split(',')[0]}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 tracking-widest">{formatTimestamp(log.timestamp).split(',')[1]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] shadow-lg shadow-slate-200">
                                                                {log.userName?.substring(0, 2).toUpperCase() || 'SY'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-black text-gray-900 truncate uppercase mt-0.5">{log.userName || 'Sistema'}</p>
                                                                <p className="text-[9px] font-bold text-gray-400 truncate tracking-tight">{log.userEmail || 'LBDC Protocol'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${getActionStyle(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-lg border ${getModuleConfig(log.module).border} ${getModuleConfig(log.module).text} bg-white shadow-sm`}>
                                                                {(() => {
                                                                    const Icon = getModuleConfig(log.module).icon;
                                                                    return <Icon className="w-3 h-3 stroke-[2.5px]" />;
                                                                })()}
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{getModuleConfig(log.module).label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 max-w-xs">
                                                        <div className="space-y-1">
                                                            {log.entityType && (
                                                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                                                    {log.entityType} ID: {log.entityId}
                                                                </p>
                                                            )}
                                                            <div className="p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
                                                                <p className="text-[10px] font-bold text-gray-500 font-mono break-all line-clamp-2">
                                                                    {log.newValue ? (typeof log.newValue === 'string' ? log.newValue : JSON.stringify(log.newValue)) : 'Sin datos extendidos'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg w-fit">
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                                            <span className="text-[9px] font-black text-gray-400 font-mono">{log.ipAddress || '0.0.0.0'}</span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Logic */}
                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    Página {currentPage} de {totalPages} <span className="mx-2 opacity-20">•</span> Flux {totalItems} registros
                                </p>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-indigo-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-indigo-50 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ) : activeTab === 'stats' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" key="stats">
                             <GlassCard className="p-8 flex flex-col h-full" delay={0.1}>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                                        <BarChart3 className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Distribución de Flux por Módulo</h3>
                                </div>
                                <div className="space-y-6 flex-1">
                                    {stats?.actionsByModule?.map((m, idx) => {
                                        const max = stats.actionsByModule[0]?.count || 1;
                                        const perc = (m.count / max) * 100;
                                        const config = getModuleConfig(m.module);
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-2">
                                                        <config.icon className={`w-3.5 h-3.5 ${config.text}`} />
                                                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{config.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-indigo-600">{m.count} logs</span>
                                                </div>
                                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100 relative">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${perc}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className={`h-full bg-gradient-to-r ${config.gradient.replace('20', '100').replace('5', '100')} ${config.text.replace('text', 'bg')} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                             </GlassCard>

                             <GlassCard className="p-8 flex flex-col h-full" delay={0.2}>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2.5 bg-rose-500 rounded-xl shadow-lg shadow-rose-500/20">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Comandos de Mayor Impacto</h3>
                                </div>
                                <div className="space-y-6 flex-1">
                                    {stats?.actionsByType?.map((a, idx) => {
                                        const max = stats.actionsByType[0]?.count || 1;
                                        const perc = (a.count / max) * 100;
                                        return (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getActionStyle(a.action)}`}>
                                                        {a.action}
                                                    </span>
                                                    <span className="text-[10px] font-black text-gray-500">{a.count} ejecuciones</span>
                                                </div>
                                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${perc}%` }}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                        className="h-full bg-slate-900 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                             </GlassCard>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" key="recent">
                            {recentActivity.map((act, i) => {
                                const config = getModuleConfig(act.module);
                                return (
                                    <GlassCard key={act.id || i} className="p-6 relative overflow-hidden group" delay={i * 0.05}>
                                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${config.gradient} -mr-12 -mt-12 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                                        <div className="flex items-start gap-4 mb-4 relative z-10">
                                            <div className={`p-3 rounded-2xl border ${config.border} ${config.text} bg-white shadow-sm`}>
                                                <config.icon className="w-5 h-5 stroke-[2.5px]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{act.userName || 'Sistema'}</h4>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{formatTimestamp(act.timestamp)}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getActionStyle(act.action)}`}>
                                                {act.action}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl relative z-10 transition-colors group-hover:bg-white group-hover:border-indigo-100">
                                            <p className="text-[10px] font-bold text-gray-600 font-mono leading-relaxed line-clamp-2 uppercase">
                                                {act.entityType ? `${act.entityType} #${act.entityId}` : 'Comando de sistema ejecutado'}
                                            </p>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>

                {/* Industrial trust markers */}
                <div className="flex flex-wrap items-center justify-center gap-12 pt-12 opacity-10 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    {[
                        { icon: ShieldCheck, label: 'LBDC Protocolo de Seguridad v2.4' },
                        { icon: Terminal, label: 'Flujo de Eventos en Tiempo Real' },
                        { icon: Database, label: 'Bóveda Nivel de Integridad 5' },
                        { icon: Activity, label: 'Monitor de Flujo Operativo' }
                    ].map((badge, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <badge.icon className="w-4 h-4" />
                            <span className="font-black text-[9px] uppercase tracking-[0.2em]">{badge.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Audit;
