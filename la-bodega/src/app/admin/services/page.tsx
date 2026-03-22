'use client';

import * as React from 'react';
import Link from 'next/link';
import { Wrench, Clock, CheckCircle, AlertTriangle, Calendar, ArrowRight, Monitor, Laptop, Smartphone, Tablet, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ServiceStats {
  kpis: {
    totalServices: number;
    monthServices: number;
    monthGrowth: number;
    pendingServices: number;
    inProgressServices: number;
    completedThisMonth: number;
    avgRepairTimeDays: number;
    completedServicesTotal: number;
    pendingServicesCount: number;
    servicesByStatus: Record<string, number>;
    servicesByDevice: Record<string, number>;
  };
  servicesByDayLast30: { date: string; services: number }[];
  recentServices: any[];
}

const deviceIcons: Record<string, React.ElementType> = {
  'Computadora de escritorio': Monitor,
  Laptop: Laptop,
  Celular: Smartphone,
  Tablet: Tablet,
  Servidor: Server,
};

const statusColors: Record<string, string> = {
  RECIBIDO: 'bg-blue-100 text-blue-700',
  EN_DIAGNOSTICO: 'bg-yellow-100 text-yellow-700',
  PENDIENTE_APROBACION: 'bg-orange-100 text-orange-700',
  EN_REPARACION: 'bg-purple-100 text-purple-700',
  LISTO_PARA_ENTREGA: 'bg-green-100 text-green-700',
  ENTREGADO: 'bg-emerald-100 text-emerald-700',
  SIN_REPARACION: 'bg-red-100 text-red-700',
};

export default function AdminServicesDashboard() {
  const [stats, setStats] = React.useState<ServiceStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      setStats(data);
    } catch {
      console.error('Error fetching service stats:');
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
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalServices: 0, monthServices: 0, monthGrowth: 0,
    pendingServices: 0, inProgressServices: 0, completedThisMonth: 0,
    avgRepairTimeDays: 0, completedServicesTotal: 0, pendingServicesCount: 0,
    servicesByStatus: {}, servicesByDevice: {}
  };

  const maxServices = Math.max(...(stats?.servicesByDayLast30 || []).map(d => d.services), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Servicios Técnicos</h1>
              <p className="text-gray-500">Panel de gestión de servicios técnicos</p>
            </div>
            <Link href="/tecnico">
              <Button>
                <Wrench className="w-4 h-4 mr-2" />
                Ir al panel de técnico
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Servicios del mes
              </CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {kpis.monthServices}
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${kpis.monthGrowth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.monthGrowth >= 0 ? '↑' : '↓'} {Math.abs(kpis.monthGrowth).toFixed(1)}%
                </span>
                <span className="text-xs text-blue-600">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">
                Pendientes
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-800">
                {kpis.pendingServices}
              </div>
              <p className="text-xs text-yellow-600">esperando diagnóstico/aprobación</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                En reparación
              </CardTitle>
              <Wrench className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {kpis.inProgressServices}
              </div>
              <p className="text-xs text-purple-600">equipos en proceso</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Completados este mes
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {kpis.completedThisMonth}
              </div>
              <p className="text-xs text-green-600">entregados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Tiempo promedio de reparación
              </CardTitle>
              <Clock className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.avgRepairTimeDays} días</div>
              <p className="text-xs text-gray-500">promedio total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Servicios completados
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.completedServicesTotal}
              </div>
              <p className="text-xs text-gray-500">total histórico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Servicios en proceso
              </CardTitle>
              <Wrench className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.pendingServicesCount}
              </div>
              <p className="text-xs text-gray-500">pendientes/aprobación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total servicios
              </CardTitle>
              <Wrench className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalServices}</div>
              <p className="text-xs text-gray-500">histórico</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Servicios de los últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-1">
                {stats?.servicesByDayLast30.slice(-14).map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                      style={{
                        height: `${Math.max(4, (day.services / maxServices) * 100)}%`,
                      }}
                      title={`${day.services} servicios`}
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(kpis.servicesByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        status === 'RECIBIDO' ? 'bg-blue-500' :
                        status === 'EN_DIAGNOSTICO' ? 'bg-yellow-500' :
                        status === 'PENDIENTE_APROBACION' ? 'bg-orange-500' :
                        status === 'EN_REPARACION' ? 'bg-purple-500' :
                        status === 'LISTO_PARA_ENTREGA' ? 'bg-green-500' :
                        status === 'ENTREGADO' ? 'bg-emerald-500' :
                        'bg-red-500'
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Por tipo de dispositivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(kpis.servicesByDevice || {}).map(([device, count]) => {
                  const Icon = deviceIcons[device] || Monitor;
                  const percentage = kpis.totalServices ? ((count as number) / kpis.totalServices) * 100 : 0;
                  return (
                    <div key={device}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{device}</span>
                        </div>
                        <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Servicios recientes</CardTitle>
              <Link href="/tecnico">
                <Button variant="ghost" size="sm">
                  Ver todos
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentServices.slice(0, 5).map((service) => {
                  const Icon = deviceIcons[service.deviceType] || Monitor;
                  return (
                    <div key={service.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{service.orderNumber}</p>
                          <p className="text-xs text-gray-500">{service.brand} {service.model}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{service.customerName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[service.status] || 'bg-gray-100 text-gray-700'}`}>
                          {service.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
