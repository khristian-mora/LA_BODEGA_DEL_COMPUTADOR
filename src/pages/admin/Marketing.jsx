import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import { Save, Image as ImageIcon, Globe, MessageSquare, Info } from 'lucide-react';
import Button from '../../components/Button';
import { buildUploadUrl } from '../../config/config';

const AdminMarketing = () => {
    const { settings, updateGlobalSettings, loading } = useSettings();
    const [formData, setFormData] = useState(settings);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Actualizar formData cuando settings carguen
    React.useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const success = await updateGlobalSettings(formData);

        if (success) {
            setMessage({ type: 'success', text: '¡Cambios guardados correctamente! Los verás reflejados en la web de inmediato.' });
        } else {
            setMessage({ type: 'error', text: 'Error al guardar los cambios. Intenta de nuevo.' });
        }
        setSaving(false);
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: uploadData
            });
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, [field]: data.url }));
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    if (loading) return <AdminLayout title="Diseño Web"><div className="p-8">Cargando editor...</div></AdminLayout>;

    return (
        <AdminLayout title="Diseño Web y Marketing">
            <div className="max-w-4xl animate-fade-in-up">

                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Editor Visual</h2>
                        <p className="text-gray-500">Cambia lo que tus clientes ven en la página principal.</p>
                    </div>
                    {message.text && (
                        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSave} className="space-y-8">

                    {/* Seccion Hero */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                            <Globe className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Sección Principal (Hero)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Título Grande</label>
                                    <input
                                        type="text"
                                        value={formData.heroTitle}
                                        onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Subtítulo / Descripción</label>
                                    <textarea
                                        rows="3"
                                        value={formData.heroSubtitle}
                                        onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Imagen de Portada (Laptop)</label>
                                <div className="aspect-video bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                                    {formData.heroImage ? (
                                        <img src={buildUploadUrl(formData.heroImage)} className="w-full h-full object-contain" alt="Preview" />
                                    ) : (
                                        <ImageIcon className="w-10 h-10 text-gray-300" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg font-bold text-sm">
                                            Cambiar Imagen
                                            <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'heroImage')} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seccion Banner Promocional */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-orange-600">
                            <Info className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Banner de Oferta</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Título de la Oferta</label>
                                <input
                                    type="text"
                                    value={formData.bannerTitle}
                                    onChange={e => setFormData({ ...formData, bannerTitle: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Detalle del Descuento</label>
                                <input
                                    type="text"
                                    value={formData.bannerSubtitle}
                                    onChange={e => setFormData({ ...formData, bannerSubtitle: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacto Directo */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-green-600">
                            <MessageSquare className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Contacto y Botones</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Negocio (Marca)</label>
                                <input
                                    type="text"
                                    value={formData.businessName}
                                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Física</label>
                                <input
                                    type="text"
                                    value={formData.businessAddress}
                                    onChange={e => setFormData({ ...formData, businessAddress: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp (Número Completo)</label>
                                <input
                                    type="text"
                                    placeholder="+573..."
                                    value={formData.whatsappNumber}
                                    onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Público</label>
                                <input
                                    type="email"
                                    value={formData.businessEmail}
                                    onChange={e => setFormData({ ...formData, businessEmail: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving} className="flex items-center gap-2 px-10 py-4 text-lg">
                            <Save className="w-5 h-5" />
                            {saving ? 'Guardando...' : 'Publicar Cambios'}
                        </Button>
                    </div>

                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminMarketing;
