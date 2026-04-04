import { buildApiUrl } from '../config/config';

const API_URL = buildApiUrl('/appointments');

// Status configuration
export const APPOINTMENT_STATUSES = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-Show'
};

export const APPOINTMENT_STATUS_CONFIG = {
    [APPOINTMENT_STATUSES.PENDING]: { 
        label: 'Pendiente', 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
        icon: 'Clock',
        description: 'Cita programada esperando confirmación'
    },
    [APPOINTMENT_STATUSES.CONFIRMED]: { 
        label: 'Confirmada', 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: 'CheckCircle',
        description: 'Cita confirmada por el cliente'
    },
    [APPOINTMENT_STATUSES.COMPLETED]: { 
        label: 'Completada', 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: 'CheckCircle',
        description: 'Servicio técnico completado'
    },
    [APPOINTMENT_STATUSES.CANCELLED]: { 
        label: 'Cancelada', 
        color: 'bg-red-100 text-red-700 border-red-200', 
        icon: 'XCircle',
        description: 'Cita cancelada'
    },
    [APPOINTMENT_STATUSES.NO_SHOW]: { 
        label: 'No Asistió', 
        color: 'bg-orange-100 text-orange-700 border-orange-200', 
        icon: 'UserX',
        description: 'Cliente no se presentó'
    }
};

// Valid status transitions
export const STATUS_TRANSITIONS = {
    [APPOINTMENT_STATUSES.PENDING]: [APPOINTMENT_STATUSES.CONFIRMED, APPOINTMENT_STATUSES.CANCELLED],
    [APPOINTMENT_STATUSES.CONFIRMED]: [APPOINTMENT_STATUSES.COMPLETED, APPOINTMENT_STATUSES.CANCELLED, APPOINTMENT_STATUSES.NO_SHOW],
    [APPOINTMENT_STATUSES.COMPLETED]: [],
    [APPOINTMENT_STATUSES.CANCELLED]: [APPOINTMENT_STATUSES.PENDING],
    [APPOINTMENT_STATUSES.NO_SHOW]: [APPOINTMENT_STATUSES.PENDING]
};

// Service types
export const SERVICE_TYPES = [
    { value: 'Reparación', label: 'Reparación', color: 'bg-blue-100 text-blue-700' },
    { value: 'Mantenimiento', label: 'Mantenimiento', color: 'bg-green-100 text-green-700' },
    { value: 'Diagnóstico', label: 'Diagnóstico', color: 'bg-purple-100 text-purple-700' },
    { value: 'Instalación', label: 'Instalación', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'Consultoría', label: 'Consultoría', color: 'bg-teal-100 text-teal-700' }
];

// Get appointments with pagination and filters
export const getAppointments = async (params = {}) => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.technicianId) queryParams.append('technicianId', params.technicianId);
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.serviceType) queryParams.append('serviceType', params.serviceType);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `${API_URL}?${queryParams.toString()}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener citas');
    }
    
    return response.json();
};

export const getAppointmentStats = async (period = 'month') => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    const response = await fetch(buildApiUrl(`/reports/appointments?period=${period}`), { headers });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener estadísticas');
    }
    
    return response.json();
};

// Get single appointment
export const getAppointment = async (id) => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    const response = await fetch(`${API_URL}/${id}`, { headers });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener cita');
    }
    
    return response.json();
};

// Create appointment
export const createAppointment = async (data) => {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear cita');
    }
    
    return response.json();
};

// Update appointment
export const updateAppointment = async (id, data) => {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar cita');
    }
    
    return response.json();
};

// Update appointment status
export const updateAppointmentStatus = async (id, status) => {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar estado');
    }
    
    return response.json();
};

// Delete appointment
export const deleteAppointment = async (id) => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar cita');
    }
    
    return response.json();
};

// Export appointments to CSV
export const exportAppointments = async (filters = {}) => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.technicianId) queryParams.append('technicianId', filters.technicianId);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    const url = `${API_URL}/export?${queryParams.toString()}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
        throw new Error('Error al exportar citas');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `citas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
};

export const appointmentService = {
    getAppointments,
    getAppointmentStats,
    getAppointment,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    exportAppointments
};

export default appointmentService;
