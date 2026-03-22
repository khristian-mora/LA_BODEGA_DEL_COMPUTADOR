import { API_CONFIG } from '../config/config';

const API_URL = API_CONFIG.API_URL;

export const inventoryService = {
    getAllProducts: async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to fetch products: ${response.status} ${text}`);
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    addProduct: async (productData) => {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(productData)
            });
            const newProduct = await response.json();
            window.dispatchEvent(new Event('inventory-updated'));
            return newProduct;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(productData)
            });
            if (!response.ok) throw new Error('Failed to update product');
            window.dispatchEvent(new Event('inventory-updated'));
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    },

    deleteProduct: async (id) => {
        try {
            await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            window.dispatchEvent(new Event('inventory-updated'));
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    },

    reduceStock: async (id, quantity) => {
        // Logic to get current stock and reduce it, or a specific endpoint
        // Currently backend has a PUT route 
        // For now, let's fetch, subtract and update
        // NOTE: In real world, this should be atomic on server
        try {
            // 1. Get current (simplified for speed, ideally backend handles logic)
            // Using the PUT /stock endpoint logic
            // But my backend server.js implementation was: app.put('/api/products/:id', ... updates stock ...)
            // So I can just send the new stock.
            // Wait, I don't know the current stock here easily without fetching.
            // Let's assume we pass the new stock or logic.
            // For the MVP transition:
            // I will implement a specific 'sell' endpoint later, for now let's just hit the endpoint with a dummy value to verify connection
            // or better, actually fetch product first.
            const products = await inventoryService.getAllProducts();
            const product = products.find(p => p.id === id);
            if (product) {
                const newStock = Math.max(0, product.stock - quantity);
                await fetch(`${API_URL}/products/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ stock: newStock })
                });
                window.dispatchEvent(new Event('inventory-updated'));
            }
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    }
};
