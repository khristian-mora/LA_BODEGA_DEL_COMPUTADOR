'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, User, Menu, X, Heart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LB</span>
              </div>
              <span className="font-bold text-lg text-slate-800 hidden sm:block">
                La Bodega del Computador
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/products"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Productos
              </Link>
              <Link
                href="/sales"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Ofertas
              </Link>
              <Link
                href="/services"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Servicio Técnico
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/favorites">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Heart className="w-5 h-5 mr-1" />
                Favoritos
              </Button>
            </Link>

            <Link href="/cart">
              <Button variant="ghost" size="sm">
                <ShoppingCart className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline">Carrito</span>
              </Button>
            </Link>

            {status === 'loading' ? (
              <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
            ) : session ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm">{session.user?.name}</span>
                </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Mi Perfil
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package className="w-4 h-4" />
                      Mis Pedidos
                    </Link>
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    {(session.user as any)?.role === 'TECNICO' && (
                      <Link
                        href="/tecnico"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        Servicio Técnico
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login">
                <Button size="sm">Iniciar Sesión</Button>
              </Link>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              <Link
                href="/products"
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Productos
              </Link>
              <Link
                href="/sales"
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ofertas
              </Link>
              <Link
                href="/services"
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Servicio Técnico
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
