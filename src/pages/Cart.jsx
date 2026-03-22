import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { useShop } from '../context/ShopContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { buildUploadUrl } from '../config/config';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, getCartTotal, formatPrice } = useShop();
    const navigate = useNavigate();

    if (cart.length === 0) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
                    <div className="mb-6">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🛒</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
                    <p className="text-gray-500 mb-8 max-w-md">Parece que aún no has añadido nada. Explora nuestros productos y encuentra tu próxima máquina.</p>
                    <Button variant="primary" onClick={() => navigate('/products')}>
                        Empezar a Comprar
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-6">
                    <h1 className="text-3xl font-bold mb-8">Tu Carrito de Compras</h1>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items List */}
                        <div className="lg:w-2/3 space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center animate-fade-in-up">
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-gray-50 rounded-lg p-2 flex-shrink-0">
                                        <img src={buildUploadUrl(item.image)} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                                                <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <p className="font-bold text-lg">{formatPrice(item.price)}</p>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                                                <button
                                                    className="w-8 h-8 bg-white rounded-md shadow-sm flex items-center justify-center hover:bg-gray-50"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    className="w-8 h-8 bg-black text-white rounded-md shadow-sm flex items-center justify-center hover:opacity-80"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-1/3">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="text-xl font-bold mb-6">Resumen de Orden</h2>

                                <div className="space-y-4 mb-6 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(getCartTotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Envío</span>
                                        <span className="text-green-600 font-bold">Gratis</span>
                                    </div>
                                    <div className="h-[1px] bg-gray-100 my-4"></div>
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span>{formatPrice(getCartTotal())}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-4 text-lg flex items-center justify-center gap-2"
                                    onClick={() => navigate('/checkout')}
                                >
                                    Proceder al Pago <ArrowRight className="w-5 h-5" />
                                </Button>

                                <div className="mt-4 text-center">
                                    <Link to="/products" className="text-sm text-gray-500 hover:text-black underline">
                                        Continuar Comprando
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Cart;
