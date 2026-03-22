import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import { buildUploadUrl } from '../config/config';

const CartDrawer = ({ isOpen, onClose }) => {
    const { cart, updateQuantity, removeFromCart, getCartTotal, formatPrice } = useShop();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    const handleViewCart = () => {
        onClose();
        navigate('/cart');
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                />
            )}

            {/* Drawer Panel */}
            <motion.div
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
                initial={{ x: "100%" }}
                animate={isOpen ? { x: 0 } : { x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-5 h-5" />
                        <h2 className="text-lg font-bold tracking-tight">Mi Carrito</h2>
                        {cart.length > 0 && (
                            <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {cart.reduce((c, i) => c + i.quantity, 0)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Cerrar carrito"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-9 h-9 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Tu carrito está vacío</h3>
                        <p className="text-sm text-gray-400">Añade productos para comenzar tu compra.</p>
                        <button
                            onClick={() => { onClose(); navigate('/products'); }}
                            className="mt-2 px-6 py-2.5 bg-gradient-to-r from-slate-800 to-black text-white text-sm font-semibold rounded-full hover:from-black hover:to-slate-800 transition-all shadow-lg"
                        >
                            Ver Productos
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {cart.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className="flex gap-4 items-center bg-gray-50 rounded-2xl p-3 group"
                                        layout
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    >
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
                                        <img
                                            src={buildUploadUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-contain mix-blend-multiply p-1"
                                            onError={(e) => { e.target.src = '/placeholder.png'; }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{item.category}</p>
                                        <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(item.price * item.quantity)}</p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-black transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-7 h-7 bg-gradient-to-r from-slate-800 to-black text-white rounded-lg flex items-center justify-center hover:from-black hover:to-slate-800 transition-all shadow"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remove */}
                                    <motion.button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                        aria-label="Eliminar producto"
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Footer with Summary */}
                        <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-white">
                            {/* Totals */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(getCartTotal())}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Envío</span>
                                    <span className="text-green-600 font-semibold">Gratis</span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>{formatPrice(getCartTotal())}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <button
                                onClick={handleCheckout}
                                className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-black text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:from-black hover:to-slate-800 transition-all shadow-lg"
                            >
                                Proceder al Pago <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleViewCart}
                                className="w-full py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:border-black hover:text-black transition-colors"
                            >
                                Ver Carrito Completo
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default CartDrawer;
