import { buildApiUrl } from '../config/config';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const marketingService = {
    getCoupons: async () => {
        try {
            const response = await fetch(buildApiUrl('/api/coupons'), { headers: getHeaders() });
            if (!response.ok) throw new Error('Error al cargar cupones');
            const data = await response.json();
            return Array.isArray(data) ? data : (data.coupons || data.data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            return [];
        }
    },

    createCoupon: async (data) => {
        const response = await fetch(buildApiUrl('/api/coupons'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Error al crear cupón');
        }
        return response.json();
    },

    toggleStatus: async (id) => {
        const response = await fetch(buildApiUrl(`/api/coupons/${id}/toggle`), {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Error al cambiar estado');
        }
        return response.json();
    },

    deleteCoupon: async (id) => {
        const response = await fetch(buildApiUrl(`/api/coupons/${id}`), {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Error al eliminar cupón');
        }
        return response.json();
    }
};
