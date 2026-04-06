import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * RoleProtectedRoute — Guarda de rutas del panel admin con validación de RBAC.
 * Si no hay token en localStorage, redirige a login pertinente.
 * Si el usuario no tiene uno de los roles autorizados, lo redirige al dashboard / o bloquea.
 */
const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('adminToken');
            const userStr = localStorage.getItem('adminUser');
            
            if (!token || !userStr) {
                setUser(null);
                setLoading(false);
                return;
            }
            
            try {
                const userData = JSON.parse(userStr);
                
                const response = await fetch(`/api/users/${userData.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const dbUser = await response.json();
                    if (dbUser.role !== userData.role || dbUser.status !== 'active') {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminUser');
                        setUser(null);
                    } else {
                        setUser(dbUser);
                    }
                } else {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    setUser(null);
                }
            } catch (e) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                setUser(null);
            }
            setLoading(false);
        };
        
        verifyUser();
    }, []);
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Verificando permisos...</p>
                </div>
            </div>
        );
    }
    
    if (!user) {
        if (location.pathname.includes('/tech-service')) {
            return <Navigate to="/tech-login" state={{ from: location }} replace />;
        }
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'técnico' || user.role === 'technician') {
            return <Navigate to="/admin/tech-service" replace />;
        }
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default RoleProtectedRoute;
