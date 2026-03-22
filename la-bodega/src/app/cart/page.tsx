'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    stock: number;
    images: string[];
    brand: { name: string } | null;
  };
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [couponCode, setCouponCode] = React.useState('');
  const [coupon, setCoupon] = React.useState<{ type: string; value: number; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = React.useState(false);

  React.useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setItems(data.items);
    } catch {
      console.error('Error fetching cart:');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      });
      fetchCart();
    } catch {
      console.error('Error updating quantity:');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      fetchCart();
      toast('Producto eliminado del carrito', 'success');
    } catch {
      console.error('Error removing item:');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });

      const data = await res.json();

      if (res.ok) {
        setCoupon(data);
        toast('Cupón aplicado correctamente', 'success');
      } else {
        toast(data.error || 'Cupón inválido', 'error');
      }
    } catch {
      toast('Error al aplicar cupón', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + Number(price) * item.quantity;
  }, 0);

  const discount = coupon ? 
    coupon.type === 'percent' 
      ? subtotal * (coupon.value / 100)
      : coupon.value
    : 0;

  const tax = (subtotal - discount) * 0.19;
  const total = subtotal - discount + tax;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-8">Carrito de compras</h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 skeleton rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 skeleton rounded w-2/3" />
                      <div className="h-4 skeleton rounded w-1/3" />
                      <div className="h-8 skeleton rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Tu carrito está vacío</h2>
          <p className="text-gray-500 mb-6">Añade productos para comenzar a comprar</p>
          <Link href="/products">
            <Button>Ver productos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Carrito de compras</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.product.salePrice || item.product.price;
              const hasDiscount = item.product.salePrice && item.product.salePrice < item.product.price;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex gap-4">
                    <Link href={`/products/${item.product.slug}`}>
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Sin imagen
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      {item.product.brand && (
                        <p className="text-xs text-gray-500 mb-1">{item.product.brand.name}</p>
                      )}
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="font-medium text-slate-900 hover:text-blue-600 line-clamp-2 mb-2">
                          {item.product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        {hasDiscount ? (
                          <>
                            <span className="font-bold text-red-600">
                              ${Number(item.product.salePrice).toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              ${Number(item.product.price).toLocaleString('es-CO')}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-slate-900">
                            ${Number(item.product.price).toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        ${(Number(price) * item.quantity).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between pt-4">
              <Link href="/products">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Seguir comprando
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={async () => {
                  await fetch('/api/cart', { method: 'DELETE' });
                  fetchCart();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vaciar carrito
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">¿Tienes un cupón?</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Código"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={applyCoupon}
                      loading={applyingCoupon}
                      disabled={!couponCode.trim()}
                    >
                      Aplicar
                    </Button>
                  </div>
                  {coupon && (
                    <p className="text-sm text-green-600">
                      Cupón aplicado: -{coupon.type === 'percent' ? `${coupon.value}%` : `$${coupon.value.toLocaleString('es-CO')}`}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Descuento</span>
                      <span className="text-green-600">-${discount.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (19%)</span>
                    <span>${tax.toLocaleString('es-CO')}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-green-600">
                      {subtotal - discount >= 500000 ? 'Gratis' : 'Calculado en checkout'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push('/checkout')}
                >
                  Proceder al pago
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
