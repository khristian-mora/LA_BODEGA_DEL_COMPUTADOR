const EXPENSES_API = '/api/expenses';
const ORDERS_API = '/api/orders';

const getHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const financeService = {
    getFinancialSummary: async () => {
        try {
            // Fetch expenses from API
            const expensesResponse = await fetch(EXPENSES_API, { headers: getHeaders() });
            const expenses = expensesResponse.ok ? await expensesResponse.json() : [];
            const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            // Fetch orders from API
            let ordersRevenue = 0;
            try {
                const ordersResponse = await fetch(ORDERS_API, { headers: getHeaders() });
                if (ordersResponse.ok) {
                    const orders = await ordersResponse.json();
                    ordersRevenue = orders
                        .filter(o => o.status !== 'Cancelado')
                        .reduce((sum, o) => sum + (o.total || 0), 0);
                }
            } catch (error) {
                console.error('Error fetching orders for finance:', error);
            }

            const totalRevenue = ordersRevenue;
            const netProfit = totalRevenue - totalExpenses;

            return {
                expenses,
                totalExpenses,
                totalRevenue,
                netProfit,
                margin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('Error fetching financial summary:', error);
            return {
                expenses: [],
                totalExpenses: 0,
                totalRevenue: 0,
                netProfit: 0,
                margin: 0
            };
        }
    },

    addExpense: async (data) => {
        const response = await fetch(EXPENSES_API, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al agregar gasto');
        }
        return response.json();
    },

    updateExpense: async (id, data) => {
        const response = await fetch(`${EXPENSES_API}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar gasto');
        }
        return response.json();
    },

    deleteExpense: async (id) => {
        const response = await fetch(`${EXPENSES_API}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar gasto');
        }
        return response.json();
    },

    getExpenses: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.category) queryParams.append('category', params.category);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        let url = EXPENSES_API;
        if (queryParams.toString()) url += `?${queryParams.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar gastos');
        return response.json();
    },

    getExpenseSummary: async (startDate, endDate) => {
        let url = `${EXPENSES_API}/summary`;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al obtener resumen de gastos');
        return response.json();
    },

    approveExpense: async (id) => {
        const response = await fetch(`${EXPENSES_API}/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'approved' })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al aprobar gasto');
        }
        return response.json();
    },

    rejectExpense: async (id) => {
        const response = await fetch(`${EXPENSES_API}/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: 'rejected' })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al rechazar gasto');
        }
        return response.json();
    },

    exportExpenses: async (params = {}) => {
        const queryParams = new URLSearchParams();
        queryParams.append('format', 'csv');
        if (params.status) queryParams.append('status', params.status);
        if (params.category) queryParams.append('category', params.category);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const response = await fetch(`${EXPENSES_API}/export?${queryParams.toString()}`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Error al exportar gastos');
        return response.text();
    },

    // Keep for backward compatibility but it's now a no-op
    registerIncome: async (_data) => {
        console.warn('registerIncome is deprecated. Income is now calculated from orders.');
        return { success: true };
    }
};
