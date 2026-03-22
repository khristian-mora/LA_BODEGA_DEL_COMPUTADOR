'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Package, Wrench, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceType: string;
  brand: string;
  model: string;
  serial: string | null;
  reportedIssue: string;
  status: string;
  diagnosis: string | null;
  budgetJson: any;
  receivedAt: Date;
  technician: { name: string } | null;
  photos: { id: string; url: string; stage: string }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  RECIBIDO: { label: 'Recibido', color: 'bg-blue-100 text-blue-700', icon: Package },
  EN_DIAGNOSTICO: { label: 'En diagnóstico', color: 'bg-yellow-100 text-yellow-700', icon: Wrench },
  PENDIENTE_APROBACION: { label: 'Pendiente aprobación', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  EN_REPARACION: { label: 'En reparación', color: 'bg-purple-100 text-purple-700', icon: Wrench },
  LISTO_PARA_ENTREGA: { label: 'Listo para entrega', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  SIN_REPARACION: { label: 'Sin reparación', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
};

export default function TecnicoPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [orders, setOrders] = React.useState<ServiceOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewOrderForm, setShowNewOrderForm] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selectedOrder, setSelectedOrder] = React.useState<ServiceOrder | null>(null);

  const [newOrder, setNewOrder] = React.useState({
    customerName: '',
    customerIdNumber: '',
    customerEmail: '',
    customerPhone: '',
    deviceType: '',
    brand: '',
    model: '',
    serial: '',
    reportedIssue: '',
    physicalCondition: '',
  });

  React.useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/tecnico');
    }
  }, [sessionStatus, router]);

  React.useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, filter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      
      const res = await fetch(`/api/service-orders?${params}`);
      const data = await res.json();
      setOrders(data);
    } catch {
      console.error('Error fetching orders:');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    if (!newOrder.customerName || !newOrder.customerEmail || !newOrder.deviceType || 
        !newOrder.brand || !newOrder.model || !newOrder.reportedIssue) {
      toast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const res = await fetch('/api/service-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      });

      if (res.ok) {
        toast('Orden de servicio creada', 'success');
        setShowNewOrderForm(false);
        setNewOrder({
          customerName: '', customerIdNumber: '', customerEmail: '', customerPhone: '',
          deviceType: '', brand: '', model: '', serial: '',
          reportedIssue: '', physicalCondition: '',
        });
        fetchOrders();
      } else {
        const data = await res.json();
        toast(data.error || 'Error al crear orden', 'error');
      }
    } catch {
      toast('Error al crear orden', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const res = await fetch('/api/service-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, notes }),
      });

      if (res.ok) {
        toast('Estado actualizado', 'success');
        fetchOrders();
      }
    } catch {
      toast('Error al actualizar estado', 'error');
    }
  };

  const filteredOrders = orders.filter(o => 
    search === '' || 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    (o.serial && o.serial.toLowerCase().includes(search.toLowerCase()))
  );

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Servicio Técnico</h1>
              <p className="text-gray-500">Gestión de órdenes de servicio</p>
            </div>
            <Button onClick={() => setShowNewOrderForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente o serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'RECIBIDO', 'EN_DIAGNOSTICO', 'PENDIENTE_APROBACION', 'EN_REPARACION', 'LISTO_PARA_ENTREGA', 'ENTREGADO'].map((s) => (
              <Button
                key={s}
                variant={filter === s ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'Todos' : statusConfig[s]?.label || s}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron órdenes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100', icon: Package };
              const StatusIcon = config.icon;
              const daysSinceUpdate = Math.floor((Date.now() - new Date(order.receivedAt).getTime()) / (1000 * 60 * 60 * 24));
              const needsAttention = daysSinceUpdate > 5 && !['ENTREGADO', 'SIN_REPARACION'].includes(order.status);

              return (
                <Card key={order.id} className={cn(needsAttention && 'border-red-300')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.color)}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{order.orderNumber}</h3>
                            {needsAttention && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                Sin actualización
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-sm text-gray-500">
                            {order.brand} {order.model} • {order.deviceType}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Recibido: {new Date(order.receivedAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        {!['ENTREGADO', 'SIN_REPARACION'].includes(order.status) && (
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm"
                          >
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showNewOrderForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nueva Orden de Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nombre del cliente *</label>
                  <Input
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cédula</label>
                  <Input
                    value={newOrder.customerIdNumber}
                    onChange={(e) => setNewOrder({ ...newOrder, customerIdNumber: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={newOrder.customerEmail}
                    onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Teléfono</label>
                  <Input
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    placeholder="300 123 4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo de equipo *</label>
                  <select
                    value={newOrder.deviceType}
                    onChange={(e) => setNewOrder({ ...newOrder, deviceType: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Impresora">Impresora</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Marca *</label>
                  <Input
                    value={newOrder.brand}
                    onChange={(e) => setNewOrder({ ...newOrder, brand: e.target.value })}
                    placeholder="Dell, HP, Lenovo..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Modelo *</label>
                  <Input
                    value={newOrder.model}
                    onChange={(e) => setNewOrder({ ...newOrder, model: e.target.value })}
                    placeholder="Modelo"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Serial</label>
                <Input
                  value={newOrder.serial}
                  onChange={(e) => setNewOrder({ ...newOrder, serial: e.target.value })}
                  placeholder="Número de serie"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Problema reportado *</label>
                <textarea
                  value={newOrder.reportedIssue}
                  onChange={(e) => setNewOrder({ ...newOrder, reportedIssue: e.target.value })}
                  className="w-full h-24 rounded-lg border border-gray-300 p-3"
                  placeholder="Describe el problema..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Estado físico</label>
                <textarea
                  value={newOrder.physicalCondition}
                  onChange={(e) => setNewOrder({ ...newOrder, physicalCondition: e.target.value })}
                  className="w-full h-20 rounded-lg border border-gray-300 p-3"
                  placeholder="Descripción de daños físicos visibles..."
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={createOrder}>
                  Crear orden
                </Button>
                <Button variant="outline" onClick={() => setShowNewOrderForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Orden {selectedOrder.orderNumber}</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Equipo</p>
                  <p className="font-medium">{selectedOrder.brand} {selectedOrder.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Serial</p>
                  <p className="font-medium">{selectedOrder.serial || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={cn('px-2 py-1 rounded text-sm', statusConfig[selectedOrder.status]?.color)}>
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Problema reportado</p>
                <p className="text-sm">{selectedOrder.reportedIssue}</p>
              </div>

              {selectedOrder.photos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Fotos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedOrder.photos.map((photo) => (
                      <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.url} alt="" className="w-full h-20 object-cover rounded" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  className="flex-1"
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'EN_DIAGNOSTICO');
                    setSelectedOrder(null);
                  }}
                  disabled={selectedOrder.status !== 'RECIBIDO'}
                >
                  Iniciar diagnóstico
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateOrderStatus(selectedOrder.id, 'LISTO_PARA_ENTREGA');
                    setSelectedOrder(null);
                  }}
                  disabled={selectedOrder.status !== 'EN_REPARACION'}
                >
                  Marcar listo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
