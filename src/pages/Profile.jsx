import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { 
    User, Mail, Package, Shield, Settings, LogOut, 
    ChevronRight, Clock, MapPin, Phone, CreditCard,
    ShoppingBag, Wrench, Bell, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildApiUrl } from '../config/config';
import { useShop } from '../context/ShopContext';

const DEPARTAMENTOS_COLOMBIA = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 
    'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 
    'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 
    'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 
    'Vaupés', 'Vichada'
];

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: '', phone: '', address: '', city: '', department: '', idNumber: ''
    });
    const { cart, formatPrice } = useShop();

    useEffect(() => {
        const fetchProfileData = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');

            if (!storedUser || !token) {
                navigate('/login');
                return;
            }

            const userData = JSON.parse(storedUser);
            setUser(userData);
            try {
                // Fetch Profile and Customer Data
                const profileRes = await fetch(buildApiUrl('/api/user/profile'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUser(profileData);
                    setEditData({
                        name: profileData.name || '',
                        phone: profileData.phone || '',
                        address: profileData.address || '',
                        city: profileData.city || '',
                        department: profileData.department || '',
                        idNumber: profileData.idNumber || ''
                    });
                }

                // Fetch Tickets
                const ticketsRes = await fetch(buildApiUrl('/api/user/tickets'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (ticketsRes.ok) {
                    const ticketsData = await ticketsRes.json();
                    setTickets(ticketsData);
                }

                // Fetch Orders
                const ordersRes = await fetch(buildApiUrl('/api/orders'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (ordersRes.ok) {
                    const ordersData = await ordersRes.json();
                    setOrders(ordersData.orders || []);
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [navigate]);

    const fetchOrderItems = async (orderId) => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        setLoadingItems(true);
        try {
            const res = await fetch(buildApiUrl(`/api/orders/${orderId}/items`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrderItems(data);
            }
        } catch (err) {
            console.error('Error fetching order items:', err);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        setLoadingItems(true);
        try {
            const res = await fetch(buildApiUrl('/api/user/profile'), {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                // Update local states
                setUser(prev => ({ ...prev, ...editData }));
                
                // Update localStorage user name if needed
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                storedUser.name = editData.name;
                localStorage.setItem('user', JSON.stringify(storedUser));
                
                setIsEditing(false);
            } else {
                const errData = await res.json();
                alert(errData.error || 'Error al actualizar perfil');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </Layout>
    );

    if (!user) return null;

    const allActivity = [
        ...tickets.map(t => ({ ...t, type: 'ticket', date: t.createdAt })),
        ...orders.map(o => ({ ...o, type: 'order', date: o.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s?.includes('entregado') || s?.includes('completado') || s?.includes('ready')) return 'bg-green-100 text-green-700';
        if (s?.includes('proceso') || s?.includes('diagnostico')) return 'bg-blue-100 text-blue-700';
        if (s?.includes('cancelado')) return 'bg-red-100 text-red-700';
        return 'bg-amber-100 text-amber-700';
    };

    return (
        <Layout>
            <div className="min-h-screen bg-slate-50/50 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="mb-10">
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black text-slate-900 tracking-tight"
                        >
                            Mi Perfil
                        </motion.h1>
                        <p className="text-slate-500 mt-1">Gestiona tu cuenta, pedidos y servicios técnicos.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* User Card */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>
                                
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-lg border border-slate-50">
                                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                                            {user.picture ? (
                                                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-12 h-12 text-slate-400" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-1/2 translate-x-12 bg-blue-600 p-2 rounded-full border-4 border-white text-white">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{user.name}</h2>
                                <p className="text-slate-500 text-sm mb-6 flex items-center justify-center gap-1.5">
                                    <Mail className="w-4 h-4" /> {user.email}
                                </p>

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 py-3 group">
                                        <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    </Button>
                                    <Button onClick={handleLogout} variant="danger" className="flex-[3] py-3 gap-2">
                                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                                    </Button>
                                </div>
                            </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                                        <ShoppingBag className="w-8 h-8 text-blue-600 mb-3" />
                                        <p className="text-2xl font-black text-slate-900">{orders.length}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pedidos</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                                        <Wrench className="w-8 h-8 text-indigo-600 mb-3" />
                                        <p className="text-2xl font-black text-slate-900">{tickets.length}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Servicios</p>
                                    </div>
                                </div>

                                {/* Saved Cart Card */}
                                {cart.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <ShoppingBag className="w-24 h-24" />
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                                                <Bell className="w-5 h-5 text-blue-400 animate-pulse" />
                                                ¡Carrito Guardado!
                                            </h3>
                                            <p className="text-blue-100/70 text-sm mb-6">
                                                Tienes {cart.length} productos esperando. Estos items están sincronizados en todos tus dispositivos.
                                            </p>
                                            
                                            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                                {cart.map((item, i) => (
                                                    <motion.div 
                                                        key={i} 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10"
                                                    >
                                                        <span className="text-xs font-bold truncate pr-2">{item.name}</span>
                                                        <span className="text-xs font-black text-blue-300">x{item.quantity}</span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <Button 
                                                variant="primary" 
                                                className="w-full bg-blue-500 hover:bg-blue-400 border-none shadow-lg shadow-blue-500/20"
                                                onClick={() => navigate('/cart')}
                                            >
                                                Finalizar Compra
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Account Details */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                    <h3 className="text-xl font-bold text-slate-900">Detalles de la Cuenta</h3>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-xs font-bold px-4"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Editar Datos
                                    </Button>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</p>
                                        <p className="font-semibold text-slate-700">{user.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documento (ID)</p>
                                        <p className="font-semibold text-slate-700">{user.idNumber || 'No registrado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                                        <p className="font-semibold text-slate-700">{user.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teléfono</p>
                                        <p className={`font-semibold ${user.phone ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                            {user.phone || 'Añadir teléfono'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
                                        <p className={`font-semibold ${user.city ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                            {user.city && user.department ? `${user.city}, ${user.department}` : 'Añadir ciudad/depto'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dirección de Envío</p>
                                        <p className={`font-semibold ${user.address ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                                            {user.address || 'Sin dirección registrada'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                                    <h3 className="text-xl font-bold text-slate-900">Actividad Reciente</h3>
                                </div>
                                
                                {allActivity.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {allActivity.map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                                                onClick={() => {
                                                    if (item.type === 'order') {
                                                        setSelectedOrder(item);
                                                        fetchOrderItems(item.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${item.type === 'ticket' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {item.type === 'ticket' ? <Wrench className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            {item.type === 'ticket' ? `${item.deviceType} ${item.brand}` : `Pedido #${item.orderNumber}`}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            {new Date(item.date).toLocaleDateString()} • {item.type === 'ticket' ? 'Servicio Técnico' : 'Compra en Tienda'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right hidden sm:block">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                        {item.total && <p className="text-sm font-black text-slate-900 mt-1">{formatPrice(item.total)}</p>}
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                            <Clock className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold">Sin actividad aún</p>
                                            <p className="text-slate-500 text-sm">Tus pedidos y servicios aparecerán aquí.</p>
                                        </div>
                                        <Button variant="primary" onClick={() => navigate('/catalog')} className="mt-4 px-8 py-3">
                                            Explorar Productos
                                        </Button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Order Details Modal */}
                <AnimatePresence>
                    {selectedOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedOrder(null)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900">Detalle del Pedido</h3>
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                                            #{selectedOrder.orderNumber} • {new Date(selectedOrder.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedOrder(null)}
                                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        <LogOut className="w-6 h-6 text-slate-500 rotate-180" />
                                    </button>
                                </div>

                                <div className="p-8 overflow-y-auto flex-1">
                                    {loadingItems ? (
                                        <div className="py-20 flex justify-center">
                                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="divide-y divide-slate-100">
                                                {orderItems.map((item, i) => (
                                                    <div key={i} className="py-4 flex gap-4 items-center">
                                                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 overflow-hidden">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-8 h-8 text-slate-300 m-auto mt-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-900 text-sm leading-tight">{item.name}</p>
                                                            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                                                                {item.category} • Cant: {item.quantity}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">{formatPrice(item.price)} c/u</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Total Pagado</p>
                                                    <p className="text-3xl font-black">{formatPrice(selectedOrder.total)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Método de Pago</p>
                                                    <p className="font-bold flex items-center justify-end gap-2">
                                                        <CreditCard className="w-4 h-4 text-blue-400" />
                                                        {selectedOrder.paymentMethod}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 py-4 font-bold"
                                        onClick={() => setSelectedOrder(null)}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        className="flex-1 py-4 font-bold shadow-lg shadow-blue-500/20"
                                        onClick={() => window.print()}
                                    >
                                        Imprimir Recibo
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Edit Profile Modal */}
                <AnimatePresence>
                    {isEditing && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsEditing(false)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-2xl font-black text-slate-900">Editar Perfil</h3>
                                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                        <LogOut className="w-6 h-6 text-slate-500 rotate-180" />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={editData.name}
                                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Número de Documento (Cédula/NIT)</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={editData.idNumber}
                                                onChange={(e) => setEditData({ ...editData, idNumber: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teléfono de Contacto</label>
                                            <input 
                                                type="tel" 
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={editData.phone}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Departamento</label>
                                            <select 
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer"
                                                value={editData.department}
                                                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                            >
                                                <option value="">Seleccione Departamento</option>
                                                {DEPARTAMENTOS_COLOMBIA.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ciudad</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ej. Medellín"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={editData.city}
                                                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dirección de Envío</label>
                                            <input 
                                                type="text" 
                                                placeholder="Calle, Carrera, Apto..."
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                value={editData.address}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-4">
                                        <Button 
                                            type="button"
                                            variant="outline" 
                                            className="flex-1 py-4 font-bold"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button 
                                            type="submit"
                                            variant="primary" 
                                            disabled={loadingItems}
                                            className="flex-1 py-4 font-bold shadow-lg shadow-blue-500/20"
                                        >
                                            {loadingItems ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </Layout>
    );
};

export default Profile;
