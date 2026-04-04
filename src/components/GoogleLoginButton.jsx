import React, { useEffect, useRef } from 'react';

const GoogleLoginButton = ({ onSuccess, onError, text = 'signin_with' }) => {
    const googleButtonRef = useRef(null);

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        
        if (!clientId) {
            console.error('VITE_GOOGLE_CLIENT_ID not found in environment variables');
            return;
        }

        const initializeGoogleLogin = () => {
            if (!window.google) return;

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    if (response.credential) {
                        onSuccess(response.credential);
                    } else {
                        onError('No se recibió la credencial de Google');
                    }
                },
            });

            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: text,
                shape: 'rectangular',
            });

            // Optional: One Tap
            // window.google.accounts.id.prompt(); 
        };

        // Load script dynamically if not present
        if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogleLogin;
            document.head.appendChild(script);
        } else {
            initializeGoogleLogin();
        }
    }, [onSuccess, onError, text]);

    return <div ref={googleButtonRef} className="w-full flex justify-center mt-4"></div>;
};

export default GoogleLoginButton;
