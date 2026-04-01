import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Facebook, Instagram } from 'lucide-react';
import { SupportPolicyModal } from './modals';

const Footer = () => {
    const { settings } = useSettings();
    const [supportModal, setSupportModal] = useState({ isOpen: false, type: 'shipping' });

    const openModal = (type) => setSupportModal({ isOpen: true, type });
    const closeModal = () => setSupportModal(prev => ({ ...prev, isOpen: false }));

    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12 } }
                    }}
                >

                    <motion.div className="space-y-4 lg:col-span-1" variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}>
                        <h3 className="text-xl font-bold tracking-tight uppercase">{settings.businessName || 'LA BODEGA'}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Tecnología premium para profesionales y entusiastas. Ofrecemos lo mejor en hardware y accesorios.
                        </p>
                        <div className="text-sm text-gray-500 pt-2 space-y-1">
                            <p>{settings.businessAddress}</p>
                            <p className="font-bold">317 653 2488</p>
                        </div>
                    </motion.div>

                    <motion.div variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}>
                        <h4 className="font-semibold mb-6">Tienda</h4>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><Link to="/laptops" className="hover:text-black transition-colors">Portátiles</Link></li>
                            <li><Link to="/gaming" className="hover:text-black transition-colors">PCs Gamer</Link></li>
                            <li><Link to="/components" className="hover:text-black transition-colors">Componentes</Link></li>
                            <li><Link to="/accessories" className="hover:text-black transition-colors">Accesorios</Link></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}>
                        <h4 className="font-semibold mb-6">Soporte</h4>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><button onClick={() => openModal('contact')} className="hover:text-black transition-colors text-left bg-transparent border-none p-0">Contáctanos</button></li>
                            <li><button onClick={() => openModal('faq')} className="hover:text-black transition-colors text-left bg-transparent border-none p-0">Preguntas Frecuentes</button></li>
                            <li><button onClick={() => openModal('shipping')} className="hover:text-black transition-colors text-left bg-transparent border-none p-0">Envíos y Devoluciones</button></li>
                            <li><button onClick={() => openModal('warranty')} className="hover:text-black transition-colors text-left bg-transparent border-none p-0">Garantía</button></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}>
                        <h4 className="font-semibold mb-6">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li><button onClick={() => openModal('privacy')} className="hover:text-black transition-colors text-left bg-transparent border-none p-0">Privacidad y Habeas Data</button></li>
                            <li><button onClick={() => openModal('terms')} className="hover:text-black transition-colors text-left bg-transparent border-none p-0">Términos y Condiciones</button></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}>
                        <h4 className="font-semibold mb-6">Síguenos</h4>
                        <div className="flex gap-4">
                            <motion.a href="https://www.facebook.com/Bodegadelcomputadorla" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}><Facebook className="w-5 h-5" /></motion.a>
                            <motion.a href="https://www.instagram.com/bodegadelcomputadorla" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}><Instagram className="w-5 h-5" /></motion.a>
                        </div>
                    </motion.div>

                </motion.div>

                <SupportPolicyModal 
                    isOpen={supportModal.isOpen} 
                    onClose={closeModal} 
                    type={supportModal.type} 
                />

                <motion.div
                    className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <p>© {new Date().getFullYear()} {settings.businessName || 'La Bodega del Computador'}. Todos los derechos reservados.</p>
                    <div className="flex gap-6 mt-4 md:mt-0 items-center">
                        <Link to="/tech-login" className="hover:text-black text-xs opacity-50 hover:opacity-100 transition-all">Acceso a soporte técnico</Link>
                        <button onClick={() => openModal('privacy')} className="hover:text-black bg-transparent border-none p-0 text-xs">Privacidad y Habeas Data</button>
                        <button onClick={() => openModal('terms')} className="hover:text-black bg-transparent border-none p-0 text-xs">Términos y Condiciones</button>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
