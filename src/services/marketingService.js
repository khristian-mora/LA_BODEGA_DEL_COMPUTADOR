const API_URL = '/api/coupons';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const marketingService = {
    getCoupons: async () => {
        const response = await fetch(API_URL, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar cupones');
        return response.json();
    },

    createCoupon: async (data) => {
        const response = await fetch(API_URL, {
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

    toggleStatus: async (id) => {
        const response = await fetch(`${API_URL}/${id}/toggle`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cambiar estado');
        }
        return response.json();
    },

    deleteCoupon: async (id) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar cupón');
        }
        return response.json();
    }
};
