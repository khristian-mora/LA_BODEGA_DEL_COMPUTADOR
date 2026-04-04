import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { User, Mail, Lock, CheckCircle, Monitor, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    React.useEffect(() => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (token) {
            navigate('/profile');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setError('Las contraseñas no coinciden');
        }
        
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: formData.name, 
                    email: formData.email, 
                    password: formData.password 
                })
            });
            const data = await response.json();

            if (response.ok) {
                // Auto-login as client
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setShowSuccess(true);
            } else {
                setError(data.error || 'Error al registrarse');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80" 
                    alt="Setup Gamer"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/80 to-black/90 z-10"></div>
                
                <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
                    <Link to="/" className="flex items-center gap-3">
                        <Monitor className="w-10 h-10" />
                        <span className="text-xl font-bold tracking-tighter uppercase">La Bodega del Computador</span>
                    </Link>
                    
                    <div className="max-w-md">
                        <h1 className="text-5xl font-black mb-6 leading-tight">
                            Únete a la elite de la <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                Tecnología
                            </span>
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Crea tu cuenta hoy y accede a precios exclusivos, gestión de garantías y soporte técnico preferencial.
                        </p>
                    </div>

                    <p className="text-sm text-slate-500">© 2025 LBDC. Innovando tu experiencia digital.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    <div className="space-y-6">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black transition-colors group mb-2">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Volver a la tienda
                        </Link>
                        
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900">Crear Cuenta</h2>
                            <p className="text-slate-500">Completa tus datos para empezar</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="Ej. Juan Pérez"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input 
                                        required 
                                        type="email" 
                                        placeholder="tu@correo.com"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input 
                                        required 
                                        type="password" 
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Confirmar Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input 
                                        required 
                                        type="password" 
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none transition-all"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                            <input type="checkbox" required className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                            <span className="text-xs text-slate-500 leading-relaxed">
                                Acepto los <Link to="/legal/terms" className="text-blue-600 font-bold hover:underline">Términos y Condiciones</Link> y el tratamiento de mis datos personales según la <Link to="/legal/privacy" className="text-blue-600 font-bold hover:underline">Política de Privacidad</Link>.
                            </span>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
                                {error}
                            </motion.div>
                        )}

                        <Button disabled={loading} className="w-full py-4 text-lg font-bold">
                            {loading ? 'Creando cuenta...' : (
                                <span className="flex items-center justify-center gap-2">
                                    Registrarse Ahora <ArrowRight className="w-5 h-5" />
                                </span>
                            )}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-bold text-slate-400">
                                <span className="bg-white px-4">O regístrate con</span>
                            </div>
                        </div>

                        <GoogleLoginButton 
                            text="signup_with"
                            onSuccess={async (credential) => {
                                setLoading(true);
                                try {
                                    const res = await fetch('/api/auth/google-login', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ credential })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        localStorage.setItem('userToken', data.token);
                                        localStorage.setItem('user', JSON.stringify(data.user));
                                        
                                        // Update form data for the name in modal
                                        setFormData(prev => ({ ...prev, name: data.user.name }));
                                        
                                        setShowSuccess(true);
                                    } else {
                                        setError(data.error);
                                    }
                                } catch (err) {
                                    setError('Error de conexión con Google');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            onError={(err) => setError(err)}
                        />
                    </form>

                    <p className="text-center text-slate-500">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="font-bold text-slate-900 hover:text-blue-700 hover:underline transition-colors">
                            Inicia Sesión
                        </Link>
                    </p>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center relative overflow-hidden"
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-cyan-400"></div>
                            
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12 text-blue-600" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-2">¡Bienvenido, {formData.name.split(' ')[0]}!</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Tu cuenta ha sido creada con éxito. Ya puedes disfrutar de todos nuestros servicios.
                            </p>
                            
                            <Button className="w-full py-4 font-bold" onClick={() => navigate('/profile')}>
                                Ir a mi Perfil
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Register;
