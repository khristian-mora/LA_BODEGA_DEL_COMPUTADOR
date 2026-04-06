import { buildApiUrl } from '../config/config';

const API_URL = buildApiUrl('/api/orders');

export const orderService = {
    getOrders: async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    },

    exportOrders: async (filters = {}) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const queryParams = new URLSearchParams({ format: 'json' });
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const response = await fetch(`${API_URL}/export?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to export orders');
        return await response.json();
    },

    createOrder: async (orderData) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
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
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
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

    deleteOrder: async (id) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete order');
        return await response.json();
    },

    getDashboardStats: async () => {
        try {
            const data = await orderService.getOrders();
            const orders = Array.isArray(data) ? data : (data.orders || data.data || []);
            
            return {
                totalRevenue: (orders || []).filter(o => o?.status !== 'Cancelado').reduce((sum, o) => sum + (Number(o?.total) || 0), 0),
                pendingOrders: (orders || []).filter(o => o?.status === 'Pendiente').length,
                totalOrders: (orders || []).length,
                recentOrders: (orders || []).slice(0, 5)
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return { totalRevenue: 0, pendingOrders: 0, totalOrders: 0, recentOrders: [] };
        }
    }
};
