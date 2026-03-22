'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, 
  DollarSign, Eye, MousePointer, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    revenueChange: number;
    ordersChange: number;
    usersChange: number;
  };
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { name: string; value: number }[];
  topProducts: { name: string; sales: number }[];
  visitorsByDay: { day: string; visitors: number }[];
  conversionRate: number;
  avgOrderValue: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const stats = await res.json();
      
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalRevenue: stats.totalRevenue || 0,
          totalOrders: stats.totalOrders || 0,
          totalUsers: stats.totalUsers || 0,
          totalProducts: stats.totalProducts || 0,
          revenueChange: 12.5,
          ordersChange: 8.2,
          usersChange: 15.3,
        },
        revenueByMonth: [
          { month: 'Ene', revenue: 12000000 },
          { month: 'Feb', revenue: 15000000 },
          { month: 'Mar', revenue: 18000000 },
          { month: 'Abr', revenue: 14000000 },
          { month: 'May', revenue: 22000000 },
          { month: 'Jun', revenue: 25000000 },
        ],
        ordersByStatus: [
          { name: 'Completados', value: stats.completedOrders || 0 },
          { name: 'Pendientes', value: stats.pendingOrders || 0 },
          { name: 'Enviados', value: 5 },
          { name: 'Cancelados', value: 2 },
        ],
        topProducts: [
          { name: 'Dell OptiPlex', sales: 15 },
          { name: 'Lenovo ThinkPad', sales: 12 },
          { name: 'Samsung Monitor', sales: 8 },
          { name: 'HP LaserJet', sales: 6 },
          { name: 'Asus VivoBook', sales: 5 },
        ],
        visitorsByDay: [
          { day: 'Lun', visitors: 120 },
          { day: 'Mar', visitors: 145 },
          { day: 'Mié', visitors: 132 },
          { day: 'Jue', visitors: 156 },
          { day: 'Vie', visitors: 189 },
          { day: 'Sáb', visitors: 210 },
          { day: 'Dom', visitors: 145 },
        ],
        conversionRate: 3.2,
        avgOrderValue: 1850000,
      };
      
      setData(mockAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="h-8 w-64 skeleton rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-gray-500">Métricas y estadísticas de tu tienda</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ingresos Totales</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.overview.totalRevenue || 0)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {data?.overview.revenueChange && data.overview.revenueChange > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">{data.overview.revenueChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-500">{Math.abs(data?.overview.revenueChange || 0)}%</span>
                  </>
                )}
                <span className="text-gray-400 ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pedidos</p>
                  <p className="text-2xl font-bold">{data?.overview.totalOrders || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {data?.overview.ordersChange && data.overview.ordersChange > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">{data.overview.ordersChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-500">{Math.abs(data?.overview.ordersChange || 0)}%</span>
                  </>
                )}
                <span className="text-gray-400 ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Usuarios</p>
                  <p className="text-2xl font-bold">{data?.overview.totalUsers || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                {data?.overview.usersChange && data.overview.usersChange > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">{data.overview.usersChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-500">{Math.abs(data?.overview.usersChange || 0)}%</span>
                  </>
                )}
                <span className="text-gray-400 ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Productos</p>
                  <p className="text-2xl font-bold">{data?.overview.totalProducts || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <span>En catálogo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(data?.ordersByStatus || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitantes por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.visitorsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <MousePointer className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tasa de Conversión</p>
                  <p className="text-2xl font-bold">{data?.conversionRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valor Promedio de Pedido</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.avgOrderValue || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 rounded-full">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tiempo Promedio en Sitio</p>
                  <p className="text-2xl font-bold">4:32 min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
