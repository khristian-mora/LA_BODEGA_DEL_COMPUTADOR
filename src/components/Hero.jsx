import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from './Button';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { buildUploadUrl } from '../config/config';

const Hero = () => {
    const { settings } = useSettings();

    return (
        <section className="w-full min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center overflow-hidden">
            <div className="container mx-auto px-6 lg:px-12 pt-28 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Left Content */}
                <motion.div
                    className="flex flex-col space-y-6 lg:space-y-8 z-10"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12 } }
                    }}
                >

                    <motion.div
                        className="flex items-center gap-3"
                        variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
                        }}
                    >
                        <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">Nuevos Arribos</span>
                        <div className="h-[1px] w-8 bg-gray-300"></div>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-black"
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
                        }}
                    >
                        {settings.heroTitle?.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                <span className="uppercase">{line}</span>
                                <br />
                            </React.Fragment>
                        )) || (
                            <>
                                <span className="uppercase">Elige Tu</span><br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-black">Máquina</span>
                            </>
                        )}
                    </motion.h1>

                    <motion.p
                        className="text-base md:text-lg text-gray-500 max-w-md leading-relaxed"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                    >
                        {settings.heroSubtitle || 'Potencia, diseño y rendimiento. Encuentra el equipo perfecto para lo que necesitas.'}
                    </motion.p>

                    <motion.div
                        className="flex flex-wrap gap-4 pt-2"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                        }}
                    >
                        <Link to="/laptops">
                            <Button variant="primary" className="px-8 py-3.5 flex items-center gap-2">
                                Ver Portátiles
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link to="/builder">
                            <Button variant="outline" className="px-8 py-3.5">Arma tu PC</Button>
                        </Link>
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        className="flex flex-wrap gap-6 pt-4 border-t border-gray-100"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { duration: 0.5, delay: 0.3 } }
                        }}
                    >
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span>Envío gratis</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span>Garantía oficial</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Zap className="w-4 h-4 text-gray-400" />
                            <span>Soporte técnico</span>
                        </div>
                    </motion.div>

                </motion.div>

                {/* Right Image area */}
                <motion.div
                    className="relative flex justify-center lg:justify-end"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <div className="relative w-full max-w-[500px] lg:max-w-[550px]">
                        {/* Background gradient blob - Static for performance (Blur is expensive) */}
                        <div className="absolute -inset-8 bg-gradient-to-tr from-gray-100 via-gray-50 to-white rounded-[3rem] blur-2xl opacity-80" style={{ willChange: 'transform' }} />

                        {/* Image container with border */}
                        <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl shadow-gray-200/50 border border-gray-100">
                            <motion.img
                                src={buildUploadUrl(settings.heroImage) || '/src/assets/hero_laptop.png'}
                                alt="Portátil Premium"
                                className="w-full h-auto object-contain"
                                whileHover={{ scale: 1.03 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            />
                        </div>

                        {/* Floating badge */}
                        <motion.div
                            className="absolute -top-4 -right-4 lg:top-4 lg:-right-6 bg-black text-white px-5 py-3 rounded-2xl shadow-xl z-20"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ willChange: 'transform' }}
                        >
                            <span className="font-bold text-sm">Nuevos Arribos</span>
                        </motion.div>

                        {/* Secondary floating badge */}
                        <motion.div
                            className="absolute -bottom-3 -left-3 lg:bottom-8 lg:-left-8 bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 z-20"
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            style={{ willChange: 'transform' }}
                        >
                            <span className="text-xs font-semibold text-gray-600">+200 productos</span>
                        </motion.div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default Hero;
