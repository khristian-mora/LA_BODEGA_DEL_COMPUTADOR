import React, { useState } from 'react';
import { Shield, Smartphone, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import Button from './Button';

const TwoFactorModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Info, 2: QR, 3: Verify, 4: Success
    const [qrData, setQrData] = useState({ qrCode: '', secret: '' });
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const startSetup = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/setup-2fa', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            const data = await response.json();
            setQrData(data);
            setStep(2);
        } catch (err) {
            setError('Error al generar el código QR.');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ token })
            });
            if (response.ok) {
                setStep(4);
            } else {
                setError('Código incorrecto. Intenta de nuevo.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">

                <div className="p-8">
                    {step === 1 && (
                        <div className="text-center">
                            <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black mb-4">Doble Seguridad</h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Protege tu cuenta administrativa con la Autenticación en Dos Pasos (2FA).
                                Necesitarás un código generado en tu celular para poder entrar.
                            </p>
                            <div className="space-y-3">
                                <Button onClick={startSetup} disabled={loading} className="w-full py-4 text-lg">
                                    Configurar Ahora
                                </Button>
                                <button onClick={onClose} className="text-gray-400 hover:text-black font-medium">Tal vez más tarde</button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center">
                            <h3 className="text-2xl font-black mb-4">Escanea el Código QR</h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                Abre Google Authenticator o Authy en tu móvil y escanea este código:
                            </p>

                            <div className="bg-white p-4 border border-gray-100 rounded-2xl inline-block mb-6 shadow-sm">
                                {qrData.qrCode ? <img src={qrData.qrCode} alt="QR 2FA" className="w-48 h-48" /> : 'Cargando...'}
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between mb-8 group">
                                <code className="text-xs text-blue-600 font-mono">{qrData.secret}</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(qrData.secret);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="text-gray-400 hover:text-black"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <Button onClick={() => setStep(3)} className="w-full py-4">Ya lo escaneé</Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center">
                            <h3 className="text-2xl font-black mb-4">Verificación Final</h3>
                            <p className="text-gray-500 mb-8">Ingresa el código de 6 dígitos que aparece en tu aplicación móvil.</p>

                            <input
                                type="text"
                                maxLength="6"
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full text-center text-4xl tracking-widest font-black p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none mb-4"
                            />

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-sm mb-4 justify-center">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button onClick={verifyAndEnable} disabled={loading || token.length < 6} className="w-full py-4">
                                {loading ? 'Verificando...' : 'Habilitar 2FA'}
                            </Button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center py-6">
                            <div className="bg-green-100 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black mb-2 text-green-600">¡Blindaje Activado!</h2>
                            <p className="text-gray-500 mb-8">Tu cuenta de administrador ahora está protegida con seguridad de nivel bancario.</p>
                            <Button onClick={onClose} className="w-full py-4 text-lg">Entendido</Button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default TwoFactorModal;
