import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Mail, Lock, ShieldCheck, Monitor, ArrowLeft } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 2FA State
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [tempUserId, setTempUserId] = useState(null);

    React.useEffect(() => {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (token) {
            navigate('/profile');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                if (data.requires2FA) {
                    setRequires2FA(true);
                    setTempUserId(data.tempId);
                } else {
                    const isClient = data.user.role === 'client' || !['admin', 'gerente', 'vendedor', 'técnico', 'rh', 'marketing', 'finanzas'].includes(data.user.role);
                    
                    if (isClient) {
                        localStorage.setItem('userToken', data.token);
                    } else {
                        localStorage.setItem('adminToken', data.token);
                    }
                    
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate(isClient ? '/profile' : '/admin');
                }
            } else {
                setError(data.error || 'Credenciales inválidas');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handle2FAVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: tempUserId, token: twoFactorToken })
            });
            const data = await response.json();

            if (response.ok) {
                const isClient = data.user.role === 'client' || !['admin', 'gerente', 'vendedor', 'técnico', 'rh', 'marketing', 'finanzas'].includes(data.user.role);
                
                if (isClient) {
                    localStorage.setItem('userToken', data.token);
                } else {
                    localStorage.setItem('adminToken', data.token);
                }
                
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate(isClient ? '/profile' : '/admin');
            } else {
                setError(data.error || 'Código incorrecto');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                {/* Background Image */}
                <img 
                    src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=1920&q=80" 
                    alt="Modern laptop workspace"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-zinc-900/95 z-10"></div>
                
                {/* Content Overlay */}
                <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo - mismo que Navbar */}
                    <div className="flex items-center gap-3">
                        <Monitor className="w-10 h-10" />
                        <span className="text-xl font-bold tracking-tighter uppercase">La Bodega del Computador</span>
                    </div>
                    
                    {/* Tagline */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h1 className="text-5xl font-bold leading-tight">
                                Tu tecnología,
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                    nuestra pasión
                                </span>
                            </h1>
                            <p className="text-lg text-white/70 max-w-md">
                                Accede a tu cuenta para gestionar pedidos, favoritos y mucho más.
                            </p>
                        </div>
                        
                        {/* Features */}
                        <div className="flex gap-8 pt-4">
                            {[
                                { label: 'Envío Gratis', value: '+100$' },
                                { label: 'Garantía', value: '2 años' },
                                { label: 'Soporte', value: '24/7' }
                            ].map((feature, i) => (
                                <div key={i}>
                                    <p className="text-2xl font-bold text-white">{feature.value}</p>
                                    <p className="text-xs text-white/50 uppercase tracking-wider">{feature.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <p className="text-sm text-white/40">© 2025 La Bodega del Computador. Todos los derechos reservados.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-gray-50 to-white">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    
                    {/* Mobile Logo */}
                    <Link to="/" className="flex items-center gap-2 lg:hidden mb-8">
                        <Monitor className="w-8 h-8 text-black" />
                        <span className="text-lg font-bold tracking-tighter uppercase">La Bodega del Computador</span>
                    </Link>

                    {!requires2FA ? (
                        <>
                            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black transition-colors group mb-4">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Volver a la tienda
                            </Link>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-gray-900">Bienvenido</h1>
                                <p className="text-gray-500">Ingresa tus credenciales para continuar</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="tu@email.com"
                                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-gray-700">Contraseña</label>
                                            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-black transition-colors">
                                                ¿Olvidaste tu contraseña?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                        <p className="text-red-600 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <Button type="submit" disabled={loading} className="w-full py-4 text-base">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Verificando...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Iniciar Sesión
                                        </span>
                                    )}
                                </Button>
                            </form>

                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase font-bold">
                                        <span className="bg-white px-4 text-gray-400">O continuar con</span>
                                    </div>
                                </div>

                                <GoogleLoginButton 
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
                                                localStorage.setItem('adminToken', data.token);
                                                localStorage.setItem('user', JSON.stringify(data.user));
                                                navigate('/');
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

                                <p className="text-center text-sm text-gray-500 mt-6">
                                    ¿No tienes cuenta?{' '}
                                    <Link to="/register" className="font-semibold text-black hover:underline">
                                        Regístrate aquí
                                    </Link>
                                </p>
                        </>
                    ) : (
                        <div className="text-center space-y-8">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto">
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Verificación 2FA</h1>
                                    <p className="text-gray-500 mt-2">Ingresa el código de 6 dígitos de tu app de autenticación</p>
                                </div>
                            </div>

                            <form onSubmit={handle2FAVerify} className="space-y-6">
                                <div className="space-y-2">
                                    <input
                                        required
                                        autoFocus
                                        type="text"
                                        maxLength="6"
                                        value={twoFactorToken}
                                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000 000"
                                        className="w-full text-center text-4xl tracking-[0.5em] font-bold py-6 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                        <p className="text-red-600 text-sm font-medium text-center">{error}</p>
                                    </div>
                                )}

                                <Button type="submit" disabled={loading || twoFactorToken.length < 6} className="w-full py-4 text-base">
                                    {loading ? 'Validando...' : 'Verificar y Entrar'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setRequires2FA(false)}
                                    className="w-full text-sm text-gray-500 hover:text-black font-medium transition-colors"
                                >
                                    ← Volver al inicio de sesión
                                </button>
                            </form>
                        </div>
                    )}
                    
                    {/* ProNext Credits */}
                    <div className="text-center pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Desarrollado por <span className="font-semibold text-gray-600">ProNext</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
