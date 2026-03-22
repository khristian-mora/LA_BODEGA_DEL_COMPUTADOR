const API_URL = '/api/returns';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const returnsService = {
    getReturns: async () => {
        const response = await fetch(API_URL, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar devoluciones');
        return response.json();
    },

    createReturn: async (data) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear devolución');
        }
        return response.json();
    },

    updateStatus: async (id, status, resolution = null, refundAmount = null) => {
        const body = { status };
        if (resolution) body.resolution = resolution;
        if (refundAmount !== null) body.refundAmount = refundAmount;

        const response = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar estado');
        }
        return response.json();
    },

    deleteReturn: async (id) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar devolución');
        }
        return response.json();
    }
};
