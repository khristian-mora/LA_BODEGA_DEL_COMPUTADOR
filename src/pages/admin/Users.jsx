import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, Eye, EyeOff, Search, X } from 'lucide-react';
import Button from '../../components/Button';
import { buildApiUrl, API_CONFIG } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import PortalWrapper from '../../components/PortalWrapper';

const AdminUsers = () => {
    const { showConfirm, showAlert } = useModal();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 20;

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'admin', status: 'active'
    });

    const resetForm = () => {
        setFormData({
            name: '', email: '', password: '', role: 'admin', status: 'active'
        });
    };

    const roles = [
        { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
        { value: 'técnico', label: 'Técnico', color: 'bg-blue-100 text-blue-700' },
        { value: 'vendedor', label: 'Vendedor', color: 'bg-green-100 text-green-700' },
        { value: 'gerente', label: 'Gerente', color: 'bg-orange-100 text-orange-700' },
        { value: 'client', label: 'Cliente', color: 'bg-cyan-100 text-cyan-700' }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl('/api/users'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            const usersList = Array.isArray(data) ? data : (data.users || data.data || []);
            setUsers(usersList);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            showAlert({
                title: 'Error',
                message: 'Error al cargar usuarios',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingUser
                ? buildApiUrl(`/api/users/${editingUser.id}`)
                : buildApiUrl('/api/users');

            const method = editingUser ? 'PUT' : 'POST';

            // Don't send password if editing and password is empty
            const payload = { ...formData };
            if (editingUser && !payload.password) {
                delete payload.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Error al guardar');
            }

            await showAlert({
                title: 'Éxito',
                message: editingUser ? 'Usuario actualizado' : 'Usuario creado',
                type: 'success'
            });
            setShowForm(false);
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email || '',
            password: '',
            role: user.role,
            status: user.status || 'active'
        });
        setShowForm(true);
    };

    const handleDelete = async (userId, permanently = false) => {
        const confirmed = await showConfirm({
            title: permanently ? 'Confirmar eliminación' : 'Confirmar desactivación',
            message: permanently 
                ? '¿Eliminar este usuario PERMANENTEMENTE? Esta acción no se puede deshacer.' 
                : '¿Desactivar este usuario?',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            const endpoint = permanently 
                ? `/api/users/${userId}/permanent` 
                : `/api/users/${userId}`;
            const response = await fetch(buildApiUrl(endpoint), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Error al eliminar');
            }

            await showAlert({
                title: permanently ? 'Usuario eliminado' : 'Usuario desactivado',
                message: permanently ? 'Usuario eliminado permanentemente' : 'Usuario desactivado',
                type: 'success'
            });
            fetchUsers();
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (showInactive) return matchesSearch;
        return matchesSearch && user.status === 'active';
    });

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

    const getRoleBadge = (role) => {
        const roleObj = roles.find(r => r.value === role) || roles[0];
        return <span className={`px-2 py-1 rounded text-xs font-bold ${roleObj.color}`}>{roleObj.label}</span>;
    };

    return (
        <AdminLayout title="Gestión de Usuarios">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800">Usuarios del Sistema</h2>
                        <p className="text-sm text-gray-500">Gestiona usuarios, roles y permisos</p>
                    </div>
                    <Button onClick={() => { setEditingUser(null); resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Usuario
                    </Button>
                </div>

                {/* View Toggle & Search */}
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                            <input 
                                type="checkbox" 
                                checked={showInactive} 
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-xs font-medium">Inactivos</span>
                        </label>
                    </div>
                </div>

                {/* Compact Users Table */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">#</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Nombre</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Rol</th>
                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500 text-sm">Cargando...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="6" className="px-3 py-4 text-center text-gray-500 text-sm">No hay usuarios</td></tr>
                            ) : paginatedUsers.map((user, idx) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors text-sm">
                                    <td className="px-3 py-2 text-gray-400 text-xs">{idx + 1}</td>
                                    <td className="px-3 py-2">
                                        <span className="font-medium text-gray-900">{user.name}</span>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 text-xs">{user.email}</td>
                                    <td className="px-3 py-2">{getRoleBadge(user.role)}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right space-x-1">
                                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 p-1">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id, false)} className="text-orange-600 hover:text-orange-800 p-1" title="Desactivar">
                                            <EyeOff className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id, true)} className="text-red-600 hover:text-red-800 p-1" title="Eliminar">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
                        >
                            ←
                        </button>
                        <span className="px-3 py-1 text-xs text-gray-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-xs text-gray-400">
                    Mostrando {paginatedUsers.length} de {filteredUsers.length} usuario(s)
                </div>

            </div>

            {/* Form Modal */}
            <PortalWrapper isOpen={showForm}>
                {showForm && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Shield className="w-5 h-5 text-black" /> {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingUser(null); resetForm(); }} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Completo *</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email *</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                        placeholder="usuario@dominio.com"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Rol *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none appearance-none"
                                        >
                                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Estado</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none appearance-none"
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                                        Contraseña {editingUser && '(dejar vacío para no cambiar)'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-transparent focus:border-black focus:bg-white rounded-xl transition-all outline-none"
                                            required={!editingUser}
                                            placeholder={editingUser ? '••••••••' : 'Contraseña segura'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 p-1 rounded-md hover:bg-gray-200 text-gray-400"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => { setShowForm(false); setEditingUser(null); resetForm(); }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading}
                                        className="px-8"
                                    >
                                        {loading ? 'Guardando...' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                    </div>
                )}
            </PortalWrapper>


        </AdminLayout>
    );
};

export default AdminUsers;
