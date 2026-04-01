import { buildApiUrl } from '../config/config';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const couponService = {
    // Get paginated coupons with filters
    getCoupons: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.type) queryParams.append('type', params.type);
        if (params.search) queryParams.append('search', params.search);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = buildApiUrl(`/api/coupons?${queryParams.toString()}`);
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar cupones');
        return response.json();
    },

    // Get single coupon by ID
    getCoupon: async (id) => {
        const response = await fetch(buildApiUrl(`/api/coupons/${id}`), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar cupón');
        return response.json();
    },

    // Create new coupon
    createCoupon: async (data) => {
        const response = await fetch(buildApiUrl('/api/coupons'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear cupón');
        }
        return response.json();
    },

    // Update coupon
    updateCoupon: async (id, data) => {
        const response = await fetch(buildApiUrl(`/api/coupons/${id}`), {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar cupón');
        }
        return response.json();
    },

    // Delete coupon
    deleteCoupon: async (id) => {
        const response = await fetch(buildApiUrl(`/api/coupons/${id}`), {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar cupón');
        }
        return response.json();
    },

    // Toggle coupon status (active/expired/paused)
    toggleStatus: async (id) => {
        const response = await fetch(buildApiUrl(`/api/coupons/${id}/toggle`), {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cambiar estado');
        }
        return response.json();
    },

    // Get coupon statistics
    getStatistics: async (period = 'month') => {
        const response = await fetch(buildApiUrl(`/api/coupons/stats?period=${period}`), { 
            headers: getHeaders() 
        });
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        return response.json();
    },

    // Export coupons to CSV
    exportCoupons: async (params = {}) => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', 'csv');
        if (params.status) queryParams.append('status', params.status);
        if (params.type) queryParams.append('type', params.type);

        const response = await fetch(buildApiUrl(`/api/coupons/export?${queryParams.toString()}`), {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al exportar');
        return response.text();
    },

    // Apply coupon (validate and use)
    applyCoupon: async (code, orderTotal) => {
        const response = await fetch(buildApiUrl('/api/coupons/apply'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ code, orderTotal })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al aplicar cupón');
        }
        return response.json();
    }
};

// Constants for use in components
export const COUPON_STATUSES = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    PAUSED: 'paused'
};

export const COUPON_STATUS_CONFIG = {
    active: { label: 'Activo', color: 'bg-green-100 text-green-700', border: 'border-green-200', bg: 'bg-green-50', icon: 'CheckCircle' },
    expired: { label: 'Expirado', color: 'bg-red-100 text-red-700', border: 'border-red-200', bg: 'bg-red-50', icon: 'XCircle' },
    paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200', bg: 'bg-yellow-50', icon: 'PauseCircle' }
};

export const COUPON_TYPES = {
    PERCENT: 'percent',
    FIXED: 'fixed'
};

export const COUPON_TYPE_CONFIG = {
    percent: { label: 'Porcentaje', symbol: '%', color: 'text-purple-600' },
    fixed: { label: 'Monto Fijo', symbol: '$', color: 'text-blue-600' }
};
