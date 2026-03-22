// Automation Service for n8n-ready features
const API_URL = '/api/automation';

export const automationService = {
    saveCartDraft: async (draftData) => {
        try {
            const response = await fetch(`${API_URL}/draft-cart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftData)
            });
            return await response.json();
        } catch (error) {
            console.error('Draft Save Error:', error);
            return null;
        }
    }
};
