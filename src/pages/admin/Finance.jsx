import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { financeService } from '../../services/financeService';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, Download, Filter, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Search } from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { useModal } from '../../context/ModalContext';

const AdminFinance = () => {
    const { formatPrice } = useShop();
    const { showConfirm, showAlert } = useModal();
    const [finances, setFinances] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const itemsPerPage = 10;

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        category: 'Varios',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const categories = [
        'Arriendo', 'Servicios', 'Nómina', 'Mantenimiento',
        'Publicidad', 'Inventario', 'Impuestos', 'Seguros', 'Otros'
    ];

    const statuses = [
        { value: '', label: 'Todos' },
        { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
        { value: 'approved', label: 'Aprobado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        { value: 'rejected', label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: XCircle },
        { value: 'over_budget', label: 'Sobrepresupuesto', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle }
    ];

    useEffect(() => {
        fetchData();
        fetchExpenses();
    }, [currentPage, filterStatus, filterCategory]);

    const fetchData = async () => {
        try {
            const data = await financeService.getFinancialSummary();
            setFinances(data);
        } catch (error) {
            console.error('Error fetching financial summary:', error);
        }
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage
            };
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;

            const data = await financeService.getExpenses(params);
            setExpenses(data.expenses || data);
            setTotalPages(data.totalPages || Math.ceil((data.total || data.length) / itemsPerPage));
            setTotalExpenses(data.total || data.length);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showAlert({ title: 'Error', message: 'Error al cargar gastos', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await financeService.addExpense({
                ...formData,
                amount: Number(formData.amount)
            });
            setFormData({ category: 'Varios', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
            setShowForm(false);
            await fetchData();
            await fetchExpenses();
            showAlert({ title: 'Éxito', message: 'Gasto registrado correctamente', type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al registrar gasto', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveExpense = async (id) => {
        showConfirm('¿Aprobar este gasto?', async () => {
            try {
                await financeService.approveExpense(id);
                await fetchExpenses();
                await fetchData();
                showAlert({ title: 'Éxito', message: 'Gasto aprobado', type: 'success' });
            } catch (error) {
                showAlert({ title: 'Error', message: error.message || 'Error al aprobar', type: 'error' });
            }
        });
    };

    const handleRejectExpense = async (id) => {
        showConfirm('¿Rechazar este gasto?', async () => {
            try {
                await financeService.rejectExpense(id);
                await fetchExpenses();
                await fetchData();
                showAlert({ title: 'Éxito', message: 'Gasto rechazado', type: 'success' });
            } catch (error) {
                showAlert({ title: 'Error', message: error.message || 'Error al rechazar', type: 'error' });
            }
        });
    };

    const handleExport = async () => {
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;

            const csvContent = await financeService.exportExpenses(params);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `gastos_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            showAlert({ title: 'Error', message: 'Error al exportar', type: 'error' });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = statuses.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-700' };
        return (
            <span className={`${statusConfig.color} px-2 py-1 rounded-md text-xs font-bold uppercase`}>
                {statusConfig.label}
            </span>
        );
    };

    const filteredExpenses = useMemo(() => {
        if (!searchTerm) return expenses;
        return expenses.filter(exp =>
            exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    // Statistics
    const stats = useMemo(() => {
        if (!expenses.length) return null;
        const pending = expenses.filter(e => e.status === 'pending').length;
        const approved = expenses.filter(e => e.status === 'approved').length;
        const rejected = expenses.filter(e => e.status === 'rejected').length;
        const overBudget = expenses.filter(e => e.status === 'over_budget').length;
        const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        return { pending, approved, rejected, overBudget, totalAmount };
    }, [expenses]);

    if (loading && !finances) return <AdminLayout title="Contabilidad"><div className="p-8">Cargando libros...</div></AdminLayout>;

    return (
        <AdminLayout title="Contabilidad y Finanzas">
            <div className="space-y-8 animate-fade-in-up">

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Estado de resultados y gestión de gastos.</p>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Exportar CSV
                        </Button>
                        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Registrar Gasto
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Ingresos Totales</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(finances?.totalRevenue || 0)}</h3>
                            </div>
                            <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-green-600 font-bold">+15% vs mes anterior</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Gastos Operativos</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(finances?.totalExpenses || 0)}</h3>
                            </div>
                            <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                <TrendingDown className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-red-600 font-bold">Alta inversión en inventario</p>
                    </div>

                    <div className="bg-black text-white p-6 rounded-2xl shadow-lg border border-gray-800">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Utilidad Neta</p>
                                <h3 className="text-2xl font-bold text-white">{formatPrice(finances?.netProfit || 0)}</h3>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg text-white">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-bold">Margen Neto: {finances?.margin || 0}%</p>
                    </div>

                    {/* Pending Approval Card */}
                    <div className="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-yellow-700 text-sm font-medium">Pendientes Aprobación</p>
                                <h3 className="text-2xl font-bold text-yellow-800">{stats?.pending || 0}</h3>
                            </div>
                            <div className="bg-yellow-200 p-2 rounded-lg text-yellow-700">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-yellow-600 font-bold">Requieren atención</p>
                    </div>
                </div>

                {/* Expense Stats Bar */}
                {stats && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                                <span className="text-sm text-gray-600">Pendientes: {stats.pending}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-sm text-gray-600">Aprobados: {stats.approved}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                <span className="text-sm text-gray-600">Rechazados: {stats.rejected}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                <span className="text-sm text-gray-600">Sobrepresupuesto: {stats.overBudget}</span>
                            </div>
                            <div className="ml-auto text-sm font-bold text-gray-700">
                                Total: {formatPrice(stats.totalAmount)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                        <h3 className="font-bold mb-4">Registrar Egreso</h3>
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">Categoría</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="p-3 border rounded-lg bg-white w-full">
                                    {categories.map(cat => <option key={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">Descripción</label>
                                <input required placeholder="Descripción del gasto" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="p-3 border rounded-lg w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">Monto (COP)</label>
                                <input required type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="p-3 border rounded-lg w-full" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block">Fecha</label>
                                <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="p-3 border rounded-lg w-full" />
                            </div>
                            <Button type="submit" variant="primary">Guardar</Button>
                        </form>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">Filtros:</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
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
                        <select
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                            className="p-2 border rounded-lg text-sm"
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        {(filterStatus || filterCategory) && (
                            <button
                                onClick={() => { setFilterStatus(''); setFilterCategory(''); setSearchTerm(''); setCurrentPage(1); }}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                        <span className="ml-auto text-sm text-gray-500">
                            {totalExpenses} gasto(s) encontrado(s)
                        </span>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Historial de Gastos</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Descripción</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right pr-6">Monto</th>
                                    <th className="p-4 text-right pr-6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Cargando...</td></tr>
                                ) : filteredExpenses.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No se encontraron gastos</td></tr>
                                ) : (
                                    filteredExpenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 pl-6 font-bold text-gray-900">
                                                {expense.description}
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 text-sm">
                                                {expense.date}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(expense.status || 'pending')}
                                            </td>
                                            <td className="p-4 text-right pr-6 font-mono text-red-600 font-bold">
                                                -{formatPrice(expense.amount)}
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                {expense.status === 'pending' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleApproveExpense(expense.id)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Aprobar"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectExpense(expense.id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
        </AdminLayout>
    );
};

export default AdminFinance;
