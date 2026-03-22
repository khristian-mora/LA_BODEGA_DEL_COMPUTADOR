import React from 'react';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { Wrench, Server, Headphones, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

const ServiceCard = ({ icon, title, description }) => {
    const Icon = icon;
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
};

const Enterprise = () => {
    return (
        <Layout>
            {/* Hero Section */}
            <div className="bg-gray-50 pt-32 pb-24 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl">
                        <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4 block animate-fade-in-up">Soluciones Empresariales</span>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-gray-900 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Tecnología y soporte para potenciar tu empresa
                        </h1>
                        <p className="text-xl text-gray-500 mb-8 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Ofrecemos servicios integrales de infraestructura tecnológica, mantenimiento preventivo y mesa de ayuda para mantener tu negocio operando al 100%.
                        </p>
                        <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <Button variant="primary">Contratar Servicios</Button>
                            <Button variant="outline">Agendar Diagnóstico</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Grid */}
            <div className="bg-gray-50 py-24">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Nuestros Servicios</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Diseñados para optimizar el ciclo de vida de tus equipos y garantizar la continuidad operativa.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ServiceCard
                            icon={Wrench}
                            title="Mantenimiento Preventivo"
                            description="Limpieza física y lógica, optimización de sistema y actualización de drivers para extender la vida útil de tus equipos."
                        />
                        <ServiceCard
                            icon={Server}
                            title="Reparación Especializada"
                            description="Diagnóstico y reparación de hardware a nivel de componentes. Solución de fallas críticas en tiempo récord."
                        />
                        <ServiceCard
                            icon={Headphones}
                            title="Mesa de Ayuda (Help Desk)"
                            description="Soporte técnico remoto y presencial para tus colaboradores. Resolución de incidencias de software y conectividad."
                        />
                        <ServiceCard
                            icon={ShieldCheck}
                            title="Ciberseguridad"
                            description="Implementación de antivirus corporativo, firewall y copias de seguridad para proteger la información de tu empresa."
                        />
                        <ServiceCard
                            icon={Server}
                            title="Infraestructura y Redes"
                            description="Cableado estructurado, configuración de servidores y redes Wi-Fi empresariales de alto rendimiento."
                        />
                        <ServiceCard
                            icon={Wrench}
                            title="Outsourcing TI"
                            description="Delegue la gestión de su departamento de tecnología en manos expertas. Reduzca costos fijos."
                        />
                    </div>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="bg-gray-100 rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row gap-12 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-3xl font-bold mb-6 text-gray-900">¿Listo para optimizar tu infraestructura?</h2>
                            <p className="text-gray-500 mb-8 text-lg">
                                Agenda una visita de diagnóstico sin costo. Nuestros ingenieros evaluarán el estado de tus equipos.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-black">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <span className="text-xl font-medium text-gray-900">317 653 2488</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-black">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="text-xl font-medium text-gray-900">empresas@labodega.co</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-black">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <span className="text-xl font-medium text-gray-900">Cl. 49 #13-13, Barrancabermeja</span>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <form className="bg-white p-8 rounded-2xl shadow-lg text-gray-900 space-y-4">
                                <h3 className="font-bold text-xl mb-2">Solicitar Cotización</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Nombre" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black" />
                                    <input type="text" placeholder="Empresa" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black" />
                                </div>
                                <input type="email" placeholder="Correo Corporativo" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black" />
                                <input type="tel" placeholder="Teléfono" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black" />
                                <textarea placeholder="¿Qué servicios necesitas?" rows="3" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-black"></textarea>
                                <Button variant="primary" className="w-full py-4">Enviar Solicitud</Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Enterprise;
