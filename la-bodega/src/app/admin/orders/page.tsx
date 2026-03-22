'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Eye, Package, CheckCircle, XCircle, Truck, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Order {
  id: string;
  orderNumber: string;
  user: { id: string; name: string; email: string };
  address: { street: string; city: string; department: string };
  items: { id: string; product: { name: string; image: string }; quantity: number; unitPrice: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMADO: 'bg-blue-100 text-blue-700 border-blue-200',
  ENVIADO: 'bg-purple-100 text-purple-700 border-purple-200',
  ENTREGADO: 'bg-green-100 text-green-700 border-green-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get('status') || '');
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = React.useState(1);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      
      if (data.orders) {
        setOrders(data.orders);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const statusOptions = ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
                ← Volver al dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Gestión de Pedidos</h1>
              <p className="text-gray-500">Administra todos los pedidos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número, cliente o email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Todos los estados</option>
                {statusOptions.map(s => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
              <Button type="submit">Buscar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron pedidos</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{order.user?.name}</p>
                          <p className="text-xs text-gray-400">{order.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">${Number(order.total).toLocaleString('es-CO')}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[order.status] || 'bg-gray-100'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">Página {page} de {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Detalle del Pedido {selectedOrder.orderNumber}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedOrder.user?.name}</p>
                  <p className="text-sm">{selectedOrder.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p>{selectedOrder.address?.street}</p>
                  <p className="text-sm">{selectedOrder.address?.city}, {selectedOrder.address?.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pago</p>
                  <p className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Productos</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">Cant: {item.quantity} × ${Number(item.unitPrice).toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg">Total: ${Number(selectedOrder.total).toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Cambiar Estado</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      disabled={selectedOrder.status === status}
                    >
                      {status === 'PENDIENTE' && <XCircle className="w-4 h-4 mr-1" />}
                      {status === 'CONFIRMADO' && <CheckCircle className="w-4 h-4 mr-1" />}
                      {status === 'ENVIADO' && <Truck className="w-4 h-4 mr-1" />}
                      {status === 'ENTREGADO' && <Package className="w-4 h-4 mr-1" />}
                      {status === 'CANCELADO' && <XCircle className="w-4 h-4 mr-1" />}
                      {statusLabels[status]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded" />
            ))}
          </div>
        </div>
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
