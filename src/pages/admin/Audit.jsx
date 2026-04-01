import React, { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../../config/config';
import Button from '../../components/Button';
import { useModal } from '../../context/ModalContext';
import {
    History, Search, Download, RefreshCw, User, Shield, 
    Settings, ShoppingCart, Users, Box, DollarSign, FileText,
    ChevronLeft, ChevronRight, Filter, Clock, Activity, BarChart3
} from 'lucide-react';

const MODULES = {
    'users': { label: 'Usuarios', icon: Users, color: 'blue' },
    'customers': { label: 'Clientes', icon: Users, color: 'green' },
    'tickets': { label: 'Tickets', icon: FileText, color: 'purple' },
    'products': { label: 'Productos', icon: Box, color: 'orange' },
    'orders': { label: 'Pedidos', icon: ShoppingCart, color: 'indigo' },
    'appointments': { label: 'Citas', icon: Clock, color: 'teal' },
    'suppliers': { label: 'Proveedores', icon: Box, color: 'yellow' },
    'coupons': { label: 'Cupones', icon: DollarSign, color: 'pink' },
    'expenses': { label: 'Gastos', icon: DollarSign, color: 'red' },
    'returns': { label: 'Devoluciones', icon: RefreshCw, color: 'orange' },
    'warranties': { label: 'Garantías', icon: Shield, color: 'cyan' },
    'settings': { label: 'Configuración', icon: Settings, color: 'gray' },
    'reports': { label: 'Reportes', icon: BarChart3, color: 'indigo' },
    'audit': { label: 'Auditoría', icon: History, color: 'slate' },
    'security': { label: 'Seguridad', icon: Shield, color: 'red' },
    'backup': { label: 'Copias BD', icon: Download, color: 'green' },
    'auth': { label: 'Autenticación', icon: Shield, color: 'purple' },
};

const Audit = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('logs');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 30;
    
    // Filters
    const [filters, setFilters] = useState({
        module: '',
        action: '',
        userId: '',
        startDate: '',
        endDate: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const { showAlert } = useModal();

    const fetchLogs = useCallback(async () => {
        setLoading(true);
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
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
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
            console.error('Error fetching audit stats:', error);
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
            console.error('Error fetching recent activity:', error);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchStats();
        fetchRecentActivity();
    }, [fetchLogs, fetchStats, fetchRecentActivity]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({ module: '', action: '', userId: '', startDate: '', endDate: '' });
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleExport = async (format) => {
        const token = localStorage.getItem('adminToken');
        const params = new URLSearchParams({
            format,
            ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
        });

        try {
            const response = await fetch(buildApiUrl(`/api/audit/export?${params}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                if (format === 'csv') {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    showAlert('Exportación completada', 'El archivo CSV se ha descargado correctamente.');
                } else {
                    const data = await response.json();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    showAlert('Exportación completada', 'El archivo JSON se ha descargado correctamente.');
                }
            }
        } catch (error) {
            showAlert('Error', 'No se pudo exportar el registro de auditoría.');
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getModuleConfig = (module) => {
        return MODULES[module] || { label: module || 'Sistema', icon: Activity, color: 'gray' };
    };

    const getActionColor = (action) => {
        const colors = {
            'create': 'bg-green-100 text-green-800',
            'update': 'bg-blue-100 text-blue-800',
            'delete': 'bg-red-100 text-red-800',
            'login': 'bg-purple-100 text-purple-800',
            'logout': 'bg-gray-100 text-gray-800',
            'export': 'bg-yellow-100 text-yellow-800',
            'view': 'bg-slate-100 text-slate-800',
        };
        return colors[action?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    const getModuleNameColor = (module) => {
        const config = getModuleConfig(module);
        const colors = {
            blue: 'bg-blue-100 text-blue-800',
            green: 'bg-green-100 text-green-800',
            purple: 'bg-purple-100 text-purple-800',
            orange: 'bg-orange-100 text-orange-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            teal: 'bg-teal-100 text-teal-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            pink: 'bg-pink-100 text-pink-800',
            red: 'bg-red-100 text-red-800',
            cyan: 'bg-cyan-100 text-cyan-800',
            gray: 'bg-gray-100 text-gray-800',
            slate: 'bg-slate-100 text-slate-800',
        };
        return colors[config.color] || 'bg-gray-100 text-gray-800';
    };

    // Filter logs by search term (client-side)
    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            log.userName?.toLowerCase().includes(search) ||
            log.action?.toLowerCase().includes(search) ||
            log.module?.toLowerCase().includes(search) ||
            log.entityType?.toLowerCase().includes(search)
        );
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <History className="text-indigo-600" />
                        Auditoría del Sistema
                    </h1>
                    <p className="text-gray-500 mt-1">Registro completo de actividad y cambios en el sistema</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchLogs} icon={RefreshCw}>
                        Actualizar
                    </Button>
                    <Button variant="secondary" onClick={() => handleExport('csv')} icon={Download}>
                        Exportar CSV
                    </Button>
                    <Button variant="secondary" onClick={() => handleExport('json')} icon={Download}>
                        Exportar JSON
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'logs', label: 'Registro de Actividad', icon: History },
                        { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
                        { id: 'recent', label: 'Actividad Reciente', icon: Activity },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow">
                        <p className="text-indigo-100 text-xs uppercase tracking-wider">Total Acciones</p>
                        <p className="text-2xl font-bold mt-1">{stats.totalActions?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow">
                        <p className="text-green-100 text-xs uppercase tracking-wider">Hoy</p>
                        <p className="text-2xl font-bold mt-1">{stats.actionsToday?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow">
                        <p className="text-blue-100 text-xs uppercase tracking-wider">Esta Semana</p>
                        <p className="text-2xl font-bold mt-1">{stats.actionsThisWeek?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow">
                        <p className="text-purple-100 text-xs uppercase tracking-wider">Módulo Top</p>
                        <p className="text-lg font-bold mt-1">{stats.actionsByModule?.[0]?.module || '-'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow">
                        <p className="text-orange-100 text-xs uppercase tracking-wider">Usuario Top</p>
                        <p className="text-lg font-bold mt-1 truncate">{stats.mostActiveUsers?.[0]?.name || '-'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white shadow">
                        <p className="text-pink-100 text-xs uppercase tracking-wider">Tipos Acción</p>
                        <p className="text-2xl font-bold mt-1">{stats.actionsByType?.length || 0}</p>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por usuario, acción, módulo..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Módulo</label>
                        <select
                            value={filters.module}
                            onChange={(e) => handleFilterChange('module', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todos</option>
                            {Object.entries(MODULES).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Todas</option>
                            <option value="create">Crear</option>
                            <option value="update">Actualizar</option>
                            <option value="delete">Eliminar</option>
                            <option value="login">Iniciar Sesión</option>
                            <option value="export">Exportar</option>
                            <option value="view">Ver</option>
                        </select>
                    </div>
                    <div className="w-36">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="w-36">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <Button variant="outline" onClick={clearFilters} size="sm">
                        Limpiar Filtros
                    </Button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'logs' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">
                            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-indigo-600" />
                            Cargando registros de auditoría...
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="font-medium">No hay registros de auditoría</p>
                            <p className="text-sm">Los registros de actividad aparecerán aquí</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulo</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatTimestamp(log.timestamp)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{log.userName || 'Sistema'}</p>
                                                            <p className="text-xs text-gray-500">{log.userEmail}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getModuleNameColor(log.module)}`}>
                                                        {getModuleConfig(log.module).label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {log.entityType && (
                                                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-1">
                                                            {log.entityType}#{log.entityId}
                                                        </span>
                                                    )}
                                                    {log.newValue && (
                                                        <span className="text-xs text-gray-400 truncate block max-w-[200px]">
                                                            {typeof log.newValue === 'string' ? log.newValue.substring(0, 50) : JSON.stringify(log.newValue).substring(0, 50)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                    {log.ipAddress || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{(currentPage - 1) * limit + 1}</span> a{' '}
                                    <span className="font-medium">{Math.min(currentPage * limit, totalItems)}</span> de{' '}
                                    <span className="font-medium">{totalItems}</span> registros
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        disabled={currentPage === 1}
                                        icon={ChevronLeft}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage >= totalPages}
                                        icon={ChevronRight}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'stats' && stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Actions by Module */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            Acciones por Módulo
                        </h3>
                        <div className="space-y-3">
                            {stats.actionsByModule?.map((item, idx) => {
                                const maxCount = stats.actionsByModule[0]?.count || 1;
                                const percentage = (item.count / maxCount) * 100;
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">{getModuleConfig(item.module).label}</span>
                                            <span className="font-medium text-gray-900">{item.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {(!stats.actionsByModule || stats.actionsByModule.length === 0) && (
                                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
                            )}
                        </div>
                    </div>

                    {/* Actions by Type */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            Acciones por Tipo
                        </h3>
                        <div className="space-y-3">
                            {stats.actionsByType?.map((item, idx) => {
                                const maxCount = stats.actionsByType[0]?.count || 1;
                                const percentage = (item.count / maxCount) * 100;
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(item.action)}`}>
                                                {item.action}
                                            </span>
                                            <span className="font-medium text-gray-900">{item.count}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {(!stats.actionsByType || stats.actionsByType.length === 0) && (
                                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
                            )}
                        </div>
                    </div>

                    {/* Most Active Users */}
                    <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" />
                            Usuarios Más Activos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.mostActiveUsers?.map((user, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-indigo-600 font-bold">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{user.name || 'Desconocido'}</p>
                                        <p className="text-sm text-gray-500">{user.count} acciones</p>
                                    </div>
                                </div>
                            ))}
                            {(!stats.mostActiveUsers || stats.mostActiveUsers.length === 0) && (
                                <p className="text-gray-500 text-center py-4 col-span-full">No hay datos disponibles</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'recent' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Últimas 15 Actividades
                        </h3>
                    </div>
                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay actividad reciente</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentActivity.map((activity, idx) => (
                                <div key={activity.id || idx} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        activity.action === 'create' ? 'bg-green-100' :
                                        activity.action === 'update' ? 'bg-blue-100' :
                                        activity.action === 'delete' ? 'bg-red-100' :
                                        'bg-gray-100'
                                    }`}>
                                        {(() => {
                                            const ModuleIcon = getModuleConfig(activity.module).icon;
                                            return <ModuleIcon className={`w-5 h-5 ${
                                                activity.action === 'create' ? 'text-green-600' :
                                                activity.action === 'update' ? 'text-blue-600' :
                                                activity.action === 'delete' ? 'text-red-600' :
                                                'text-gray-600'
                                            }`} />;
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{activity.userName || 'Sistema'}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                                                {activity.action}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getModuleNameColor(activity.module)}`}>
                                                {getModuleConfig(activity.module).label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {activity.entityType && `Entidad: ${activity.entityType} #${activity.entityId}`}
                                        </p>
                                    </div>
                                    <div className="text-sm text-gray-400 flex-shrink-0">
                                        {formatTimestamp(activity.timestamp)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Audit;
