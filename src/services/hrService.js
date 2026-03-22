const API_URL = '/api/employees';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const hrService = {
    getEmployees: async () => {
        const response = await fetch(API_URL, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar empleados');
        return response.json();
    },

    hireEmployee: async (data) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al contratar empleado');
        }
        return response.json();
    },

    updateEmployee: async (id, data) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar empleado');
        }
        return response.json();
    },

    terminateEmployee: async (id) => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al dar de baja empleado');
        }
        return response.json();
    },

    calculatePayroll: async () => {
        const response = await fetch(`${API_URL}/payroll`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al calcular nómina');
        return response.json();
    }
};
