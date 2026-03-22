'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronRight, CreditCard, Building, Truck, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  department: string;
  zip: string | null;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    images: string[];
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = React.useState<string>('');
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState('TARJETA');
  const [couponCode] = React.useState('');
  const [appliedCoupon] = React.useState<{ type: string; value: number } | null>(null);

  const [newAddress, setNewAddress] = React.useState({
    label: '',
    street: '',
    city: '',
    department: '',
    zip: '',
    isDefault: true,
  });

  const [showNewAddressForm, setShowNewAddressForm] = React.useState(false);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  React.useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [addrRes, cartRes] = await Promise.all([
        fetch('/api/addresses'),
        fetch('/api/cart'),
      ]);
      const [addrData, cartData] = await Promise.all([addrRes.json(), cartRes.json()]);
      
      setAddresses(addrData);
      setCartItems(cartData.items);
      
      const defaultAddr = addrData.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch {
      console.error('Error fetching data:');
    }
  };

  const createAddress = async () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.department) {
      toast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        const addr = await res.json();
        setAddresses([...addresses, addr]);
        setSelectedAddress(addr.id);
        setShowNewAddressForm(false);
        setNewAddress({ label: '', street: '', city: '', department: '', zip: '', isDefault: true });
        toast('Dirección añadida', 'success');
      }
    } catch {
      toast('Error al crear dirección', 'error');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + Number(price) * item.quantity;
  }, 0);

  const discount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? subtotal * (appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;

  const tax = (subtotal - discount) * 0.19;
  const shipping = subtotal - discount >= 500000 ? 0 : 15000;
  const total = subtotal - discount + tax + shipping;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast('Por favor selecciona una dirección de envío', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMethod,
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast('Pedido realizado exitosamente', 'success');
        router.push(`/orders/${data.orderNumber}?success=true`);
      } else {
        toast(data.error || 'Error al crear pedido', 'error');
      }
    } catch {
      toast('Error al crear pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Envío', icon: Truck },
    { number: 2, title: 'Pago', icon: CreditCard },
    { number: 3, title: 'Confirmación', icon: Check },
  ];

  if (status === 'loading' || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-center gap-4">
            {steps.map((s, i) => (
              <React.Fragment key={s.number}>
                <div className={cn(
                  'flex items-center gap-2',
                  step >= s.number ? 'text-blue-600' : 'text-gray-400'
                )}>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    step >= s.number ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  )}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{s.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Dirección de envío
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                        selectedAddress === addr.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{addr.label}</p>
                        <p className="text-sm text-gray-600">
                          {addr.street}, {addr.city}, {addr.department}
                        </p>
                        {addr.zip && <p className="text-sm text-gray-500">C.P. {addr.zip}</p>}
                      </div>
                      {addr.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </label>
                  ))}

                  {showNewAddressForm ? (
                    <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                      <Input
                        placeholder="Etiqueta (ej: Casa, Oficina)"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      />
                      <Input
                        placeholder="Dirección *"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Ciudad *"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                        <Input
                          placeholder="Departamento *"
                          value={newAddress.department}
                          onChange={(e) => setNewAddress({ ...newAddress, department: e.target.value })}
                        />
                      </div>
                      <Input
                        placeholder="Código postal"
                        value={newAddress.zip}
                        onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button onClick={createAddress} loading={loading}>
                          Guardar dirección
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewAddressForm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNewAddressForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir nueva dirección
                    </Button>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedAddress}
                    >
                      Continuar al pago
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Método de pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'TARJETA', label: 'Tarjeta de crédito/débito', icon: CreditCard, desc: 'Visa, Mastercard, etc.' },
                    { id: 'TRANSFERENCIA', label: 'Transferencia bancaria', icon: Building, desc: 'Bancolombia, Davivienda' },
                    { id: 'CONTRAENTREGA', label: 'Contraentrega', icon: Truck, desc: 'Paga cuando recibas' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                        paymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      <method.icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Volver
                    </Button>
                    <Button onClick={() => setStep(3)}>
                      Revisar pedido
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Confirmar pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Dirección de envío</h3>
                    {addresses.find((a) => a.id === selectedAddress) && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{addresses.find((a) => a.id === selectedAddress)?.label}</p>
                        <p className="text-sm text-gray-600">
                          {addresses.find((a) => a.id === selectedAddress)?.street},{' '}
                          {addresses.find((a) => a.id === selectedAddress)?.city},{' '}
                          {addresses.find((a) => a.id === selectedAddress)?.department}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Método de pago</h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">
                        {paymentMethod === 'TARJETA' && 'Tarjeta de crédito/débito'}
                        {paymentMethod === 'TRANSFERENCIA' && 'Transferencia bancaria'}
                        {paymentMethod === 'CONTRAENTREGA' && 'Contraentrega'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Productos</h3>
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            {item.product.images[0] && (
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                          </div>
                          <p className="font-medium">
                            ${(Number(item.product.salePrice || item.product.price) * item.quantity).toLocaleString('es-CO')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Volver
                    </Button>
                    <Button onClick={handlePlaceOrder} loading={loading}>
                      Confirmar pedido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.product.images[0] && (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>-${discount.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA</span>
                    <span>${tax.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className={shipping === 0 ? 'text-green-600' : ''}>
                      {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
