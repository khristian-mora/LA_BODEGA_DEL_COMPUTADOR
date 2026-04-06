import React, { useEffect, useRef } from 'react';

const GoogleLoginButton = ({ onSuccess, onError, text = 'signin_with' }) => {
    const googleButtonRef = useRef(null);
    const initializedRef = useRef(false);
    const callbacksRef = useRef({ onSuccess, onError });

    useEffect(() => {
        callbacksRef.current = { onSuccess, onError };
    }, [onSuccess, onError]);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const init = () => {
            if (!window.google || !googleButtonRef.current || initializedRef.current) return;
            
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (res) => {
                        if (res.credential) {
                            callbacksRef.current.onSuccess(res.credential);
                        } else {
                            callbacksRef.current.onError('No se recibió la credencial de Google');
                        }
                    },
                    auto_select: false
                });

                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: 'outline', 
                    size: 'large', 
                    width: 320, 
                    text, 
                    shape: 'rectangular'
                });
                
                initializedRef.current = true;
            } catch (e) { 
                console.error('Google GSI Init Error:', e); 
            }
        };

        // Poll for window.google if it's not yet loaded (async defer script)
        const timer = setInterval(() => {
            if (window.google) {
                init();
                clearInterval(timer);
            }
        }, 100);

        return () => clearInterval(timer);
    }, [text]);

    return (
        <div 
            ref={googleButtonRef} 
            className="w-full flex justify-center mt-4 min-h-[50px] transition-all duration-300"
            style={{ contain: 'layout' }}
        ></div>
    );
};

export default GoogleLoginButton;
