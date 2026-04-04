import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Shield, Monitor, ArrowLeft, Wrench } from 'lucide-react';
import Button from '../../components/Button';
import { useModal } from '../../context/ModalContext';

const TechLogin = () => {
    const navigate = useNavigate();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showAlert({
                    title: 'Error',
                    message: data.error || 'Error al iniciar sesión',
                    type: 'error'
                });
                setLoading(false);
                return;
            }

            // VALIDACIÓN DE ROL PARA INGRESO TÉCNICO
            const userRole = data.user?.role?.toLowerCase() || '';
            const isTechnician = ['técnico', 'tecnico', 'technician'].includes(userRole);
            
            if (data.user && !isTechnician) {
                 showAlert({
                    title: 'Acceso Denegado',
                    message: 'Esta área es exclusiva para personal técnico. Verifique sus credenciales e intente en el acceso general.',
                    type: 'error'
                });
                setLoading(false);
                return;
            }

            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));

            navigate('/admin/tech-service');
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error de conexión con el servidor',
                type: 'error'
            });
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                {/* Background Image */}
                <img 
                    src="https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1920&q=80" 
                    alt="Servicio técnico y reparación"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30 z-10"></div>
                
                {/* Content */}
                <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Monitor className="w-10 h-10" />
                        <span className="text-xl font-bold tracking-tighter uppercase">La Bodega del Computador</span>
                    </div>
                    
                    <div className="space-y-8">
                        <h3 className="text-4xl font-bold leading-tight">
                            Atención de Soporte
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                                Diagnóstico y Reparación
                            </span>
                        </h3>
                        
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <p className="text-lg leading-relaxed">
                                Este entorno está estrictamente destinado a gestionar reparaciones, garantías y servicio de soporte técnico a clientes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative">
                
                <Link 
                    to="/" 
                    className="absolute top-8 left-8 flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al sitio
                </Link>

                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2 text-orange-600">
                            <Wrench className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Portal de Técnicos</h1>
                        <p className="text-gray-500">Acceso exclusivo a módulos de servicios y soporte técnico</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Correo asignado de técnico</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 transition-all outline-none"
                                        placeholder="tecnico@labodega.com"
                                        value={credentials.email}
                                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-800 transition-all outline-none"
                                        placeholder="••••••••"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-4 text-base flex items-center justify-center gap-2 group"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Verificando acceso...
                                </span>
                            ) : (
                                <>
                                    Ingresar al Taller
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                        <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-orange-800">Control de Acceso</p>
                            <p className="text-orange-600">Este portal confina completamente su sesión a los módulos operativos técnicos.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechLogin;
