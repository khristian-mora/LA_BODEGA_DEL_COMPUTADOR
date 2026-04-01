import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import { ChevronDown, Mail, Phone, MapPin } from 'lucide-react';

const FaqItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-100 rounded-xl bg-white overflow-hidden transition-all duration-300">
            <button
                className="w-full flex items-center justify-between p-4 text-left font-bold hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                {question}
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`px-4 text-gray-600 leading-relaxed transition-all duration-300 ${isOpen ? 'max-h-40 py-4 border-t border-gray-50' : 'max-h-0 overflow-hidden'}`}>
                {answer}
            </div>
        </div>
    );
};

const Support = () => {
    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <h1 className="text-4xl font-bold mb-4">Centro de Ayuda</h1>
                        <p className="text-gray-500 max-w-xl mx-auto">
                            Estamos aquí para ayudarte. Revisa nuestras preguntas frecuentes o contáctanos directamente.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                        {/* LEFT: Contact Form */}
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full">
                                <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>
                                <form className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Nombre</label>
                                            <input type="text" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Email</label>
                                            <input type="email" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Asunto</label>
                                        <select className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none bg-white">
                                            <option>Soporte Técnico</option>
                                            <option>Estado del Pedido</option>
                                            <option>Garantía y Devoluciones</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Mensaje</label>
                                        <textarea rows="4" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none resize-none"></textarea>
                                    </div>
                                    <Button variant="primary" className="w-full py-3">Enviar Mensaje</Button>
                                </form>

                                <div className="mt-8 flex flex-col gap-6 border-t border-gray-100 pt-8 text-sm text-gray-600">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg"><Mail className="w-4 h-4" /></div>
                                        <span>ventas@labodegadelcomputador.com</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg"><Phone className="w-4 h-4" /></div>
                                        <span>317 653 2488</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg"><MapPin className="w-4 h-4" /></div>
                                        <span>Cl. 49 #13-13, Barrancabermeja, Santander</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: FAQ */}
                        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>

                            <FaqItem
                                question="¿Hacen envíos a todo el país?"
                                answer="Sí, realizamos envíos a todos los departamentos de Colombia con nuestros aliados logísticos (Servientrega, Coordinadora, Deprisa)."
                            />
                            <FaqItem
                                question="¿Tienen garantía los productos?"
                                answer="Absolutamente. Todos nuestros equipos cuentan con garantía oficial de fábrica que varía entre 12 y 24 meses dependiendo de la marca."
                            />
                            <FaqItem
                                question="¿Qué métodos de pago aceptan?"
                                answer="Aceptamos todas las tarjetas de crédito y débito (PSE), Nequi, Daviplata y Efecty a través de nuestra pasarela de pagos segura."
                            />
                            <FaqItem
                                question="¿Puedo recoger mi pedido en la tienda?"
                                answer="Sí, puedes seleccionar la opción 'Recoger en Tienda' al finalizar tu compra y pasar por nuestra sede principal en Barrancabermeja sin costo."
                            />
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Support;
