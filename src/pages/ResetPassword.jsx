import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { Lock, Eye, EyeOff, CheckCircle, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Las contraseñas no coinciden.');
        }
        if (password.length < 6) {
            return setError('La contraseña debe tener al menos 6 caracteres.');
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await response.json();
            if (response.ok) {
                setSubmitted(true);
            } else {
                setError(data.error || 'Token inválido o expirado.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-sm w-full">
                    <h2 className="text-2xl font-bold mb-4">Enlace no válido</h2>
                    <p className="text-slate-500 mb-8">El token de recuperación falta o no es correcto.</p>
                    <Button onClick={() => navigate('/forgot-password')} className="w-full py-4 font-bold">Solicitar Nuevo Enlace</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80" 
                    alt="Cybersecurity"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/80 to-black z-10"></div>
                <div className="relative z-20 p-12 text-white flex flex-col justify-between w-full">
                    <Link to="/" className="flex items-center gap-3">
                        <Monitor className="w-10 h-10" />
                        <span className="text-xl font-bold tracking-tighter uppercase">La Bodega del Computador</span>
                    </Link>
                    <div className="max-w-md">
                        <h1 className="text-5xl font-black mb-6 leading-tight">Nueva <br/> Identidad</h1>
                        <p className="text-lg text-slate-300">Elige una contraseña robusta para proteger tu cuenta y tus datos personales.</p>
                    </div>
                    <p className="text-sm text-slate-500">© 2025 LBDC. Seguridad avanzada.</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    {!submitted ? (
                        <>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black text-slate-900">Restablecer</h2>
                                <p className="text-slate-500">Define tu nueva contraseña de acceso.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Nueva Contraseña</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Confirmar Contraseña</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">{error}</p>}

                                <Button disabled={loading} className="w-full py-4 text-lg font-bold">
                                    {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center space-y-6">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-blue-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900">¡Contraseña Lista!</h2>
                            <p className="text-slate-500">Tu acceso ha sido restablecido con éxito. Ya puedes entrar a tu cuenta.</p>
                            <Link to="/login" className="block">
                                <Button className="w-full py-4 font-bold">Iniciar Sesión e Ir al Perfil</Button>
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
