import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, Eye, EyeOff, Search, X } from 'lucide-react';
import Button from '../../components/Button';
import { API_CONFIG } from '../../config/config';
import { useModal } from '../../context/ModalContext';

const AdminUsers = () => {
    const { showConfirm, showAlert } = useModal();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'admin', status: 'active'
    });

    const roles = [
        { value: 'admin', label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
        { value: 'técnico', label: 'Técnico', color: 'bg-blue-100 text-blue-700' },
        { value: 'vendedor', label: 'Vendedor', color: 'bg-green-100 text-green-700' },
        { value: 'gerente', label: 'Gerente', color: 'bg-orange-100 text-orange-700' }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
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
                ? `${API_CONFIG.API_URL}/users/${editingUser.id}`
                : `${API_CONFIG.API_URL}/users`;

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
                const error = await response.json();
                throw new Error(error.error || 'Error al guardar');
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

    const handleDelete = async (userId) => {
        const confirmed = await showConfirm({
            title: 'Confirmar desactivación',
            message: '¿Desactivar este usuario?',
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_CONFIG.API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });

            if (!response.ok) throw new Error('Error al eliminar');

            await showAlert({
                title: 'Usuario desactivado',
                message: 'Usuario desactivado',
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

    const resetForm = () => {
        setFormData({
            name: '', email: '', password: '', role: 'admin', status: 'active'
        });
        setShowPassword(false);
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                {/* Search */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay usuarios</td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="w-4 h-4 inline" />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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


        </AdminLayout>
    );
};

export default AdminUsers;
