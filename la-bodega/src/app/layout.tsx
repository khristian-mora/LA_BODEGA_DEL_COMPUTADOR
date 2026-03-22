import type { Metadata } from 'next';
import { Inter, IBM_Plex_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ChatSupport } from '@/components/chat-support';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
});

export const metadata: Metadata = {
  title: 'La Bodega del Computador',
  description: 'Tu tienda de confianza para computadores, periféricos y servicios técnicos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'La Bodega',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.svg',
  },
  openGraph: {
    type: 'website',
    title: 'La Bodega del Computador',
    description: 'Tu tienda de confianza para computadores, periféricos y servicios técnicos',
    siteName: 'La Bodega del Computador',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${ibmPlexSans.variable} font-sans antialiased min-h-screen flex flex-col bg-gray-50`}>
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ChatSupport />
        </Providers>
      </body>
    </html>
  );
}
