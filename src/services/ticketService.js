import { buildApiUrl, API_CONFIG } from '../config/config';

export const ticketService = {
    getTickets: async () => {
        try {
            const response = await fetch(buildApiUrl('/api/tickets'), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch tickets');
            const data = await response.json();
            return Array.isArray(data) ? data : (data.tickets || data.data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            return [];
        }
    },

    getTicket: async (id) => {
        try {
            const response = await fetch(buildApiUrl(`/api/tickets/${id}`), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch ticket');
            return await response.json();
        } catch (error) {
            console.error('Error fetching ticket:', error);
            return null;
        }
    },

    createTicket: async (ticketData) => {
        try {
            const response = await fetch(buildApiUrl('/api/tickets'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(ticketData)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Error al crear ticket');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    },

    updateTicket: async (id, data) => {
        try {
            const response = await fetch(buildApiUrl(`/api/tickets/${id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Error al actualizar ticket');
            }
            return { success: true };
        } catch (error) {
            console.error('Error updating ticket:', error);
            return { success: false, error: error.message };
        }
    },

    // Mock Notification
    notifyClient: async (_ticket, _messageType) => {
        return new Promise(resolve => {
            setTimeout(() => resolve({ success: true }), 1000);
        });
    },

    getTechnicians: async () => {
        try {
            const response = await fetch(buildApiUrl('/api/technicians'), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch technicians');
            const data = await response.json();
            return Array.isArray(data) ? data : (data.technicians || data.data || []);
        } catch (error) {
            console.error('Error fetching technicians:', error);
            return [];
        }
    },

    getProducts: async () => {
        try {
            const response = await fetch(buildApiUrl('/api/products'), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            return Array.isArray(data) ? data : (data.products || data.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },

    deleteTicket: async (id) => {
        try {
            const response = await fetch(buildApiUrl(`/api/tickets/${id}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.error || 'Error al eliminar ticket');
            }
            return { success: true };
        } catch (error) {
            console.error('Error deleting ticket:', error);
            return { success: false, error: error.message };
        }
    },

    getCustomFindings: async (type) => {
        try {
            const url = type ? `/api/custom-findings?type=${type}` : '/api/custom-findings';
            const response = await fetch(buildApiUrl(url), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch custom findings');
            return await response.json();
        } catch (error) {
            console.error('Error fetching custom findings:', error);
            return [];
        }
    },

    addCustomFinding: async (type, value) => {
        try {
            const response = await fetch(buildApiUrl('/api/custom-findings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ type, value })
            });
            if (!response.ok) throw new Error('Failed to add custom finding');
            return await response.json();
        } catch (error) {
            console.error('Error adding custom finding:', error);
            throw error;
        }
    }
};
