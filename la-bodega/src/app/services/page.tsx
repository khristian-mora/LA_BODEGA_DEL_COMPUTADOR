'use client';

import * as React from 'react';
import { Wrench, Clock, Shield, CheckCircle, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceOrderWizard } from '@/components/service-order-wizard';

export default function ServicesPage() {
  const [showWizard, setShowWizard] = React.useState(false);
  const services = [
    {
      icon: Wrench,
      title: 'Reparación de Laptops',
      description: 'Diagnóstico y reparación de todas las marcas: Dell, HP, Lenovo, Asus, Apple y más.',
    },
    {
      icon: Wrench,
      title: 'Reparación de Desktops',
      description: 'Mantenimiento, upgrade y reparación de equipos de escritorio.',
    },
    {
      icon: Wrench,
      title: 'Servicio a Impresoras',
      description: 'Reparación de impresoras laser, tinta continua y ploters.',
    },
    {
      icon: Shield,
      title: 'Limpieza y Mantenimiento',
      description: 'Limpieza interna, cambio de pasta térmica y optimización.',
    },
  ];

  const process = [
    { step: 1, title: 'Solicitud', description: 'Trae tu equipo o contáctanos' },
    { step: 2, title: 'Diagnóstico', description: 'Técnico evalúa el problema (24-48h)' },
    { step: 3, title: 'Presupuesto', description: 'Te enviamos el costo estimado' },
    { step: 4, title: 'Reparación', description: 'Una vez aprobado, reparamos tu equipo' },
    { step: 5, title: 'Entrega', description: 'Recoges tu equipo funcionando' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-2 text-sm mb-6">
              <Wrench className="w-4 h-4" />
              Servicio Técnico Especializado
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Recupera el rendimiento de tu equipo
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Técnicos certificados con más de 10 años de experiencia. 
              Diagnóstico preciso y presupuestos claros.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowWizard(true)}>
                Solicitar servicio
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-slate-400 text-slate-900">
                <Phone className="mr-2 w-5 h-5" />
                Llamar ahora
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Nuestros Servicios</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <service.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {process.map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                  {p.step}
                </div>
                <h3 className="font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="w-10 h-10 mx-auto mb-4 text-blue-400" />
              <h3 className="font-semibold text-lg mb-2">Tiempo de respuesta</h3>
              <p className="text-slate-400">Diagnóstico en 24-48 horas</p>
            </div>
            <div className="text-center">
              <Shield className="w-10 h-10 mx-auto mb-4 text-blue-400" />
              <h3 className="font-semibold text-lg mb-2">Garantía</h3>
              <p className="text-slate-400">3 meses de garantía en reparaciones</p>
            </div>
            <div className="text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-4 text-blue-400" />
              <h3 className="font-semibold text-lg mb-2">Técnicos certificados</h3>
              <p className="text-slate-400">Personal con experiencia verificable</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">¿Tienes un equipo que necesita servicio?</h2>
              <p className="text-gray-600 mb-6">Contáctanos o visita nuestro local para una evaluación gratuita</p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span>(1) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>servicio@labodega.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Calle 123, Bogotá</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <ServiceOrderWizard isOpen={showWizard} onClose={() => setShowWizard(false)} />
    </div>
  );
}
