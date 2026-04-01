import { buildApiUrl } from '../config/config';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const returnsService = {
    // Get paginated returns with filters
    getReturns: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.reasonType) queryParams.append('reasonType', params.reasonType);

        const url = buildApiUrl(`/api/returns?${queryParams.toString()}`);
        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar devoluciones');
        return response.json();
    },

    // Get single return by ID
    getReturn: async (id) => {
        const response = await fetch(buildApiUrl(`/api/returns/${id}`), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar devolución');
        return response.json();
    },

    // Create new return
    createReturn: async (data) => {
        const response = await fetch(buildApiUrl('/api/returns'), {
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

    // Update return
    updateReturn: async (id, data) => {
        const response = await fetch(buildApiUrl(`/api/returns/${id}`), {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar devolución');
        }
        return response.json();
    },

    // Delete return
    deleteReturn: async (id) => {
        const response = await fetch(buildApiUrl(`/api/returns/${id}`), {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar devolución');
        }
        return response.json();
    },

    // Update return status (approval workflow)
    updateStatus: async (id, status, resolution = null, refundAmount = null, notes = null) => {
        const body = { status };
        if (resolution) body.resolution = resolution;
        if (refundAmount !== null) body.refundAmount = refundAmount;
        if (notes) body.notes = notes;

        const response = await fetch(buildApiUrl(`/api/returns/${id}/status`), {
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

    // Approve return
    approveReturn: async (id, notes = '') => {
        return returnsService.updateStatus(id, 'approved', null, null, notes);
    },

    // Reject return
    rejectReturn: async (id, notes = '') => {
        return returnsService.updateStatus(id, 'rejected', null, null, notes);
    },

    // Mark return as received
    markAsReceived: async (id, notes = '') => {
        return returnsService.updateStatus(id, 'received', null, null, notes);
    },

    // Process resolution (refund/exchange)
    processResolution: async (id, resolution, refundAmount = null, notes = '') => {
        const status = resolution === 'exchange' ? 'exchanged' : 'refunded';
        return returnsService.updateStatus(id, status, resolution, refundAmount, notes);
    },

    // Get returns statistics
    getStatistics: async () => {
        const response = await fetch(buildApiUrl('/api/returns/statistics'), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        return response.json();
    },

    // Export returns to CSV
    exportReturns: async (params = {}) => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', 'csv');
        if (params.status) queryParams.append('status', params.status);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await fetch(buildApiUrl(`/api/returns/export?${queryParams.toString()}`), {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al exportar');
        return response.text();
    },

    // Get return reasons (for form)
    getReasons: async () => {
        const response = await fetch(buildApiUrl('/api/returns/reasons'), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar motivos');
        return response.json();
    }
};

// Constants for use in components
export const RETURN_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    RECEIVED: 'received',
    REFUNDED: 'refunded',
    EXCHANGED: 'exchanged'
};

export const RETURN_STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200', bg: 'bg-yellow-50' },
    approved: { label: 'Aprobada', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' },
    rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700', border: 'border-red-200', bg: 'bg-red-50' },
    received: { label: 'Recibida', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50' },
    refunded: { label: 'Reembolsada', color: 'bg-green-100 text-green-700', border: 'border-green-200', bg: 'bg-green-50' },
    exchanged: { label: 'Canjeada', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50' }
};

export const RETURN_REASON_TYPES = [
    { value: 'defective', label: 'Producto defectuoso' },
    { value: 'wrong_item', label: 'Artículo incorrecto' },
    { value: 'damaged', label: 'Producto dañado' },
    { value: 'not_as_described', label: 'No es como se describe' },
    { value: 'changed_mind', label: 'Cambio de opinión' },
    { value: 'late_delivery', label: 'Entrega tardía' },
    { value: 'other', label: 'Otro' }
];

export const RESOLUTION_TYPES = [
    { value: 'refund', label: 'Reembolso Total' },
    { value: 'partial_refund', label: 'Reembolso Parcial' },
    { value: 'exchange', label: 'Canje' },
    { value: 'store_credit', label: 'Crédito en Tienda' },
    { value: 'repair', label: 'Reparación' }
];

// Status workflow mapping
export const STATUS_TRANSITIONS = {
    pending: ['approved', 'rejected'],
    approved: ['received', 'rejected'],
    received: ['refunded', 'exchanged'],
    refunded: [],
    exchanged: [],
    rejected: []
};
