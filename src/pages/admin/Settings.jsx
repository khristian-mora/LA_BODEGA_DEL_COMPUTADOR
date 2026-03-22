import React, { useState, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Settings, Save, Building2, Mail, Phone, MapPin, Globe, ShieldCheck, Lock, Image, Upload, X, Monitor, MonitorSpeaker } from 'lucide-react';
import Button from '../../components/Button';
import TwoFactorModal from '../../components/TwoFactorModal';
import { settingsService } from '../../services/settingsService';
import { useSettings } from '../../context/SettingsContext';
import { useModal } from '../../context/ModalContext';

const AdminSettings = () => {
    const { settings: globalSettings, refreshSettings } = useSettings();
    const { showAlert } = useModal();
    const [localSettings, setLocalSettings] = useState({
        businessName: globalSettings.businessName || 'LA BODEGA DEL COMPUTADOR',
        email: globalSettings.businessEmail || 'contacto@labodega.com',
        phone: globalSettings.whatsappNumber || '317 653 2488',
        address: globalSettings.businessAddress || 'Cl. 49 #13-13, Barrancabermeja',
        website: 'www.labodegadelcomputador.com',
        taxId: '900.123.456-7',
        currency: 'COP',
        timezone: 'America/Bogota',
        emailNotifications: true,
        smsNotifications: false,
        lowStockThreshold: 10,
        warrantyDefaultMonths: 12
    });

    const [heroImage, setHeroImage] = useState(globalSettings.heroImage || '');
    const [bannerImage, setBannerImage] = useState(globalSettings.bannerImage || '');
    const [heroTitle, setHeroTitle] = useState(globalSettings.heroTitle || 'Elige tu\nMáquina');
    const [heroSubtitle, setHeroSubtitle] = useState(globalSettings.heroSubtitle || '');
    const [bannerTitle, setBannerTitle] = useState(globalSettings.bannerTitle || '');
    const [bannerSubtitle, setBannerSubtitle] = useState(globalSettings.bannerSubtitle || '');
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const heroInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const handleSave = async () => {
        try {
            await settingsService.updateSettings({
                businessName: localSettings.businessName,
                businessEmail: localSettings.email,
                whatsappNumber: localSettings.phone,
                businessAddress: localSettings.address,
                heroImage,
                bannerImage,
                heroTitle,
                heroSubtitle,
                bannerTitle,
                bannerSubtitle,
            });
            localStorage.setItem('appSettings', JSON.stringify(localSettings));
            await refreshSettings();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            showAlert({
                title: 'Error',
                message: 'Error al guardar configuración',
                type: 'error'
            });
        }
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showAlert({
                title: 'Error',
                message: 'Por favor selecciona un archivo de imagen válido',
                type: 'error'
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showAlert({
                title: 'Error',
                message: 'La imagen no puede superar 5MB',
                type: 'error'
            });
            return;
        }

        setUploading(true);
        try {
            if (type === 'hero') {
                const result = await settingsService.uploadHeroImage(file);
                setHeroImage(result.heroImage);
            } else {
                const result = await settingsService.uploadBannerImage(file);
                setBannerImage(result.bannerImage);
            }
        } catch (error) {
            showAlert({
                title: 'Error',
                message: error.message,
                type: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async (type) => {
        if (type === 'hero') {
            await settingsService.updateSettings({ heroImage: '/src/assets/hero_laptop.png' });
            setHeroImage('/src/assets/hero_laptop.png');
        } else {
            await settingsService.updateSettings({ bannerImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80' });
            setBannerImage('https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80');
        }
        await refreshSettings();
    };

    return (
        <AdminLayout title="Configuración del Sistema">
            <div className="space-y-6 animate-fade-in-up max-w-4xl">

                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="font-bold text-gray-800">Configuración General</h2>
                        <p className="text-sm text-gray-500">Personaliza los ajustes del sistema</p>
                    </div>
                    <Button onClick={handleSave} disabled={uploading} className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> {uploading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>

                {saved && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        <span className="font-bold">Configuración guardada exitosamente</span>
                    </div>
                )}

                {/* Homepage Configuration */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Monitor className="w-5 h-5" />
                            Página de Inicio
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Administra las imágenes y textos del Hero y Banner</p>
                    </div>
                    <div className="p-6 space-y-8">

                        {/* Hero Section */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Monitor className="w-4 h-4" /> Sección Hero (Banner Principal)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Hero Image Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Imagen del Hero</label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer relative overflow-hidden"
                                        onClick={() => heroInputRef.current?.click()}
                                    >
                                        {heroImage ? (
                                            <div className="relative">
                                                <img src={heroImage} alt="Hero" className="w-full h-40 object-contain rounded-lg" />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage('hero'); }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">Click para subir imagen</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={heroInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'hero')}
                                    />
                                </div>

                                {/* Hero Text Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Título del Hero</label>
                                        <input
                                            type="text"
                                            value={heroTitle.replace('\n', ' ')}
                                            onChange={e => setHeroTitle(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                            placeholder="Elige tu Máquina"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Usa \n para salto de línea</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Subtítulo del Hero</label>
                                        <textarea
                                            value={heroSubtitle}
                                            onChange={e => setHeroSubtitle(e.target.value)}
                                            rows={3}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none resize-none"
                                            placeholder="Potencia, diseño y rendimiento..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Banner Section */}
                        <div className="border-t border-gray-100 pt-8">
                            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <MonitorSpeaker className="w-4 h-4" /> Sección Banner Promocional
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Banner Image Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Imagen del Banner</label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-400 transition-colors cursor-pointer relative overflow-hidden"
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        {bannerImage ? (
                                            <div className="relative">
                                                <img src={bannerImage} alt="Banner" className="w-full h-40 object-cover rounded-lg" />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage('banner'); }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">Click para subir imagen</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                                    />
                                </div>

                                {/* Banner Text Settings */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Título del Banner</label>
                                        <input
                                            type="text"
                                            value={bannerTitle}
                                            onChange={e => setBannerTitle(e.target.value)}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                            placeholder="Mejora tu Flujo de Trabajo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Subtítulo del Banner</label>
                                        <textarea
                                            value={bannerSubtitle}
                                            onChange={e => setBannerSubtitle(e.target.value)}
                                            rows={3}
                                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none resize-none"
                                            placeholder="Descuentos especiales..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Business Information */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Información del Negocio
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Negocio</label>
                            <input
                                type="text"
                                value={localSettings.businessName}
                                onChange={e => setLocalSettings({ ...localSettings, businessName: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email
                            </label>
                            <input
                                type="email"
                                value={localSettings.email}
                                onChange={e => setLocalSettings({ ...localSettings, email: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> Teléfono / WhatsApp
                            </label>
                            <input
                                type="tel"
                                value={localSettings.phone}
                                onChange={e => setLocalSettings({ ...localSettings, phone: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Dirección
                            </label>
                            <input
                                type="text"
                                value={localSettings.address}
                                onChange={e => setLocalSettings({ ...localSettings, address: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configuración del Sistema
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Moneda</label>
                            <select
                                value={localSettings.currency}
                                onChange={e => setLocalSettings({ ...localSettings, currency: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="COP">COP - Peso Colombiano</option>
                                <option value="USD">USD - Dólar</option>
                                <option value="EUR">EUR - Euro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Zona Horaria</label>
                            <select
                                value={localSettings.timezone}
                                onChange={e => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="America/Bogota">Bogotá (GMT-5)</option>
                                <option value="America/New_York">Nueva York (GMT-5)</option>
                                <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Umbral de Stock Bajo</label>
                            <input
                                type="number"
                                value={localSettings.lowStockThreshold}
                                onChange={e => setLocalSettings({ ...localSettings, lowStockThreshold: parseInt(e.target.value) })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Garantía por Defecto (meses)</label>
                            <input
                                type="number"
                                value={localSettings.warrantyDefaultMonths}
                                onChange={e => setLocalSettings({ ...localSettings, warrantyDefaultMonths: parseInt(e.target.value) })}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                min="1"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800">Notificaciones</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-bold text-gray-900">Notificaciones por Email</p>
                                <p className="text-sm text-gray-500">Recibir alertas importantes por correo</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.emailNotifications}
                                    onChange={e => setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-bold text-gray-900">Notificaciones por SMS</p>
                                <p className="text-sm text-gray-500">Recibir alertas por mensaje de texto</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.smsNotifications}
                                    onChange={e => setLocalSettings({ ...localSettings, smsNotifications: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Seguridad de la Cuenta
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Autenticación en Dos Pasos (2FA)</p>
                                    <p className="text-sm text-gray-500">Añade una capa extra de protección a tu cuenta administrativa.</p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => setIs2FAModalOpen(true)}>
                                Configurar 2FA
                            </Button>
                        </div>
                    </div>
                </div>

                <TwoFactorModal
                    isOpen={is2FAModalOpen}
                    onClose={() => setIs2FAModalOpen(false)}
                />

            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
