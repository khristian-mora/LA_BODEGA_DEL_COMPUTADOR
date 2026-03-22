// API Configuration
// Detecta automáticamente el entorno y configura las URLs base

const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

export const API_CONFIG = {
    // En desarrollo usa localhost:3000, en producción usa rutas relativas (proxy de Vite/Nginx)
    BASE_URL: isDevelopment ? 'http://localhost:3000' : '',
    API_URL: isDevelopment ? 'http://localhost:3000/api' : '/api',
    UPLOADS_URL: isDevelopment ? 'http://localhost:3000/uploads' : '/uploads'
};

// Helper function para construir URLs de API
export const buildApiUrl = (endpoint) => {
    // Si el endpoint ya empieza con http, devolverlo tal cual
    if (endpoint.startsWith('http')) {
        return endpoint;
    }

    // Si empieza con /api, usar API_URL base
    if (endpoint.startsWith('/api')) {
        return `${API_CONFIG.BASE_URL}${endpoint}`;
    }

    // Si no, asumir que es un endpoint relativo
    return `${API_CONFIG.API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// Helper function para construir URLs de uploads
export const buildUploadUrl = (path) => {
    // Retornar null en vez de string vacío para evitar warnings del navegador
    if (!path || path.trim() === '') return null;

    // Si ya es una URL completa, devolverla tal cual
    if (path.startsWith('http')) {
        return path;
    }

    // Si empieza con /uploads, usar tal cual en producción o agregar base en desarrollo
    if (path.startsWith('/uploads')) {
        return isDevelopment ? `${API_CONFIG.BASE_URL}${path}` : path;
    }

    // Si no, asumir que es un path relativo dentro de uploads
    return `${API_CONFIG.UPLOADS_URL}${path.startsWith('/') ? path : '/' + path}`;
};

// Placeholder image para cuando no hay imagen disponible
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5YWFhYWEiPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
