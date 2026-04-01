import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, ShieldCheck, Clock, Package, AlertCircle, Phone, Mail, MapPin, FileText, Shield, Lock, Scale, User } from 'lucide-react';

const SupportPolicyModal = ({ isOpen, onClose, type }) => {
    if (!isOpen) return null;

    const content = {
        shipping: {
            title: 'Envíos y Devoluciones',
            icon: Truck,
            sections: [
                {
                    title: 'Cobertura y Tiempos',
                    icon: Clock,
                    text: 'Realizamos envíos a todo el territorio nacional a través de nuestros aliados oficiales: Coordinadora, Servientrega y Deprisa. \n\n• Barrancabermeja: Entrega el mismo día o 24 horas hábiles.\n• Nacional: De 2 a 5 días hábiles según la ubicación.'
                },
                {
                    title: 'Política de Retracto',
                    icon: Package,
                    text: 'De acuerdo con la Ley 1480 de 2011, tienes derecho al retracto dentro de los primeros 5 días hábiles tras recibir tu pedido. El producto debe estar sellado, en su empaque original y sin señales de uso.'
                },
                {
                    title: 'Devoluciones y Cambios',
                    icon: AlertCircle,
                    text: 'Si el producto presenta fallas de fábrica al momento de la entrega, procederemos con el cambio inmediato sin costo alguno para el cliente. Para cambios por retracto, el cliente asume los costos de envío.'
                }
            ]
        },
        warranty: {
            title: 'Políticas de Garantía',
            icon: ShieldCheck,
            sections: [
                {
                    title: 'Tiempos de Garantía',
                    icon: Clock,
                    text: '• Portátiles y Componentes: 12 meses de garantía oficial de fabricante.\n• Accesorios y Periféricos: 3 a 6 meses según la marca.\n• Equipos Usados/Reacondicionados: 3 meses de garantía limitada.'
                },
                {
                    title: '¿Qué cubre la garantía?',
                    icon: ShieldCheck,
                    text: 'Cubre fallas técnicas de hardware y defectos de fabricación. \n\nNo cubre: Daños físicos (golpes, fisuras), exposición a humedad, sobrecargas eléctricas, sellos de seguridad rotos o manipulación por personal no autorizado.'
                },
                {
                    title: 'Trámite de Garantía',
                    icon: Package,
                    text: 'Para radicar una garantía, debes presentar la factura original. El tiempo de respuesta es de 15 días hábiles máximo según la ley colombiana para diagnóstico y reparación.'
                }
            ]
        },
        faq: {
            title: 'Preguntas Frecuentes',
            icon: AlertCircle,
            sections: [
                {
                    title: '¿Hacen envíos a todo el país?',
                    icon: Truck,
                    text: 'Sí, realizamos envíos a todos los departamentos de Colombia con nuestros aliados logísticos (Coordinadora, Servientrega, Deprisa).'
                },
                {
                    title: '¿Tienen garantía los productos?',
                    icon: ShieldCheck,
                    text: 'Absolutamente. Todos nuestros equipos cuentan con garantía oficial de fábrica que varía entre 12 y 24 meses dependiendo de la marca (ver sección de Garantía para más detalle).'
                },
                {
                    title: '¿Qué métodos de pago aceptan?',
                    icon: Package,
                    text: 'Aceptamos todas las tarjetas de crédito y débito (PSE), Nequi, Daviplata y Efecty a través de nuestra pasarela de pagos segura.'
                },
                {
                    title: '¿Puedo recoger mi pedido en la tienda?',
                    icon: Clock,
                    text: 'Sí, puedes seleccionar la opción "Recoger en Tienda" al finalizar tu compra y pasar por nuestra sede principal en Barrancabermeja sin costo.'
                }
            ]
        },
        contact: {
            title: 'Contáctanos',
            icon: Phone,
            sections: [
                {
                    title: 'Atención al Cliente',
                    icon: Phone,
                    text: 'Estamos disponibles para ayudarte en cualquier duda sobre tu pedido o productos.\n\n• WhatsApp: 317 653 2488\n• Horario: Lun a Sáb 8:00 AM - 6:30 PM'
                },
                {
                    title: 'Correo Electrónico',
                    icon: Mail,
                    text: 'Para consultas formales, solicitudes de cotización o soporte técnico detallado:\n\n• ventas@labodegadelcomputador.com'
                },
                {
                    title: 'Nuestra Ubicación',
                    icon: MapPin,
                    text: 'Visítanos en nuestra sede física principal:\n\n• Dirección: Cl. 49 #13-13, Barrancabermeja, Santander, Colombia.'
                }
            ]
        },
        privacy: {
            title: 'Privacidad y Habeas Data',
            icon: Lock,
            sections: [
                {
                    title: 'Protección de Datos',
                    icon: Shield,
                    text: 'En cumplimiento de la Ley 1581 de 2012, La Bodega del Computador protege tus datos personales. La información recolectada se utiliza exclusivamente para el procesamiento de pedidos, actualizaciones de envío y mejora de nuestra atención.'
                },
                {
                    title: 'Tus Derechos',
                    icon: User,
                    text: 'Como titular de los datos, tienes derecho a conocer, actualizar, rectificar y suprimir tu información personal en cualquier momento. Puedes ejercer estos derechos enviándonos un correo a ventas@labodegadelcomputador.com.'
                },
                {
                    title: 'Seguridad en Pagos',
                    icon: Lock,
                    text: 'No almacenamos información de tus tarjetas de crédito o débito. Todas las transacciones se realizan a través de pasarelas de pago certificadas con estándares de seguridad bancaria.'
                }
            ]
        },
        terms: {
            title: 'Términos y Condiciones',
            icon: Scale,
            sections: [
                {
                    title: 'Uso del Sitio',
                    icon: FileText,
                    text: 'Al acceder a nuestro sitio web, aceptas cumplir con nuestros términos de uso. Nos reservamos el derecho de actualizar precios y disponibilidad de productos sin previo aviso.'
                },
                {
                    title: 'Precios e Impuestos',
                    icon: Scale,
                    text: 'Todos los precios mostrados incluyen IVA según la legislación colombiana vigente. Los costos de envío se calcularán al finalizar la compra dependiendo del peso y destino.'
                },
                {
                    title: 'Propiedad Intelectual',
                    icon: Shield,
                    text: 'Todo el contenido, logos e imágenes son propiedad de La Bodega del Computador. Queda prohibida su reproducción total o parcial sin autorización expresa de la empresa.'
                }
            ]
        }
    };

    const currentData = content[type] || content.shipping;
    const MainIcon = currentData.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div 
                    className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-black text-white p-2 rounded-xl">
                                <MainIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">{currentData.title}</h3>
                        </div>
                        <button 
                            onClick={onClose}
                            className="bg-white text-gray-400 hover:text-black hover:shadow-md transition-all p-2 rounded-full border border-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                        {currentData.sections.map((section, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 + 0.2 }}
                                className="flex gap-6"
                            >
                                <div className="bg-gray-50 text-black p-3 rounded-2xl h-fit border border-gray-100">
                                    <section.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-bold text-gray-900">{section.title}</h4>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                        {section.text}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer / Action */}
                    <div className="p-6 border-t border-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-black/20"
                        >
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SupportPolicyModal;
