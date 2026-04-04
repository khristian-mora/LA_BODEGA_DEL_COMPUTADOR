import { buildApiUrl } from '../config/config';

export const customerService = {
    getAllCustomers: async () => {
        try {
            const response = await fetch(buildApiUrl('/api/customers'), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            return data.customers || (Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    },

    searchCustomers: async (query) => {
        try {
            const response = await fetch(buildApiUrl(`/api/customers/search?q=${encodeURIComponent(query)}`), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to search customers');
            return await response.json();
        } catch (error) {
            console.error('Error searching customers:', error);
            return [];
        }
    }
};
