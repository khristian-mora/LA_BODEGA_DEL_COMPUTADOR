import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute — Guarda de rutas del panel admin.
 * Si no hay token en localStorage, redirige a /admin/login.
 * Guarda la ruta original para redirigir después del login.
 */
const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('adminToken');

    if (!token) {
        // Redirige a login guardando la ruta intentada
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
