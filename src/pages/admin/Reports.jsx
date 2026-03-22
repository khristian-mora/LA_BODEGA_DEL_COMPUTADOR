import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { BarChart3, Download, Calendar, TrendingUp, Package, Users, Wrench, DollarSign, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import Button from '../../components/Button';
import { API_CONFIG, buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';

const AdminReports = () => {
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [salesData, setSalesData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [serviceData, setServiceData] = useState([]);
    const [customerData, setCustomerData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [appointmentStats, setAppointmentStats] = useState([]);

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [sales, inventory, service, customers, products, appointments] = await Promise.all([
                fetch(buildApiUrl(`/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`), { headers }).then(r => r.json()),
                fetch(buildApiUrl('/api/reports/inventory'), { headers }).then(r => r.json()),
                fetch(buildApiUrl(`/api/reports/service?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`), { headers }).then(r => r.json()),
                fetch(buildApiUrl('/api/reports/customers'), { headers }).then(r => r.json()),
                fetch(buildApiUrl('/api/reports/top-products?limit=5'), { headers }).then(r => r.json()),
                fetch(buildApiUrl(`/api/reports/appointments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`), { headers }).then(r => r.json())
            ]);

            setSalesData(sales);
            setInventoryData(inventory);
            setServiceData(service);
            setCustomerData(customers);
            setTopProducts(products);
            setAppointmentStats(appointments);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            showAlert('No hay datos para exportar');
            return;
        }

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => row[h] || '').join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value || 0);
    };

    const totalSalesRevenue = salesData.reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
    const totalTickets = salesData.reduce((sum, day) => sum + (day.totalTickets || 0), 0);
    const totalInventoryValue = inventoryData.reduce((sum, cat) => sum + (cat.totalValue || 0), 0);
    const avgTicketValue = totalTickets > 0 ? totalSalesRevenue / totalTickets : 0;

    return (
        <AdminLayout title="Reportes y Análisis">
            <div className="space-y-8 animate-fade-in-up">

                {/* Premium Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

                    <div className="relative p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white">Centro de Análisis</h2>
                                        <p className="text-white/80 text-sm mt-1">Insights y métricas del negocio</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center bg-white/20 backdrop-blur-md rounded-2xl p-4">
                                <Calendar className="w-5 h-5 text-white" />
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="p-2 border-0 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-bold focus:ring-2 focus:ring-white"
                                />
                                <span className="text-white font-bold">→</span>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="p-2 border-0 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-bold focus:ring-2 focus:ring-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUp className="w-5 h-5 text-white/80" />
                            </div>
                            <p className="text-white/90 text-sm font-bold mb-1">Ingresos Totales</p>
                            <p className="text-3xl font-black text-white mb-2">{formatCurrency(totalSalesRevenue)}</p>
                            <p className="text-white/70 text-xs">{totalTickets} tickets procesados</p>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUp className="w-5 h-5 text-white/80" />
                            </div>
                            <p className="text-white/90 text-sm font-bold mb-1">Ticket Promedio</p>
                            <p className="text-3xl font-black text-white mb-2">{formatCurrency(avgTicketValue)}</p>
                            <p className="text-white/70 text-xs">Por servicio</p>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <BarChart3 className="w-5 h-5 text-white/80" />
                            </div>
                            <p className="text-white/90 text-sm font-bold mb-1">Valor Inventario</p>
                            <p className="text-3xl font-black text-white mb-2">{formatCurrency(totalInventoryValue)}</p>
                            <p className="text-white/70 text-xs">{inventoryData.reduce((sum, cat) => sum + cat.totalProducts, 0)} productos</p>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <ArrowUp className="w-5 h-5 text-white/80" />
                            </div>
                            <p className="text-white/90 text-sm font-bold mb-1">Total Clientes</p>
                            <p className="text-3xl font-black text-white mb-2">{customerData.reduce((sum, type) => sum + type.customerCount, 0)}</p>
                            <p className="text-white/70 text-xs">{customerData.reduce((sum, type) => sum + type.totalServices, 0)} servicios</p>
                        </div>
                    </div>
                </div>

                {/* Reports Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Sales Report */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-xl">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                Reporte de Ventas
                            </h3>
                            <button onClick={() => exportToCSV(salesData, 'ventas')} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {salesData.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No hay datos de ventas</p>
                            ) : (
                                <div className="space-y-3">
                                    {salesData.map((day, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                                            <div>
                                                <p className="font-bold text-gray-900">{new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
                                                <p className="text-xs text-gray-500">{day.totalTickets} tickets</p>
                                            </div>
                                            <p className="text-xl font-black text-green-600">{formatCurrency(day.totalRevenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inventory Report */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-xl">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                Inventario por Categoría
                            </h3>
                            <button onClick={() => exportToCSV(inventoryData, 'inventario')} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {inventoryData.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No hay datos de inventario</p>
                            ) : (
                                <div className="space-y-3">
                                    {inventoryData.map((cat, i) => (
                                        <div key={i} className="relative overflow-hidden p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-bold text-gray-900">{cat.category}</p>
                                                <p className="text-lg font-black text-blue-600">{formatCurrency(cat.totalValue)}</p>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">{cat.totalStock} unidades</span>
                                                {cat.lowStockCount > 0 && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">⚠️ {cat.lowStockCount} bajo stock</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service Report */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-orange-500 rounded-xl">
                                    <Wrench className="w-5 h-5 text-white" />
                                </div>
                                Servicios Técnicos
                            </h3>
                            <button onClick={() => exportToCSV(serviceData, 'servicios')} className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            {serviceData.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No hay datos de servicios</p>
                            ) : (
                                <div className="space-y-3">
                                    {serviceData.map((status, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
                                            <div>
                                                <p className="font-black text-gray-900">{status.status}</p>
                                                <p className="text-xs text-gray-500">{status.count} tickets • Promedio: {formatCurrency(status.avgCost)}</p>
                                            </div>
                                            <p className="text-xl font-black text-orange-600">{formatCurrency(status.totalRevenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
                        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                            <h3 className="font-black text-gray-800 flex items-center gap-3">
                                <div className="p-2 bg-purple-500 rounded-xl">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                Top 5 Productos
                            </h3>
                        </div>
                        <div className="p-6">
                            {topProducts.length === 0 ? (
                                <p className="text-center text-gray-400 py-12">No hay productos</p>
                            ) : (
                                <div className="space-y-3">
                                    {topProducts.map((product, i) => (
                                        <div key={product.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                                #{i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-gray-900">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.category} • Stock: {product.stock}</p>
                                            </div>
                                            <p className="text-lg font-black text-purple-600">{formatCurrency(product.inventoryValue)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;
