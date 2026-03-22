import React, { createContext, useContext, useCallback } from 'react';
import { buildApiUrl } from '../config/config';

const AuditContext = createContext();

export const AuditProvider = ({ children }) => {
    const logAction = useCallback(async (action, module, details = '') => {
        const token = localStorage.getItem('adminToken');
        if (!token) return; // Only log logged-in staff actions

        try {
            await fetch(buildApiUrl('/api/audit/log'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action,
                    module,
                    details: typeof details === 'object' ? JSON.stringify(details) : details
                })
            });
        } catch (error) {
            console.error('[AUDIT] Failed to log action:', error);
        }
    }, []);

    return (
        <AuditContext.Provider value={{ logAction }}>
            {children}
        </AuditContext.Provider>
    );
};

export const useAudit = () => {
    const context = useContext(AuditContext);
    if (!context) {
        throw new Error('useAudit must be used within an AuditProvider');
    }
    return context;
};
