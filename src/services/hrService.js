import { buildApiUrl } from '../config/config';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const hrService = {
    getEmployees: async () => {
        try {
            const response = await fetch(buildApiUrl('/api/employees'), { headers: getHeaders() });
            if (!response.ok) throw new Error('Error al cargar empleados');
            const data = await response.json();
            return Array.isArray(data) ? data : (data.employees || data.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            return [];
        }
    },

    hireEmployee: async (data) => {
        const response = await fetch(buildApiUrl('/api/employees'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Error al contratar empleado');
        }
        return response.json();
    },

    updateEmployee: async (id, data) => {
        const response = await fetch(buildApiUrl(`/api/employees/${id}`), {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Error al actualizar empleado');
        }
        return response.json();
    },

    terminateEmployee: async (id) => {
        const response = await fetch(buildApiUrl(`/api/employees/${id}`), {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.error || 'Error al dar de baja empleado');
        }
        return response.json();
    },

    calculatePayroll: async () => {
        const response = await fetch(buildApiUrl('/api/employees/payroll'), { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al calcular nómina');
        return response.json();
    },

    exportEmployees: async (params = {}) => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', params.format || 'json');
        if (params.status) queryParams.append('status', params.status);
        if (params.department) queryParams.append('department', params.department);

        const response = await fetch(buildApiUrl(`/api/employees/export?${queryParams.toString()}`), {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al exportar');
        return params.format === 'csv' ? response.text() : response.json();
    }
};
