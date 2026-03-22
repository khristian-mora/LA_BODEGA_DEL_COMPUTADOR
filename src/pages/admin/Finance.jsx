import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { financeService } from '../../services/financeService';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';

const AdminFinance = () => {
    const { formatPrice } = useShop();
    const [finances, setFinances] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({ category: 'Varios', amount: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const data = await financeService.getFinancialSummary();
        setFinances(data);
        setLoading(false);
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setLoading(true);
        await financeService.addExpense({
            ...formData,
            amount: Number(formData.amount)
        });
        setFormData({ category: 'Varios', amount: '', description: '' });
        setShowForm(false);
        await fetchData();
        setLoading(false);
    };

    if (loading && !finances) return <AdminLayout title="Contabilidad"><div className="p-8">Cargando libros...</div></AdminLayout>;

    return (
        <AdminLayout title="Contabilidad y Finanzas">
            <div className="space-y-8 animate-fade-in-up">

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Estado de resultados mes actual.</p>
                    <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Registrar Gasto
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Ingresos Totales</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(finances.totalRevenue)}</h3>
                            </div>
                            <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-green-600 font-bold">+15% comparado al mes anterior</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Gastos Operativos</p>
                                <h3 className="text-2xl font-bold text-gray-900">{formatPrice(finances.totalExpenses)}</h3>
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
                                <h3 className="text-2xl font-bold text-white">{formatPrice(finances.netProfit)}</h3>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg text-white">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-bold">Margen Neto: {finances.margin}%</p>
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
                        <h3 className="font-bold mb-4">Registrar Egreso</h3>
                        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="p-3 border rounded-lg bg-white">
                                <option>Arriendo</option>
                                <option>Servicios</option>
                                <option>Nómina</option>
                                <option>Mantenimiento</option>
                                <option>Publicidad</option>
                                <option>Otros</option>
                            </select>
                            <input required placeholder="Descripción" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="p-3 border rounded-lg" />
                            <input required type="number" placeholder="Monto (COP)" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="p-3 border rounded-lg" />
                            <Button type="submit" variant="primary">Guardar</Button>
                        </form>
                    </div>
                )}

                {/* Expenses Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Historial de Gastos</h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">Concepto</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-right pr-6">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {finances.expenses.map((expense) => (
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
                                    <td className="p-4 text-right pr-6 font-mono text-red-600 font-bold">
                                        -{formatPrice(expense.amount)}
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

export default AdminFinance;
