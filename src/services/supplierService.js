import { buildApiUrl } from '../config/config';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const supplierService = {
    // Get paginated suppliers with filters
    getSuppliers: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.category) queryParams.append('category', params.category);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = buildApiUrl(`/api/suppliers?${queryParams.toString()}`);
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar proveedores');
        return response.json();
    },

    // Get single supplier by ID
    getSupplier: async (id) => {
        const response = await fetch(buildApiUrl(`/api/suppliers/${id}`), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar proveedor');
        return response.json();
    },

    // Create new supplier
    addSupplier: async (data) => {
        const response = await fetch(buildApiUrl('/api/suppliers'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear proveedor');
        }
        return response.json();
    },

    // Update supplier
    updateSupplier: async (id, data) => {
        const response = await fetch(buildApiUrl(`/api/suppliers/${id}`), {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar proveedor');
        }
        return response.json();
    },

    // Delete supplier
    deleteSupplier: async (id) => {
        const response = await fetch(buildApiUrl(`/api/suppliers/${id}`), {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar proveedor');
        }
        return response.json();
    },

    // Get supplier statistics
    getStatistics: async () => {
        const response = await fetch(buildApiUrl('/api/suppliers/stats'), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        return response.json();
    },

    // Export suppliers to CSV
    exportSuppliers: async (params = {}) => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', 'csv');
        if (params.status) queryParams.append('status', params.status);
        if (params.category) queryParams.append('category', params.category);

        const response = await fetch(buildApiUrl(`/api/suppliers/export?${queryParams.toString()}`), {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al exportar');
        return response.text();
    }
};

// Constants for use in components
export const SUPPLIER_STATUSES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending'
};

export const SUPPLIER_STATUS_CONFIG = {
    active: { label: 'Activo', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
    inactive: { label: 'Inactivo', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' }
};

export const SUPPLIER_CATEGORIES = [
    { value: 'Hardware', label: 'Hardware' },
    { value: 'Software', label: 'Software' },
    { value: 'Peripherals', label: 'Periféricos' },
    { value: 'Services', label: 'Servicios' },
    { value: 'Components', label: 'Componentes' },
    { value: 'Accessories', label: 'Accesorios' }
];
