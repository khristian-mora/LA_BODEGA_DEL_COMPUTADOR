'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings as SettingsType } from '@/types/landing';
import { Button } from '@/components/ui/button';
import { ArrowRight, Laptop, Monitor, Headphones, Cpu, Wrench, Shield, Truck } from 'lucide-react';

interface LandingClientProps {
  settings: SettingsType;
}

export function LandingClient({ settings }: LandingClientProps) {
  const heroImage = settings.hero_image || 'https://placehold.co/1920x1080/1e293b/2563eb?text=Tecnología+de+última+generación';
  const heroTitle = settings.hero_title || 'Tecnología de última generación';
  const heroSubtitle = settings.hero_subtitle || 'a los mejores precios';
  const heroCtaText = settings.hero_cta_text || 'Ver Productos';
  const heroCtaLink = settings.hero_cta_link || '/products';

  const banners = [
    { title: settings.banner1_title || 'Laptops Gaming', image: settings.banner1_image || 'https://placehold.co/600x400/dc2626/white?text=Laptops+Gaming', link: settings.banner1_link || '/sales?category=laptops' },
    { title: settings.banner2_title || 'Monitores 4K', image: settings.banner2_image || 'https://placehold.co/600x400/2563eb/white?text=Monitores+4K', link: settings.banner2_link || '/sales?category=monitores' },
    { title: settings.banner3_title || 'Periféricos', image: settings.banner3_image || 'https://placehold.co/600x400/16a34a/white?text=Periféricos', link: settings.banner3_link || '/sales?category=accesorios' },
  ];

  const features = [
    { icon: settings.feature_1_icon || 'Truck', title: settings.feature_1_title || 'Envío gratis', desc: settings.feature_1_desc || 'En pedidos mayores a $500.000' },
    { icon: settings.feature_2_icon || 'Shield', title: settings.feature_2_title || 'Garantía', desc: settings.feature_2_desc || 'En todos nuestros productos' },
    { icon: settings.feature_3_icon || 'Wrench', title: settings.feature_3_title || 'Soporte técnico', desc: settings.feature_3_desc || 'Servicio especializado' },
    { icon: settings.feature_4_icon || 'Shield', title: 'Compra segura', desc: 'Protección de datos' },
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = { Truck, Shield, Wrench, Laptop, Cpu, Monitor, Headphones };
    return icons[iconName] || Shield;
  };

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Envíos gratis en pedidos mayores a $500.000
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {heroTitle}
              <br /><span className="text-blue-400">{heroSubtitle}</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl">
              Encuentra laptops, desktops, periféricos y más. Servicio técnico especializado para tu equipo.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href={heroCtaLink}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  {heroCtaText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="border-slate-400 text-slate-900 hover:bg-slate-100">
                  <Wrench className="mr-2 w-5 h-5" />
                  Servicio Técnico
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Categorías</h2>
              <p className="text-slate-500 mt-2">Explora nuestra amplia variedad de productos</p>
            </div>
            <Link href="/products" className="hidden md:block">
              <Button variant="ghost">
                Ver todos
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Laptop, name: 'Laptops', count: 150, slug: 'laptops', color: 'bg-blue-50 text-blue-600' },
              { icon: Cpu, name: 'Desktops', count: 80, slug: 'desktops', color: 'bg-purple-50 text-purple-600' },
              { icon: Monitor, name: 'Monitores', count: 120, slug: 'monitores', color: 'bg-green-50 text-green-600' },
              { icon: Headphones, name: 'Accesorios', count: 300, slug: 'accesorios', color: 'bg-orange-50 text-orange-600' },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-16 h-16 ${cat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-slate-500">{cat.count} productos</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Ofertas especiales</h2>
              <p className="text-slate-500 mt-2">Aprovecha nuestros descuentos exclusivos</p>
            </div>
            <Link href="/sales">
              <Button variant="ghost">
                Ver todas las ofertas
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {banners.map((banner, i) => (
              <Link
                key={i}
                href={banner.link}
                className="relative rounded-2xl overflow-hidden group"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: `url('${banner.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                  <p className="text-white/80">Ver ofertas</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 text-sm mb-6">
                <Wrench className="w-4 h-4" />
                Servicio Técnico Especializado
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Reparación y mantenimiento de tu equipo
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                Contamos con técnicos especializados en laptops, desktops, impresoras y más. 
                Diagnóstico preciso y presupuestos claros.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/services">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Solicitar servicio
                  </Button>
                </Link>
                <Button variant="outline" className="border-slate-400 text-slate-900">
                  Ver tipos de servicio
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Diagnóstico gratuito', 'Repuestos originales', 'Garantía de servicio', 'Tiempo estimado'].map((item, i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-blue-400 font-bold">{i + 1}</span>
                  </div>
                  <p className="font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
