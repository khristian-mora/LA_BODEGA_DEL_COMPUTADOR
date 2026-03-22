import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        heroTitle: 'Elige tu\nMáquina',
        heroSubtitle: 'Potencia, diseño y rendimiento.',
        heroImage: '/src/assets/hero_laptop.png',
        bannerTitle: 'Mejora tu Flujo de Trabajo',
        bannerSubtitle: 'Descuentos especiales en equipos y accesorios.',
        bannerImage: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80',
        whatsappNumber: '317 653 2488',
        businessName: 'LA BODEGA DEL COMPUTADOR',
        businessAddress: 'Cl. 49 #13-13, Barrancabermeja',
        businessEmail: 'ventas@labodegadelcomputador.com'
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const data = await settingsService.getSettings();
            setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateGlobalSettings = async (newSettings) => {
        try {
            const updated = await settingsService.updateSettings(newSettings);
            setSettings(prev => ({ ...prev, ...updated }));
            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
        }
        return false;
    };

    return (
        <SettingsContext.Provider value={{ settings, updateGlobalSettings, refreshSettings: fetchSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
