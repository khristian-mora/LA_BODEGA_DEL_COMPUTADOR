import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[450px] bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-black text-white rounded-xl">
                    <Cookie className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 leading-tight">Valoramos tu privacidad</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación, 
                        analizar el tráfico en nuestro sitio web y brindarte publicidad relevante. 
                        Lee nuestra <Link to="/legal/privacy" className="text-black font-semibold underline underline-offset-4">Política de Cookies</Link> para más info.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleAccept}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-slate-800 to-black text-white rounded-lg font-semibold text-sm hover:from-black hover:to-slate-800 transition-all shadow-lg"
                        >
                            Aceptar Todo
                        </button>
                        <button 
                            onClick={handleAccept}
                            className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                        >
                            Solo Necesarias
                        </button>
                    </div>
                </div>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 text-gray-400 hover:text-black transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
