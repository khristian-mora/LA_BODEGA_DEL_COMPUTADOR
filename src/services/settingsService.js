import { buildApiUrl } from '../config/config';

const API_URL = buildApiUrl('/api/settings');

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Fallback local para cuando no hay token o falla la API
let localSettings = null;

const getLocalSettings = () => {
    if (localSettings) return localSettings;
    try {
        const stored = localStorage.getItem('appHomepageSettings');
        if (stored) {
            localSettings = JSON.parse(stored);
        } else {
            localSettings = getDefaultSettings();
            localStorage.setItem('appHomepageSettings', JSON.stringify(localSettings));
        }
    } catch {
        localSettings = getDefaultSettings();
    }
    return localSettings;
};

const saveLocalSettings = (newSettings) => {
    localSettings = { ...localSettings, ...newSettings };
    localStorage.setItem('appHomepageSettings', JSON.stringify(localSettings));
    return localSettings;
};

const getDefaultSettings = () => ({
    heroTitle: 'Elige tu\nMáquina',
    heroSubtitle: 'Potencia, diseño y rendimiento. Descubre la nueva generación de computadoras diseñadas para creadores y gamers.',
    heroImage: '/src/assets/hero_laptop.png',
    bannerTitle: 'Mejora tu Flujo de Trabajo',
    bannerSubtitle: 'Descuentos especiales en equipos y accesorios.',
    bannerImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80',
    whatsappNumber: '317 653 2488',
    businessName: 'LA BODEGA DEL COMPUTADOR',
    businessAddress: 'Cl. 49 #13-13, Barrancabermeja',
    businessEmail: 'ventas@labodegadelcomputador.com',
});

export const settingsService = {
    getSettings: async () => {
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
            return { ...getLocalSettings() };
        }

        try {
            const response = await fetch(API_URL, { headers: getHeaders() });
            if (response.ok) {
                const settings = await response.json();
                // Convert array of {key, value} to object
                const settingsObj = {};
                settings.forEach(s => {
                    try {
                        settingsObj[s.key] = JSON.parse(s.value);
                    } catch {
                        settingsObj[s.key] = s.value;
                    }
                });
                // Merge with defaults for any missing keys
                const merged = { ...getDefaultSettings(), ...settingsObj };
                return merged;
            }
        } catch (error) {
            // Silencioso por defecto, es comportamiento esperado sin conexión o token
        }
        
        return { ...getLocalSettings() };
    },

    updateSettings: async (newSettings) => {
        const token = localStorage.getItem('adminToken');
        
        // Always save locally as backup
        const localUpdated = saveLocalSettings(newSettings);
        
        if (!token) {
            console.warn('No admin token found, saving only to local storage');
            return { ...localUpdated };
        }

        try {
            // Send settings as a flat object { key: value }
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newSettings)
            });

            if (response.ok) {
                return { ...localUpdated };
            } else {
                const error = await response.json();
                console.error('API Error updating settings:', error);
            }
        } catch (error) {
            console.error('Error saving settings to API, saved locally:', error);
        }

        return { ...localUpdated };
    },

    uploadHeroImage: async (file) => {
        if (!file) throw new Error('No se seleccionó archivo');
        if (file.size > 5 * 1024 * 1024) throw new Error('El archivo no puede superar 5MB');

        const token = localStorage.getItem('adminToken');
        
        if (!token) {
            // Fallback to local storage with base64
            console.warn('No admin token found, using base64 local fallback');
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result;
                    saveLocalSettings({ heroImage: base64 });
                    resolve({ heroImage: base64 });
                };
                reader.onerror = () => reject(new Error('Error al leer el archivo'));
                reader.readAsDataURL(file);
            });
        }

        // Upload to server
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir imagen');
        }

        const result = await response.json();
        saveLocalSettings({ heroImage: result.url });
        return { heroImage: result.url };
    },

    uploadBannerImage: async (file) => {
        if (!file) throw new Error('No se seleccionó archivo');
        if (file.size > 5 * 1024 * 1024) throw new Error('El archivo no puede superar 5MB');

        const token = localStorage.getItem('adminToken');
        
        if (!token) {
            // Fallback to local storage with base64
            console.warn('No admin token found, using base64 local fallback');
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result;
                    saveLocalSettings({ bannerImage: base64 });
                    resolve({ bannerImage: base64 });
                };
                reader.onerror = () => reject(new Error('Error al leer el archivo'));
                reader.readAsDataURL(file);
            });
        }

        // Upload to server
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir imagen');
        }

        const result = await response.json();
        saveLocalSettings({ bannerImage: result.url });
        return { bannerImage: result.url };
    },

    resetToDefaults: async () => {
        localStorage.removeItem('appHomepageSettings');
        localSettings = getDefaultSettings();
        localStorage.setItem('appHomepageSettings', JSON.stringify(localSettings));
        return { ...localSettings };
    },

    downloadDatabaseBackup: async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No autorizado. Debes ser administrador parea descargar la base de datos.');

        const response = await fetch(buildApiUrl('/api/admin/backup-db'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al descargar respaldo');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // El servidor ya envía el nombre del archivo en Content-Disposition, 
        // pero por seguridad definimos uno aquí también.
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `lbdc_backup_${timestamp}.sqlite`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
};
