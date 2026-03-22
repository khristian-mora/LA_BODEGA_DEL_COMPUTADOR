const API_URL = '/api/orders';

export const orderService = {
    getOrders: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    },

    createOrder: async (orderData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                customerName: orderData.customer,
                customerEmail: orderData.email,
                customerPhone: orderData.phone,
                address: orderData.address,
                total: orderData.total,
                paymentMethod: orderData.paymentMethod,
                items: orderData.items
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create order');
        }

        return await response.json();
    },

    updateOrderStatus: async (id, newStatus) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update order status');
        return await response.json();
    },

    getDashboardStats: async () => {
        const orders = await orderService.getOrders();
        return {
            totalRevenue: orders.filter(o => o.status !== 'Cancelado').reduce((sum, o) => sum + o.total, 0),
            pendingOrders: orders.filter(o => o.status === 'Pendiente').length,
            totalOrders: orders.length,
            recentOrders: orders.slice(0, 5)
        };
    }
};
