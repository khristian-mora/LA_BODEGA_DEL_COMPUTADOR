import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import { Save, Image as ImageIcon, Globe, MessageSquare, Zap, X } from 'lucide-react';
import Button from '../../components/Button';
import { buildUploadUrl } from '../../config/config';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMarketing = () => {
    const { settings, updateGlobalSettings, loading } = useSettings();
    const [formData, setFormData] = useState(settings || {});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState({});

    // Actualizar formData cuando settings carguen
    React.useEffect(() => {
        if (settings) {
            setFormData(prev => ({ ...prev, ...settings }));
        }
    }, [settings]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const success = await updateGlobalSettings(formData);
            if (success) {
                setMessage({ type: 'success', text: '¡Cambios publicados en vivo!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            } else {
                setMessage({ type: 'error', text: 'Error al sincronizar.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión.' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [field]: true }));
        
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
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleRemoveImage = (field, defaultValue) => {
        setFormData(prev => ({ ...prev, [field]: defaultValue }));
    };

    const ImageBox = ({ label, field, value, defaultValue, aspect = "aspect-video" }) => (
        <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
            <div className={`${aspect} bg-gray-50 rounded-2xl border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group transition-all hover:border-indigo-300`}>
                {uploading[field] ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Subiendo...</span>
                    </div>
                ) : value ? (
                    <>
                        <img src={buildUploadUrl(value)} className="w-full h-full object-contain p-4" alt={label} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <label className="cursor-pointer bg-white text-black px-4 py-2.5 rounded-xl font-black text-xs hover:bg-gray-100 transition-all active:scale-95">
                                CAMBIAR
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, field)} />
                            </label>
                            {value !== defaultValue && (
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveImage(field, defaultValue)}
                                    className="bg-white/20 backdrop-blur-md text-white p-2.5 rounded-xl hover:bg-red-600 transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                        <label className="cursor-pointer bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                            SUBIR IMAGEN
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, field)} />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) return <AdminLayout title="Diseño Web"><div className="p-8">Cargando editor...</div></AdminLayout>;

    return (
        <AdminLayout title="Diseño Web y Marketing">
            <div className="max-w-6xl animate-fade-in-up pb-24">

                <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/50 gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">Identidad Visual</h2>
                        <p className="text-sm text-gray-400 font-medium italic">Personaliza la experiencia de tus clientes en tiempo real.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <AnimatePresence>
                            {message.text && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, x: 20 }} 
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${message.type === 'success' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-red-600 text-white shadow-red-200'}`}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="bg-black hover:bg-slate-800 text-white px-10 py-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-gray-400 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                            <span className="font-black text-xs uppercase tracking-widest">{saving ? 'Publicando...' : 'Publicar en Vivo'}</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">Cabecera Principal (Hero)</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Configuración de Bienvenida</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Título de la Web</label>
                                        <input
                                            type="text"
                                            value={formData.heroTitle || ''}
                                            onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-lg text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Eslogan / Introducción</label>
                                        <textarea
                                            rows="4"
                                            value={formData.heroSubtitle || ''}
                                            onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-gray-600 text-sm leading-relaxed"
                                        />
                                    </div>
                                </div>
                                <ImageBox 
                                    label="Imagen de Portada Principal" 
                                    field="heroImage" 
                                    value={formData.heroImage} 
                                    defaultValue="/src/assets/hero_laptop.png"
                                />
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <ImageIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">Compra por Categoría</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Gestión de Vitrinas Principales</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <ImageBox 
                                    label="Portátiles (Cat 1)" 
                                    field="cat1_image" 
                                    value={formData.cat1_image} 
                                    defaultValue="/src/assets/hero_laptop.png"
                                    aspect="aspect-[4/5]"
                                />
                                <ImageBox 
                                    label="Gaming (Cat 2)" 
                                    field="cat2_image" 
                                    value={formData.cat2_image} 
                                    defaultValue="/src/assets/hero_gaming_pc.png"
                                    aspect="aspect-[4/5]"
                                />
                                <ImageBox 
                                    label="Accesorios (Cat 3)" 
                                    field="cat3_image" 
                                    value={formData.cat3_image} 
                                    defaultValue="/src/assets/hero_kb_mouse.png"
                                    aspect="aspect-[4/5]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 text-orange-600">
                                <Zap className="w-5 h-5" />
                                <h3 className="font-black text-lg uppercase tracking-tight">Banner de Oferta</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Título Promocional</label>
                                    <input
                                        type="text"
                                        value={formData.bannerTitle || ''}
                                        onChange={e => setFormData({ ...formData, bannerTitle: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white outline-none font-black text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Texto Secundario</label>
                                    <input
                                        type="text"
                                        value={formData.bannerSubtitle || ''}
                                        onChange={e => setFormData({ ...formData, bannerSubtitle: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white outline-none font-medium text-gray-600 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 text-blue-600">
                                <MessageSquare className="w-5 h-5" />
                                <h3 className="font-black text-lg uppercase tracking-tight">Datos de Contacto</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">WhatsApp</label>
                                    <input
                                        type="text"
                                        value={formData.whatsappNumber || ''}
                                        onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white outline-none font-black text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Email Corporativo</label>
                                    <input
                                        type="email"
                                        value={formData.businessEmail || ''}
                                        onChange={e => setFormData({ ...formData, businessEmail: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white outline-none font-black text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminMarketing;
