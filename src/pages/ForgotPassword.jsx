import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { Mail, ArrowLeft, CheckCircle, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                setSubmitted(true);
            } else {
                setError(data.error || 'Ocurrió un error. Intente de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Design */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1510511459019-5dee997d7db4?w=1920&q=80" 
                    alt="Abstract Tech"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-slate-900/90 z-10"></div>
                
                <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
                    <Link to="/" className="flex items-center gap-3">
                        <Monitor className="w-10 h-10" />
                        <span className="text-xl font-bold tracking-tighter uppercase">La Bodega del Computador</span>
                    </Link>
                    
                    <div className="max-w-md">
                        <h1 className="text-5xl font-black mb-6 leading-tight">Seguridad <br/> Primero</h1>
                        <p className="text-lg text-slate-300">No te preocupes, a todos nos pasa. Recuperar tu cuenta es rápido y seguro.</p>
                    </div>

                    <p className="text-sm text-slate-500">© 2025 LBDC. Protección garantizada.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    {!submitted ? (
                        <>
                            <div className="space-y-2 text-center lg:text-left">
                                <h2 className="text-3xl font-black text-slate-900">¿Olvidaste tu contraseña?</h2>
                                <p className="text-slate-500">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Correo Electrónico</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input 
                                            required 
                                            type="email" 
                                            placeholder="tu@correo.com"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium p-4 bg-red-50 rounded-xl border border-red-100">{error}</p>}

                                <Button disabled={loading} className="w-full py-4 text-lg font-bold">
                                    {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                                </Button>

                                <Link to="/login" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
                                </Link>
                            </form>
                        </>
                    ) : (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900">¡Correo Enviado!</h2>
                            <p className="text-slate-500 leading-relaxed">
                                Si <strong>{email}</strong> está en nuestra base de datos, recibirás un enlace en unos segundos.
                            </p>
                            <Link to="/login" className="block">
                                <Button className="w-full py-4 font-bold">Volver al Login</Button>
                            </Link>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
