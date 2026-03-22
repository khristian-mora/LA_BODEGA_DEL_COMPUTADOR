'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

function VerifyForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');

  const verifyEmail = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        toast(data.message, 'success');
      } else {
        setStatus('error');
        setMessage(data.error);
        toast(data.error, 'error');
      }
    } catch {
      setStatus('error');
      setMessage('Error al verificar correo');
      toast('Error al verificar correo', 'error');
    }
  }, [token]);

  React.useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token, verifyEmail]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          {status === 'loading' ? (
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : status === 'success' ? (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <CardTitle className="text-2xl">
          {status === 'loading' ? 'Verificando...' : status === 'success' ? '¡Verificado!' : 'Error'}
        </CardTitle>
        <CardDescription>
          {status === 'loading'
            ? 'Por favor espera...'
            : status === 'success'
            ? 'Tu correo ha sido verificado'
            : 'No se pudo verificar tu correo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {message && (
          <p className="text-sm text-gray-600 mb-6">{message}</p>
        )}

        {status === 'success' && (
          <Link href="/auth/login">
            <Button>Iniciar Sesión</Button>
          </Link>
        )}

        {status === 'error' && (
          <Link href="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <React.Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Verificando...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <VerifyForm />
      </React.Suspense>
    </div>
  );
}
