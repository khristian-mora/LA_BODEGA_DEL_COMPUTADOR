'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [formData, setFormData] = React.useState({
    code: '',
    type: 'PORCENTAJE',
    value: 0,
    minPurchase: null as number | null,
    maxUses: null as number | null,
    expiresAt: '',
    active: true,
  });

  React.useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const body = editingCoupon 
        ? { id: editingCoupon.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingCoupon(null);
        resetForm();
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : null,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      active: coupon.active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
      });

      if (res.ok) {
        setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, active: !c.active } : c));
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PORCENTAJE',
      value: 0,
      minPurchase: null,
      maxUses: null,
      expiresAt: '',
      active: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
                ← Volver al dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Cupones y Promociones</h1>
              <p className="text-gray-500">Gestiona los cupones de descuento</p>
            </div>
            <Button onClick={() => { resetForm(); setEditingCoupon(null); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cupón
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))
          ) : coupons.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8 text-center">
                  <Tag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No hay cupones creados</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            coupons.map((coupon) => (
              <Card key={coupon.id} className={!coupon.active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-blue-600" />
                      <span className="font-mono font-bold text-lg">{coupon.code}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {coupon.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-blue-600">
                      {coupon.type === 'PORCENTAJE' ? (
                        <span className="flex items-center gap-1">
                          <Percent className="w-6 h-6" />
                          {Number(coupon.value)}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          $<span className="text-2xl">{Number(coupon.value).toLocaleString('es-CO')}</span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    {coupon.minPurchase && (
                      <p className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Compra mínima: ${Number(coupon.minPurchase).toLocaleString('es-CO')}
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Usos: {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </p>
                    {coupon.expiresAt && (
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expira: {new Date(coupon.expiresAt).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleToggleActive(coupon)}
                    >
                      {coupon.active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="EJ: NAVIDAD20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="PORCENTAJE">Porcentaje (%)</option>
                      <option value="FIJO">Monto fijo ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Compra mínima</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.minPurchase || ''}
                      onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Límite de usos</label>
                    <Input
                      type="number"
                      value={formData.maxUses || ''}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de expiración</label>
                  <Input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="active" className="text-sm">Cupón activo</label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingCoupon(null); }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCoupon ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
