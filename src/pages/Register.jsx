import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';

const Register = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const name = e.target[0].value;
        const email = e.target[1].value;
        const password = e.target[2].value;
        const confirmPassword = e.target[3].value;

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();

            if (response.ok) {
                alert('Registro exitoso. Por favor inicia sesión.');
                navigate('/login');
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
        <Layout>
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 px-6">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 w-full max-w-md animate-fade-in-up">
                    <h1 className="text-3xl font-bold mb-2 text-center">Crear Cuenta</h1>
                    <p className="text-gray-500 text-center mb-8">Únete a nuestra comunidad</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input required type="text" placeholder="Juan Pérez" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input required type="email" placeholder="tu@email.com" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Contraseña</label>
                            <input required type="password" placeholder="••••••••" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                            <input required type="password" placeholder="••••••••" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-shadow" />
                        </div>

                        <div className="flex items-start gap-2 text-sm text-gray-600 mt-2">
                            <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                            <span>
                                Autorizo el <Link to="/legal/privacy" className="text-black font-bold hover:underline">Tratamiento de Datos Personales</Link> según la Ley 1581 de 2012 y acepto los términos.
                            </span>
                        </div>

                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                        <Button disabled={loading} variant="primary" className="w-full py-3 text-lg mt-4">
                            {loading ? 'Creando cuenta...' : 'Registrarse'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="font-bold text-black hover:underline">
                            Inicia Sesión
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Register;
