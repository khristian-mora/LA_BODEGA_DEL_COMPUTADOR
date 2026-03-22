import { API_CONFIG } from '../config/config';

const API_URL = API_CONFIG.API_URL;

export const ticketService = {
    getTickets: async () => {
        try {
            const response = await fetch(`${API_URL}/tickets`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch tickets');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    createTicket: async (ticketData) => {
        try {
            const response = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(ticketData)
            });
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    updateTicket: async (id, data) => {
        try {
            await fetch(`${API_URL}/tickets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    },

    // Mock Notification
    notifyClient: async (ticket, messageType) => {
        return new Promise(resolve => {
            console.log(`[SIMULATION] Sending ${messageType} to ${ticket.clientPhone}: "Hola ${ticket.clientName}, novedades sobre tu ${ticket.deviceType}..."`);
            setTimeout(() => resolve({ success: true }), 1000);
        });
    }
};
