'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    product: {
      name: string;
      images: string[];
    };
  }[];
}

const statusColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADO: 'bg-blue-100 text-blue-700',
  ENVIADO: 'bg-purple-100 text-purple-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/orders');
    }
  }, [status, router]);

  React.useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/">Inicio</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">Mis Pedidos</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Mis Pedidos</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">No tienes pedidos</h2>
              <p className="text-gray-500 mb-6">¡Explora nuestro catálogo y realiza tu primera compra!</p>
              <Link href="/products">
                <Button>Ver Productos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      statusColors[order.status] || 'bg-gray-100 text-gray-700'
                    )}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white overflow-hidden">
                          {item.product.images[0] ? (
                            <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center text-xs text-gray-500">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{order.items.length} producto(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${Number(order.total).toLocaleString('es-CO')}</p>
                      <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
