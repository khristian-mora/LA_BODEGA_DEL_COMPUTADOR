import React, { createContext, useState, useEffect, useContext } from 'react';
import { inventoryService } from '../services/inventoryService';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [user, _setUser] = useState(null); // Mock user state

    // Load products from persistent service
    const loadProducts = async () => {
        const data = await inventoryService.getAllProducts();
        setProducts(data);
    };

    useEffect(() => {
        loadProducts();

        // Load sync cart if logged in
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        if (token) {
            fetchRemoteCart(token);
        }

        // Listen for admin changes
        window.addEventListener('inventory-updated', loadProducts);
        return () => window.removeEventListener('inventory-updated', loadProducts);
    }, []);

    const fetchRemoteCart = async (token) => {
        try {
            const res = await fetch('/api/user/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const remoteCart = await res.json();
                if (remoteCart && remoteCart.length > 0) {
                    setCart(prevCart => {
                        // Merge Strategy: Combine unique products, sum quantities for duplicates
                        const merged = [...prevCart];
                        remoteCart.forEach(remoteItem => {
                            const index = merged.findIndex(i => i.id === remoteItem.productId);
                            if (index !== -1) {
                                // If exists in both, we take the remote one or sum? User said "merge"
                                // Let's sum if quantities are different or just keep remote. 
                                // Summing is usually better for "fusionar"
                                merged[index].quantity = Math.max(merged[index].quantity, remoteItem.quantity);
                            } else {
                                merged.push({
                                    id: remoteItem.productId,
                                    name: remoteItem.name,
                                    price: remoteItem.price,
                                    image: remoteItem.image,
                                    category: remoteItem.category,
                                    quantity: remoteItem.quantity
                                });
                            }
                        });
                        return merged;
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching remote cart:', err);
        }
    };

    // Auto-sync to backend when cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
        if (token) {
            const timeoutId = setTimeout(() => {
                syncCartWithServer(cart, token);
            }, 1000); // 1s Debounce
            return () => clearTimeout(timeoutId);
        }
    }, [cart]);

    const syncCartWithServer = async (currentCart, token) => {
        try {
            await fetch('/api/user/cart/sync', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    cart: currentCart.map(item => ({ 
                        productId: item.id, 
                        quantity: item.quantity 
                    })) 
                })
            });
        } catch (err) {
            console.error('Error syncing cart:', err);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    };


    const addToCart = (product, quantity = 1) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const value = React.useMemo(() => ({
        products,
        cart,
        user,
        formatPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
    }), [products, cart, user]);

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
};
