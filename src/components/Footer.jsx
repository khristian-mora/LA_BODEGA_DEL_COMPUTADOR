import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
    const { settings } = useSettings();

    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12 } }
                    }}
                >

                    <motion.div className="space-y-4" variants={{
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
                            <li><Link to="/support" className="hover:text-black transition-colors">Contáctanos</Link></li>
                            <li><Link to="/support" className="hover:text-black transition-colors">Preguntas Frecuentes</Link></li>
                            <li><Link to="/support" className="hover:text-black transition-colors">Envíos y Devoluciones</Link></li>
                            <li><Link to="/support" className="hover:text-black transition-colors">Garantía</Link></li>
                        </ul>
                    </motion.div>

                    <motion.div variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}>
                        <h4 className="font-semibold mb-6">Síguenos</h4>
                        <div className="flex gap-4">
                            <motion.a href="#" className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}><Facebook className="w-5 h-5" /></motion.a>
                            <motion.a href="#" className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}><Twitter className="w-5 h-5" /></motion.a>
                            <motion.a href="#" className="p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all" whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}><Instagram className="w-5 h-5" /></motion.a>
                        </div>
                    </motion.div>

                </motion.div>

                <motion.div
                    className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <p>© {new Date().getFullYear()} {settings.businessName || 'La Bodega del Computador'}. Todos los derechos reservados.</p>
                    <p className="text-xs text-gray-300 mt-2 md:mt-0">
                        Desarrollado por <span className="font-semibold text-gray-400">ProNext</span>
                    </p>
                    <div className="flex gap-6 mt-4 md:mt-0 items-center">
                        <Link to="/admin/login" className="hover:text-black text-xs opacity-50 hover:opacity-100 transition-all">Acceso Empleados</Link>
                        <Link to="/legal/privacy" className="hover:text-black">Privacidad y Habeas Data</Link>
                        <Link to="/legal/terms" className="hover:text-black">Términos</Link>
                        <Link to="/legal/cookies" className="hover:text-black">Cookies</Link>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
