import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supplierService } from '../../services/supplierService';
import { Plus, Trash2, Phone, Mail, Box } from 'lucide-react';
import Button from '../../components/Button';
import { useModal } from '../../context/ModalContext';

const AdminSuppliers = () => {
    const { showConfirm } = useModal();
    const [suppliers, setSuppliers] = useState([]);
    const [_loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', contact: '', email: '', phone: '', category: 'Hardware' });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        const data = await supplierService.getSuppliers();
        setSuppliers(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        await supplierService.addSupplier(formData);
        setFormData({ name: '', contact: '', email: '', phone: '', category: 'Hardware' });
        setShowForm(false);
        await fetchSuppliers();
        setLoading(false);
    };

    const handleDelete = async (id) => {
        showConfirm('¿Eliminar proveedor?', async () => {
            setLoading(true);
            await supplierService.deleteSupplier(id);
            await fetchSuppliers();
            setLoading(false);
        });
    };

    return (
        <AdminLayout title="Gestión de Proveedores">
            <div className="space-y-6 animate-fade-in-up">

                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Base de datos de aliados estratégicos.</p>
                    <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nuevo Proveedor
                    </Button>
                </div>

                {/* Inline Add Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
                        <h3 className="font-bold mb-4">Registrar Nuevo Proveedor</h3>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required placeholder="Empresa (ej: Microsoft)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="p-3 border rounded-lg" />
                            <input required placeholder="Contacto (ej: Juan Perez)" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="p-3 border rounded-lg" />
                            <input required placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="p-3 border rounded-lg" />
                            <input required placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="p-3 border rounded-lg" />
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="p-3 border rounded-lg">
                                <option>Hardware</option>
                                <option>Software</option>
                                <option>Peripherals</option>
                                <option>Services</option>
                            </select>
                            <Button type="submit" variant="primary">Guardar Proveedor</Button>
                        </form>
                    </div>
                )}

                {/* Grid View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map(supplier => (
                        <div key={supplier.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold text-xl uppercase">
                                    {supplier.name.substring(0, 2)}
                                </div>
                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold uppercase">{supplier.category}</span>
                            </div>

                            <h3 className="font-bold text-lg text-gray-900 mb-1">{supplier.name}</h3>
                            <p className="text-gray-500 text-sm mb-4">Contacto: {supplier.contact}</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {supplier.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {supplier.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Box className="w-4 h-4 text-gray-400" />
                                    Pedidos Activos: <span className="font-bold text-black">{Math.floor(Math.random() * 5)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(supplier.id)}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSuppliers;
