import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { useShop } from '../context/ShopContext';
import { CheckCircle, CreditCard, Lock } from 'lucide-react';

import { orderService } from '../services/orderService';
import { automationService } from '../services/automationService';
import { buildUploadUrl } from '../config/config';
// Make sure to remove duplicate imports of hooks if they exist in the full file

const Checkout = () => {
    const { cart, getCartTotal, formatPrice, clearCart } = useShop();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Nequi specific states
    const [nequiPhone, setNequiPhone] = useState('');
    const [nequiStatus, setNequiStatus] = useState('idle'); // idle, waiting, error
    const [countDown, setCountDown] = useState(45);

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        address: '',
        city: '',
        department: '',
        name: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // List of common PSE Banks (static for production unless a real API is connected)
    const [pseBanks] = useState([
        { id: '1', name: 'Bancolombia' },
        { id: '2', name: 'Nequi' },
        { id: '3', name: 'Daviplata' },
        { id: '4', name: 'Banco de Bogotá' },
        { id: '5', name: 'BBVA' }
    ]);
    const [selectedBank, setSelectedBank] = useState('');

    // Timer effect
    React.useEffect(() => {
        let timer;
        if (nequiStatus === 'waiting' && countDown > 0) {
            timer = setInterval(() => {
                setCountDown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [nequiStatus, countDown]);

    // Autosave draft for cart recovery (Debounced)
    React.useEffect(() => {
        if (!formData.email && !formData.phone) return;

        const timer = setTimeout(() => {
            automationService.saveCartDraft({
                email: formData.email,
                phone: formData.phone,
                name: formData.name,
                cartData: cart
            });
        }, 3000); // Save after 3 seconds of inactivity

        return () => clearTimeout(timer);
    }, [formData, cart]);

    const processOrder = async (methodName) => {
        // Create the real order in our local database
        await orderService.createOrder({
            items: cart,
            total: getCartTotal(),
            customer: formData.name || 'Cliente Web',
            email: formData.email,
            phone: formData.phone,
            address: `${formData.address}, ${formData.city}, ${formData.department}`,
            paymentMethod: methodName
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let methodName = 'Tarjeta Crédito/Débito';
            if (paymentMethod === 'nequi') methodName = 'Nequi';
            if (paymentMethod === 'mercadopago') {
                methodName = selectedBank ? `PSE - ${pseBanks.find(b => b.id === selectedBank)?.name}` : 'Mercado Pago';
            }
            if (paymentMethod === 'addi') methodName = 'Addi (Cuotas)';

            // Create the order in the backend
            await processOrder(methodName);

            setLoading(false);
            setStep(2);
            clearCart();
        } catch (error) {
            setLoading(false);
            alert('Error al procesar el pedido: ' + error.message);
        }
    };

    if (cart.length === 0 && step === 1) {
        navigate('/cart');
        return null;
    }

    if (step === 2) {
        return (
            <Layout>
                <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 px-6">
                    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 max-w-lg text-center animate-fade-in-up">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">¡Pago Exitoso!</h1>
                        <p className="text-gray-600 mb-8">
                            {paymentMethod === 'addi'
                                ? 'Tu crédito con Addi ha sido aprobado y el pedido procesado.'
                                : paymentMethod === 'nequi'
                                    ? 'Pago recibido exitosamente desde tu Nequi.'
                                    : 'Hemos recibido tu pedido correctamente.'}
                            <br />En breve recibirás un correo con los detalles.
                        </p>
                        <Button variant="primary" className="w-full py-4 text-lg" onClick={() => navigate('/')}>
                            Volver al Inicio
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-6">
                    <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Finalizar Compra</h1>

                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Checkout Form */}
                        <div className="lg:w-2/3">
                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* Contact Info */}
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">1</div>
                                        Información de Contacto
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                                            <input required name="name" value={formData.name} onChange={handleInputChange} type="text" placeholder="Juan Pérez" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Email</label>
                                            <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="tu@email.com" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Teléfono</label>
                                            <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+57 300 123 4567" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">2</div>
                                        Dirección de Envío
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700">Dirección Completa</label>
                                            <input required name="address" value={formData.address} onChange={handleInputChange} type="text" placeholder="Calle 123 # 45 - 67" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Ciudad</label>
                                            <input required name="city" value={formData.city} onChange={handleInputChange} type="text" placeholder="Bogotá" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Departamento</label>
                                            <input required name="department" value={formData.department} onChange={handleInputChange} type="text" placeholder="Cundinamarca" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">3</div>
                                        Método de Pago
                                    </h2>

                                    {/* Payment Selector */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div
                                            onClick={() => setPaymentMethod('card')}
                                            className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center h-full ${paymentMethod === 'card' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <CreditCard className="w-6 h-6 text-gray-700" />
                                            <span className="font-bold text-gray-900 text-xs">Tarjeta Directa</span>
                                        </div>

                                        <div
                                            onClick={() => setPaymentMethod('mercadopago')}
                                            className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center h-full ${paymentMethod === 'mercadopago' ? 'border-[#009EE3] bg-[#F0F8FF]' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex -space-x-1">
                                                <div className="w-6 h-6 rounded-full bg-[#009EE3] flex items-center justify-center text-white text-[10px] font-bold">M</div>
                                                <div className="w-6 h-6 rounded-full bg-[#20B256] flex items-center justify-center text-white text-[8px] font-bold border border-white">PSE</div>
                                            </div>
                                            <span className="font-bold text-[#009EE3] text-xs">Mercado Pago / PSE</span>
                                        </div>

                                        <div
                                            onClick={() => setPaymentMethod('nequi')}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center h-full ${paymentMethod === 'nequi' ? 'border-[#DA0081] bg-[#FFEBF5]' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="bg-[#DA0081] text-white text-xs font-bold px-2 py-1 rounded w-full max-w-[60px]">Nequi</div>
                                            <span className="font-bold text-[#DA0081] text-sm">Billetera</span>
                                        </div>

                                        <div
                                            onClick={() => setPaymentMethod('addi')}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center h-full ${paymentMethod === 'addi' ? 'border-[#00D1FF] bg-[#E5F9FF]' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="bg-[#00D1FF] text-white text-[10px] font-black px-1.5 py-0.5 rounded italic tracking-tighter transform -skew-x-12 w-full max-w-[50px]">Addi</div>
                                            <span className="font-bold text-[#0048B0] text-sm">Cuotas</span>
                                        </div>
                                    </div>

                                    {/* Conditional Form Render */}
                                    {paymentMethod === 'card' && (
                                        <div className="space-y-6 animate-fade-in-up">
                                            <div className="p-4 border border-blue-500 bg-blue-50 rounded-xl mb-6 flex items-center gap-4">
                                                <CreditCard className="w-6 h-6 text-blue-600" />
                                                <div>
                                                    <p className="font-bold text-blue-900">Tarjeta de Crédito / Débito</p>
                                                    <p className="text-sm text-blue-700">Transacción segura y encriptada</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Número de Tarjeta</label>
                                                <div className="relative">
                                                    <input required type="text" placeholder="0000 0000 0000 0000" className="w-full p-3 pl-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                                    <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Fecha de Exp.</label>
                                                    <input required type="text" placeholder="MM/YY" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">CVC</label>
                                                    <div className="relative">
                                                        <input required type="text" placeholder="123" className="w-full p-3 pl-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                                                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}



                                    {paymentMethod === 'mercadopago' && (
                                        <div className="animate-fade-in-up bg-[#F5F9FF] border border-[#009EE3] p-6 rounded-2xl">
                                            <div className="flex items-center gap-3 mb-6">
                                                <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.104.0/mercadopago/logo__small.png" alt="Mercado Pago" className="h-8" />
                                                <span className="text-sm text-gray-500">Procesado por Mercado Pago</span>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-white p-4 rounded-lg border border-blue-100 cursor-pointer hover:border-blue-300 transition-colors flex items-center gap-3">
                                                    <CreditCard className="w-5 h-5 text-[#009EE3]" />
                                                    <div>
                                                        <p className="font-bold text-sm">Tarjetas Guardadas / Nuevas</p>
                                                        <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-4 rounded-lg border border-blue-100">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">PSE</div>
                                                        <div>
                                                            <p className="font-bold text-sm">Transferencia PSE</p>
                                                            <p className="text-xs text-gray-500">Debita directamente de tu cuenta bancaria</p>
                                                        </div>
                                                    </div>
                                                    <select
                                                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#009EE3] outline-none"
                                                        value={selectedBank}
                                                        onChange={(e) => setSelectedBank(e.target.value)}
                                                    >
                                                        <option value="">Selecciona tu banco...</option>
                                                        {pseBanks.map(bank => (
                                                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'nequi' && (
                                        <div className="animate-fade-in-up space-y-6">
                                            <div className="bg-[#FFEBF5] border border-[#DA0081] p-6 rounded-2xl text-center">
                                                <h3 className="text-[#DA0081] font-bold text-xl mb-2">Paga con tu celular</h3>

                                                {nequiStatus === 'waiting' ? (
                                                    <div className="py-4">
                                                        <div className="animate-spin-slow w-12 h-12 border-4 border-[#DA0081] border-t-transparent rounded-full mx-auto mb-4"></div>
                                                        <p className="font-bold text-lg mb-2">Esperando confirmación...</p>
                                                        <p className="text-gray-600 mb-4 text-sm px-8">
                                                            Hemos enviado una notificación a tu celular. Por favor acéptala en la app de Nequi.
                                                        </p>
                                                        <span className="inline-block bg-white text-[#DA0081] border border-[#DA0081] px-3 py-1 rounded-full font-mono font-bold">
                                                            00:{countDown.toString().padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-gray-600 mb-6">
                                                            Ingresa tu número de celular registrado en Nequi. Te enviaremos una notificación push para que aceptes el pago en tu app.
                                                        </p>
                                                        <div className="max-w-xs mx-auto">
                                                            <label className="text-sm font-bold text-[#DA0081] block mb-2 text-left">Celular Nequi</label>
                                                            <input
                                                                required
                                                                type="tel"
                                                                value={nequiPhone}
                                                                onChange={(e) => setNequiPhone(e.target.value)}
                                                                placeholder="300 123 4567"
                                                                className="w-full p-3 border-2 border-[#DA0081]/30 rounded-xl focus:ring-2 focus:ring-[#DA0081] focus:border-[#DA0081] focus:outline-none transition-all text-center text-lg font-bold tracking-wider"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'addi' && (
                                        <div className="animate-fade-in-up bg-[#F2FBFE] border border-[#00D1FF] p-6 rounded-2xl text-center">
                                            <h3 className="text-[#0048B0] font-bold text-xl mb-2">Compra hoy, paga después</h3>
                                            <p className="text-gray-600 mb-6">
                                                Serás redirigido a la plataforma segura de Addi para completar tu solicitud de crédito en 3 pasos simples. Solo necesitas tu cédula y WhatsApp.
                                            </p>
                                            <div className="flex justify-center gap-4 text-sm font-medium text-gray-500">
                                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-[#00D1FF]" /> Sin papeleo</span>
                                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-[#00D1FF]" /> Aprobación inmediata</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-start gap-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 border-l-4 border-l-black">
                                    <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Autorizo a <strong>La Bodega del Computador</strong> el <Link to="/legal/privacy" className="text-black font-bold hover:underline">Tratamiento de Datos Personales</Link> según la <strong>Ley 1581 de 2012</strong> para gestionar mi pedido y brindarme soporte técnico.
                                    </p>
                                </div>

                                <Button
                                    variant="primary"
                                    className={`w-full py-4 text-lg font-bold shadow-lg transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01]'} 
                                        ${paymentMethod === 'addi' ? 'bg-[#00D1FF] hover:bg-[#00B8E0] border-transparent text-[#0048B0]' : ''}
                                        ${paymentMethod === 'nequi' ? 'bg-[#DA0081] hover:bg-[#B5006B] border-transparent text-white' : ''}
                                    `}
                                    disabled={loading}
                                >
                                    {loading
                                        ? (paymentMethod === 'addi' ? 'Redirigiendo a Addi...' : paymentMethod === 'nequi' ? 'Procesando...' : paymentMethod === 'mercadopago' ? 'Conectando con Banco...' : 'Procesando Pago...')
                                        : (paymentMethod === 'addi' ? `Pagar a cuotas con Addi` : paymentMethod === 'nequi' ? `Pagar con Nequi` : paymentMethod === 'mercadopago' ? (selectedBank ? 'Ir a mi Banco (PSE)' : 'Pagar con Mercado Pago') : `Pagar ${formatPrice(getCartTotal())}`)
                                    }
                                </Button>

                            </form>
                        </div>

                        {/* Order Recap */}
                        <div className="lg:w-1/3">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                                <h2 className="text-xl font-bold mb-6">Tu Pedido</h2>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg p-1 flex-shrink-0">
                                                <img src={buildUploadUrl(item.image)} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                                                <p className="text-gray-500 text-xs">Cant: {item.quantity}</p>
                                            </div>
                                            <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(getCartTotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Envío</span>
                                        <span className="text-green-600 font-bold">Gratis</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-100 mt-2">
                                        <span>Total</span>
                                        <span>{formatPrice(getCartTotal())}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Checkout;
