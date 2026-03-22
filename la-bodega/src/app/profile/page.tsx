'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, MapPin, Package, Heart, Plus, Trash2 } from 'lucide-react';
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

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: Date;
  addresses: Address[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('profile');
  const [editing, setEditing] = React.useState(false);
  const [showAddressForm, setShowAddressForm] = React.useState(false);
  
  const [form, setForm] = React.useState({
    name: '',
    phone: '',
  });

  const [addressForm, setAddressForm] = React.useState({
    label: '',
    street: '',
    city: '',
    department: '',
    zip: '',
    isDefault: true,
  });

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile');
    }
  }, [status, router]);

  React.useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setForm({ name: data.name || '', phone: data.phone || '' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast('Perfil actualizado', 'success');
        setEditing(false);
        await update({ name: form.name });
        fetchProfile();
      }
    } catch {
      toast('Error al actualizar perfil', 'error');
    }
  };

  const handleCreateAddress = async () => {
    if (!addressForm.label || !addressForm.street || !addressForm.city || !addressForm.department) {
      toast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      if (res.ok) {
        toast('Dirección creada', 'success');
        setShowAddressForm(false);
        setAddressForm({ label: '', street: '', city: '', department: '', zip: '', isDefault: true });
        fetchProfile();
      }
    } catch {
      toast('Error al crear dirección', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Dirección eliminada', 'success');
        fetchProfile();
      }
    } catch {
      toast('Error al eliminar dirección', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="grid md:grid-cols-4 gap-6">
            <div className="h-64 skeleton rounded-xl" />
            <div className="md:col-span-3 h-64 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'addresses', label: 'Direcciones', icon: MapPin },
    { id: 'orders', label: 'Pedidos', icon: Package },
    { id: 'favorites', label: 'Favoritos', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Mi Cuenta</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="md:col-span-1 h-fit">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Información Personal</CardTitle>
                  <Button
                    variant={editing ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => editing ? handleUpdateProfile() : setEditing(true)}
                  >
                    {editing ? 'Guardar' : 'Editar'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                    <Input value={user?.email || ''} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={!editing}
                      placeholder="300 123 4567"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Miembro desde</label>
                    <p className="text-gray-600">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'addresses' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Mis Direcciones</CardTitle>
                  <Button size="sm" onClick={() => setShowAddressForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Dirección
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showAddressForm && (
                    <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                      <Input
                        placeholder="Etiqueta (Casa, Oficina)"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      />
                      <Input
                        placeholder="Dirección *"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          placeholder="Ciudad *"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        />
                        <Input
                          placeholder="Departamento *"
                          value={addressForm.department}
                          onChange={(e) => setAddressForm({ ...addressForm, department: e.target.value })}
                        />
                      </div>
                      <Input
                        placeholder="Código postal"
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleCreateAddress}>Guardar</Button>
                        <Button variant="outline" onClick={() => setShowAddressForm(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}

                  {user?.addresses.length === 0 && !showAddressForm ? (
                    <p className="text-gray-500 text-center py-8">No hay direcciones guardadas</p>
                  ) : (
                    user?.addresses.map((addr) => (
                      <div key={addr.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{addr.label}</p>
                            {addr.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Principal</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{addr.street}</p>
                          <p className="text-sm text-gray-600">{addr.city}, {addr.department}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'orders' && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Ver historial de pedidos</p>
                  <Link href="/orders">
                    <Button>Ver Pedidos</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {activeTab === 'favorites' && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Tus productos favoritos</p>
                  <Link href="/favorites">
                    <Button>Ver Favoritos</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
