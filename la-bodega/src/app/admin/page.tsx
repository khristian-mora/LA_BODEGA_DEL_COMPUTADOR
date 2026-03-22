'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, DollarSign, Users, AlertTriangle, TrendingUp, ShoppingCart, ArrowRight, Calendar, CheckCircle, BarChart3, Settings, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stats {
  kpis: {
    todaySales: number;
    todayOrders: number;
    weekSales: number;
    weekOrders: number;
    monthSales: number;
    monthOrders: number;
    monthGrowth: number;
    yearSales: number;
    yearOrders: number;
    allTimeSales: number;
    allTimeOrders: number;
    pendingOrders: number;
    newClients: number;
    lowStockProducts: number;
    completedOrders: number;
    cancelledOrders: number;
    ordersByStatus: Record<string, number>;
  };
  dailySales: { date: string; sales: number }[];
  ordersByDayLast30: { date: string; orders: number; sales: number }[];
  topProducts: any[];
  recentOrders: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch {
      console.error('Error fetching stats:');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    todaySales: 0, todayOrders: 0, weekSales: 0, weekOrders: 0,
    monthSales: 0, monthOrders: 0, monthGrowth: 0, yearSales: 0,
    yearOrders: 0, allTimeSales: 0, allTimeOrders: 0, pendingOrders: 0,
    newClients: 0, lowStockProducts: 0, completedOrders: 0, cancelledOrders: 0,
    ordersByStatus: {}
  };

  const getChartData = () => {
    if (!stats) return [];
    switch (period) {
      case 'daily':
        return stats.dailySales.slice(-7);
      case 'weekly':
        return stats.ordersByDayLast30.filter((_, i) => i % 7 === 0);
      case 'monthly':
        return stats.ordersByDayLast30;
      default:
        return stats.dailySales;
    }
  };

  const maxSales = Math.max(...getChartData().map(d => d.sales), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-gray-500">Bienvenido al panel de administración</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Ventas de hoy
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                ${(kpis.todaySales || 0).toLocaleString('es-CO')}
              </div>
              <p className="text-xs text-green-600">{kpis.todayOrders || 0} pedidos hoy</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Ventas de la semana
              </CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                ${(kpis.weekSales || 0).toLocaleString('es-CO')}
              </div>
              <p className="text-xs text-blue-600">{kpis.weekOrders || 0} pedidos esta semana</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Ventas del mes
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                ${(kpis.monthSales || 0).toLocaleString('es-CO')}
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${kpis.monthGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.monthGrowth >= 0 ? '↑' : '↓'} {Math.abs(kpis.monthGrowth).toFixed(1)}%
                </span>
                <span className="text-xs text-purple-600">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">
                Ventas del año
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">
                ${(kpis.yearSales || 0).toLocaleString('es-CO')}
              </div>
              <p className="text-xs text-amber-600">{kpis.yearOrders || 0} pedidos este año</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pedidos pendientes
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.pendingOrders || 0}</div>
              <p className="text-xs text-gray-500">requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Nuevos clientes
              </CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.newClients || 0}</div>
              <p className="text-xs text-gray-500">este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Productos stock bajo
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.lowStockProducts || 0}</div>
              <p className="text-xs text-gray-500">menos de 5 unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pedidos entregados
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.completedOrders || 0}</div>
              <p className="text-xs text-gray-500">total completado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resumen de Ventas</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={period === 'daily' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setPeriod('daily')}
                >
                  7D
                </Button>
                <Button 
                  variant={period === 'weekly' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setPeriod('weekly')}
                >
                  30D
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {getChartData().map((day: any, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                      style={{
                        height: `${Math.max(4, (day.sales / maxSales) * 100)}%`,
                      }}
                      title={`$${day.sales.toLocaleString('es-CO')}`}
                    />
                    <span className="text-xs text-gray-500">
                      {period === 'daily' 
                        ? new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short' })
                        : new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(kpis.ordersByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        status === 'PENDIENTE' ? 'bg-yellow-500' :
                        status === 'CONFIRMADO' ? 'bg-blue-500' :
                        status === 'ENVIADO' ? 'bg-purple-500' :
                        status === 'ENTREGADO' ? 'bg-green-500' :
                        status === 'CANCELADO' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm">{status.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pedidos recientes</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        ${Number(order.total).toLocaleString('es-CO')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        order.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'ENVIADO' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'ENTREGADO' ? 'bg-green-100 text-green-700' :
                        order.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topProducts.slice(0, 5).map((item: any, i: number) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name || 'Producto'}</p>
                      <p className="text-xs text-gray-500">{item._sum?.quantity || 0} unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/products">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Gestión de Productos</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Gestión de Pedidos</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Gestión de Usuarios</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/services">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Servicios Técnicos</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/landing">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Landing Page</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/analytics">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Analytics</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
