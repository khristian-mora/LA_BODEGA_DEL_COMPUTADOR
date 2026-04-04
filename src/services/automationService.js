import { buildApiUrl } from '../config/config';

export const automationService = {
    saveCartDraft: async (draftData) => {
        try {
            const response = await fetch(buildApiUrl('/api/automation/draft-cart'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftData)
            });
            if (!response.ok) throw new Error('Error al guardar carrito');
            return await response.json();
        } catch (error) {
            console.error('Draft Save Error:', error);
            return null;
        }
    }
};
