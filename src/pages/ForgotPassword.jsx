import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

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
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 animate-fade-in-up">

                    {!submitted ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-black mb-2">¿Olvidaste tu contraseña?</h2>
                                <p className="text-gray-500">Ingresa tu correo y te enviaremos un enlace para recuperarla.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all"
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 text-lg"
                                >
                                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                                </Button>

                                <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver al inicio de sesión
                                </Link>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce-slow" />
                            <h2 className="text-3xl font-black mb-4">¡Correo Enviado!</h2>
                            <p className="text-gray-500 mb-8">
                                Si el correo <strong>{email}</strong> está registrado, recibirás un enlace en los próximos minutos. Revisa también tu carpeta de spam.
                            </p>
                            <Link to="/login">
                                <Button variant="outline" className="w-full py-4">Volver al Login</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ForgotPassword;
