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

    // Keep for backward compatibility but it's now a no-op
    registerIncome: async (_data) => {
        console.warn('registerIncome is deprecated. Income is now calculated from orders.');
        return { success: true };
    }
};
