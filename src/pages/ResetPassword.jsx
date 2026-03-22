import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

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
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center p-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Enlace no válido</h2>
                        <Link to="/forgot-password"><Button>Solicitar nuevo enlace</Button></Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-fade-in-up">

                    {!submitted ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-black mb-2">Nueva Contraseña</h2>
                                <p className="text-gray-500">Elige una contraseña segura que no uses en otros sitios.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nueva Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 text-lg"
                                >
                                    {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce-slow" />
                            <h2 className="text-3xl font-black mb-4">¡Actualizada!</h2>
                            <p className="text-gray-500 mb-8">Tu contraseña ha sido cambiada con éxito. Ya puedes iniciar sesión.</p>
                            <Link to="/login">
                                <Button className="w-full py-4 text-lg">Iniciar Sesión Ahora</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ResetPassword;
