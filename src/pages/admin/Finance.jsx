import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { financeService } from '../../services/financeService';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, Download, Filter, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Search, Activity, Calendar, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

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

    const resetForm = () => {
        setFormData({
            category: 'Varios',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    const categories = [
        'Arriendo', 'Servicios', 'Nómina', 'Mantenimiento',
        'Publicidad', 'Inventario', 'Impuestos', 'Seguros', 'Otros'
    ];

    const statuses = [
        { value: '', label: 'Todos' },
        { value: 'pending', label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
        { value: 'approved', label: 'Aprobado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle },
        { value: 'rejected', label: 'Rechazado', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: XCircle },
        { value: 'over_budget', label: 'Presupuestado', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertTriangle }
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
            const params = { page: currentPage, limit: itemsPerPage };
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;

            const data = await financeService.getExpenses(params);
            const expensesList = Array.isArray(data) ? data : (data.expenses || data.data || []);
            setExpenses(expensesList);
            
            const total = data.total || data.pagination?.total || expensesList.length;
            setTotalPages(data.totalPages || data.pagination?.totalPages || Math.ceil(total / itemsPerPage));
            setTotalExpenses(total);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showAlert({ title: 'Error', message: 'Error al cargar libros contables', type: 'error' });
            setExpenses([]);
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
            resetForm();
            setShowForm(false);
            await fetchData();
            await fetchExpenses();
            showAlert({ title: 'Operación Exitosa', message: 'Egreso registrado en el libro mayor', type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error Sistema', message: error.message || 'Error al registrar flujo', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveExpense = async (id) => {
        const confirmed = await showConfirm({
            title: 'Validación de Gasto',
            message: '¿Confirmar aprobación de este egreso?',
            variant: 'info'
        });
        if (confirmed) {
            try {
                await financeService.approveExpense(id);
                fetchExpenses();
                fetchData();
                showAlert({ title: 'Validado', message: 'Flujo de caja actualizado', type: 'success' });
            } catch (error) {
                showAlert({ title: 'Error', message: error.message, type: 'error' });
            }
        }
    };

    const handleRejectExpense = async (id) => {
        const confirmed = await showConfirm({
            title: 'Rechazo de Gasto',
            message: '¿Confirmar rechazo de este egreso?',
            variant: 'danger'
        });
        if (confirmed) {
            try {
                await financeService.rejectExpense(id);
                fetchExpenses();
                fetchData();
                showAlert({ title: 'Rechazado', message: 'Operación anulada', type: 'success' });
            } catch (error) {
                showAlert({ title: 'Error', message: error.message, type: 'error' });
            }
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/expenses/export?format=json&token=${token}`));
            
            if (!response.ok) throw new Error('Error al obtener datos de exportación');
            
            const allExpenses = await response.json();
            
            const dataToExport = allExpenses.map(exp => ({
                ID: exp.id,
                Fecha: exp.date,
                Categoria: exp.category,
                Descripcion: exp.description,
                Monto: exp.amount,
                Metodo: exp.paymentMethod,
                Estado: exp.status || 'Pagado',
                Vendor: exp.vendor || 'N/A'
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Finanzas');
            XLSX.writeFile(wb, `LBDC_FINANCE_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo exportar el reporte financiero', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = statuses.find(s => s.value === (status || 'pending')) || { label: status, color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' };
        return (
            <span className={`${statusConfig.color} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border flex items-center gap-1 w-fit`}>
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

    const stats = useMemo(() => {
        if (!expenses.length) return null;
        const pending = expenses.filter(e => e.status === 'pending').length;
        const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        return { pending, totalAmount };
    }, [expenses]);

    return (
        <AdminLayout title="Libro de Operaciones Financieras">
            <div className="space-y-6 animate-fade-in pb-12">
                
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Operational Ledger</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 uppercase font-bold tracking-widest mt-0.5">
                                <Activity className="w-3 h-3 text-emerald-400" /> Live Data Synchronization Active
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border-white/10">
                                <Download className="w-4 h-4" /> Export Ledger
                            </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 border-0">
                                <Plus className="w-4 h-4" /> Log Entry
                            </Button>
                        </motion.div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { 
                            label: 'Ingresos Totales', 
                            value: finances?.totalRevenue || 0, 
                            trend: '+15%', 
                            icon: TrendingUp, 
                            color: 'emerald',
                            desc: 'Rendimiento mensual'
                        },
                        { 
                            label: 'Gastos Operativos', 
                            value: finances?.totalExpenses || 0, 
                            trend: '-4.2%', 
                            icon: TrendingDown, 
                            color: 'rose',
                            desc: 'Fijos y Variables'
                        },
                        { 
                            label: 'Utilidad Neta', 
                            value: finances?.netProfit || 0, 
                            trend: 'Óptima', 
                            icon: DollarSign, 
                            color: 'indigo',
                            isDark: true,
                            desc: 'Después de impuestos'
                        },
                        { 
                            label: 'Pendiente Auditoría', 
                            value: stats?.pending || 0, 
                            isCount: true, 
                            icon: Clock, 
                            color: 'amber',
                            desc: 'Requiere verificación'
                        }
                    ].map((card, i) => {
                        const colorMap = {
                            emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
                            rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500' },
                            indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-500' },
                            amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' }
                        };
                        const colorStyles = colorMap[card.color] || colorMap.emerald;
                        
                        return (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`${card.isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-3xl border shadow-sm group hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                        >
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className={`p-3 rounded-2xl ${colorStyles.bg} border ${colorStyles.border} ${colorStyles.text}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                {!card.isCount && (
                                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold border ${colorStyles.border} ${colorStyles.bg} ${colorStyles.text}`}>
                                        {card.trend}
                                    </div>
                                )}
                            </div>
                            <div className="relative z-10">
                                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${card.isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</p>
                                <h3 className={`text-2xl font-black ${card.isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {card.isCount ? card.value : formatPrice(card.value)}
                                </h3>
                                <p className="text-[10px] text-gray-400 mt-1 italic">{card.desc}</p>
                            </div>
                            <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                                <card.icon size={80} />
                            </div>
                        </motion.div>
                    );
                    })}
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-indigo-900/5 backdrop-blur-xl border border-indigo-500/10 rounded-3xl p-8 shadow-inner overflow-hidden"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                <h3 className="text-lg font-bold text-gray-800 tracking-tight">Registro de Movimiento Financiero</h3>
                            </div>
                            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Categoría</label>
                                    <select 
                                        value={formData.category} 
                                        onChange={e => setFormData({ ...formData, category: e.target.value })} 
                                        className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    >
                                        {categories.map(cat => <option key={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Concepto / Descripción</label>
                                    <input 
                                        required 
                                        placeholder="Ej: Pago de servicios públicos marzo" 
                                        value={formData.description} 
                                        onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                        className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Monto Operación (COP)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        placeholder="0" 
                                        value={formData.amount} 
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                                        className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-mono font-bold text-rose-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Fecha Valor</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            required 
                                            type="date" 
                                            value={formData.date} 
                                            onChange={e => setFormData({ ...formData, date: e.target.value })} 
                                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 pl-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-4 flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-2xl px-8 border-gray-200">Cancelar</Button>
                                    <Button type="submit" className="rounded-2xl px-12 bg-indigo-600 shadow-xl shadow-indigo-500/20">Registrar en Libros</Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Control Panel */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-xl space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                            <Filter className="w-4 h-4" />
                        </div>
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Universal ledger search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={filterStatus}
                                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            >
                                {statuses.map(s => <option key={s.value} value={s.value}>{s.label || 'Estado: Todos'}</option>)}
                            </select>
                            <select 
                                value={filterCategory}
                                onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            >
                                <option value="">Category: All</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        {((filterStatus || filterCategory || searchTerm)) && (
                            <button 
                                onClick={() => { setFilterStatus(''); setFilterCategory(''); setSearchTerm(''); setCurrentPage(1); }}
                                className="p-3 hover:bg-rose-50 text-rose-500 rounded-2xl transition-colors border border-transparent hover:border-rose-100"
                                title="Restablecer Filtros"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                                    <th className="p-6 pl-8">Descripción del Movimiento</th>
                                    <th className="p-6">Clasificación</th>
                                    <th className="p-6">Fecha</th>
                                    <th className="p-6">Estado</th>
                                    <th className="p-6 text-right">Monto</th>
                                    <th className="p-6 text-right pr-8">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <AnimatePresence mode='popLayout'>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-gray-400">
                                                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                                                    <p className="font-bold tracking-widest uppercase text-[10px]">Processing Database Query...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-gray-300">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                        <Search className="w-6 h-6" />
                                                    </div>
                                                    <p className="font-bold tracking-widest uppercase text-[10px]">No records match current parameters</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((expense, idx) => (
                                            <motion.tr 
                                                key={expense.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="hover:bg-slate-50 transition-all group"
                                            >
                                                <td className="p-6 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-md transition-all">
                                                            <Activity className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors uppercase leading-none mb-1">{expense.description}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium tracking-wide">ID: LB-{expense.id.toString().padStart(6, '0')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                        {new Date(expense.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    {getStatusBadge(expense.status)}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <p className={`text-sm font-black font-mono ${expense.amount > 1000000 ? 'text-rose-600' : 'text-gray-900'}`}>
                                                            -{formatPrice(expense.amount)}
                                                        </p>
                                                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-0.5">COP</p>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right pr-8">
                                                    {expense.status === 'pending' ? (
                                                        <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <motion.button 
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleApproveExpense(expense.id)}
                                                                className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                                                                title="Aprobar Transacción"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </motion.button>
                                                            <motion.button 
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleRejectExpense(expense.id)}
                                                                className="w-9 h-9 flex items-center justify-center bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20"
                                                                title="Rechazar Transacción"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </motion.button>
                                                        </div>
                                                        ) : (
                                                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic pr-2">
                                                            Auditado
                                                        </div>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Industrial Pagination */}
                    {totalPages > 1 && (
                        <div className="p-6 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/30 gap-4">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                    Displaying {filteredExpenses.length} entries of {totalExpenses} in ledger • Page {currentPage} of {totalPages}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    className="h-10 rounded-xl px-4 border-gray-200 disabled:opacity-20 transition-all font-bold text-xs"
                                >
                                    Prev
                                </Button>
                                <div className="flex gap-1.5 mx-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i));
                                        if (page > totalPages || page < 1) return null;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${currentPage === page ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-gray-100 hover:border-indigo-500 group shadow-sm'}`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                    className="h-10 rounded-xl px-4 border-gray-200 disabled:opacity-20 transition-all font-bold text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminFinance;
