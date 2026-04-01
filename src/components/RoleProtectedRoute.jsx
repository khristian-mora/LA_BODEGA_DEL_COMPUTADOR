import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * RoleProtectedRoute — Guarda de rutas del panel admin con validación de RBAC.
 * Si no hay token en localStorage, redirige a login pertinente.
 * Si el usuario no tiene uno de los roles autorizados, lo redirige al dashboard / o bloquea.
 */
const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const location = useLocation();
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    
    // Si no está logueado, determinar a dónde redirigir según si la ruta original era de técnico
    if (!token || !userStr) {
        if (location.pathname.startsWith('/tech-login') || location.pathname.includes('/tech-service')) {
            return <Navigate to="/tech-login" state={{ from: location }} replace />;
        }
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    try {
        const user = JSON.parse(userStr);
        
        // Verificar si el rol del usuario está permitido en esta ruta
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            // Si el rol no está permitido, lo devolvemos a la vista principal según su rol
            if (user.role === 'técnico') {
                return <Navigate to="/admin/tech-service" replace />;
            }
            return <Navigate to="/admin" replace />;
        }
    } catch (e) {
        // En caso de que el JSON del adminUser esté roto
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default RoleProtectedRoute;
