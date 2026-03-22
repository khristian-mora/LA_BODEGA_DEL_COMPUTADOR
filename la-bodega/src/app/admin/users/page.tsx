'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, User, Edit, Mail, Phone, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: string;
  _count: {
    orders: number;
    addresses: number;
  };
}

const roleColors: Record<string, string> = {
  CLIENTE: 'bg-blue-100 text-blue-700',
  CAJERA: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
  TECNICO: 'bg-green-100 text-green-700',
};

const roleLabels: Record<string, string> = {
  CLIENTE: 'Cliente',
  CAJERA: 'Cajera',
  ADMIN: 'Administrador',
  TECNICO: 'Técnico',
};

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null);

  React.useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      
      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const roles = ['CLIENTE', 'CAJERA', 'ADMIN', 'TECNICO'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
                ← Volver al dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
              <p className="text-gray-500">Administra los usuarios del sistema</p>
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
                    placeholder="Buscar por nombre o email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Todos los roles</option>
                {roles.map(r => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
              <Button type="submit">Buscar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 skeleton rounded" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron usuarios</p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="flex items-center gap-1 text-sm text-gray-500">
                            <ShoppingBag className="w-3 h-3" />
                            {user._count.orders} pedidos
                          </p>
                          <p className="text-xs text-gray-400">
                            Registrado: {new Date(user.createdAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${roleColors[user.role] || 'bg-gray-100'}`}>
                          {roleLabels[user.role] || user.role}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                          <Edit className="w-4 h-4" />
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

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{editingUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{editingUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => handleUpdateRole(editingUser.id, e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{roleLabels[r]}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cerrar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
