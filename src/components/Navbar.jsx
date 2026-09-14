import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, User, Monitor } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import CartDrawer from './CartDrawer';

const Navbar = () => {
    const { getCartCount } = useShop();
    const { settings: _settings } = useSettings();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                className="fixed top-0 left-0 w-full z-50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
                <div className={`w-full px-6 md:px-12 h-20 flex items-center transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'} lg:grid lg:grid-cols-[1fr_auto_1fr] flex justify-between`}>

                    {/* Left: Logo */}
                    <div className="flex justify-start z-20">
                        <Link to="/" className="text-xl font-bold tracking-tighter flex items-center gap-3">
                            <Monitor className="w-8 h-8" />
                            <span className="uppercase whitespace-nowrap hidden lg:inline">LA BODEGA DEL COMPUTADOR</span>
                            <span className="uppercase whitespace-nowrap lg:hidden">LBDC</span>
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-6 justify-center">
                        <Link to="/" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>Inicio</Link>
                        <Link to="/laptops" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/laptops' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>Portátiles</Link>
                        <Link to="/components" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/components' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>Componentes</Link>
                        <Link to="/accessories" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/accessories' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>Accesorios</Link>
                        <Link to="/printers" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/printers' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>Impresoras</Link>
                        <Link to="/furniture" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/furniture' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>Mobiliario</Link>
                        <Link to="/gaming" className={`text-sm font-medium transition-colors whitespace-nowrap ${location.pathname === '/gaming' ? 'font-bold border-b-2 border-black' : 'hover:text-gray-600'}`}>
                            Zona Gaming
                        </Link>
                        <Link to="/builder" className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
                            Arma tu PC
                        </Link>
                    </div>

                    {/* Right: Icons */}
                    <div className="flex justify-end items-center gap-4 z-20">
                        {/* Desktop Search Bar (Expandable) */}
                        <div className={`hidden md:flex items-center bg-gray-100 rounded-full px-4 py-1.5 transition-all duration-300 ${isSearchOpen ? 'w-64 opacity-100' : 'w-10 opacity-0 pointer-events-none'}`}>
                            <Search className="w-4 h-4 text-gray-500 mr-2" />
                            <input 
                                type="text"
                                placeholder="Buscar productos..."
                                className="bg-transparent border-none focus:ring-0 text-sm w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button 
                            className={`p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block ${isSearchOpen ? 'bg-gray-200' : ''}`}
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                        >
                            {isSearchOpen ? <X className="w-5 h-5 text-gray-700" /> : <Search className="w-5 h-5 text-gray-700" />}
                        </button>
                        <Link 
                            to={localStorage.getItem('userToken') || localStorage.getItem('adminToken') ? "/profile" : "/login"} 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <User className="w-5 h-5 text-gray-700" />
                        </Link>

                        {/* Cart Button — opens drawer */}
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative block"
                            aria-label="Abrir carrito"
                        >
                            <ShoppingBag className="w-5 h-5 text-gray-700" />
                            {getCartCount() > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-black text-white text-[10px] flex items-center justify-center rounded-full animate-bounce-once">
                                    {getCartCount()}
                                </span>
                            )}
                        </button>

                        {/* Mobile Menu Button */}
                        <button className="lg:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="absolute top-full left-0 w-full bg-white shadow-lg py-4 px-6 flex flex-col gap-4 md:hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                                <Link to="/" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Inicio</Link>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Link to="/laptops" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Portátiles</Link>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                <Link to="/components" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Componentes</Link>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Link to="/accessories" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Accesorios</Link>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="pt-4 border-t border-gray-100">
                                <Link 
                                    to={localStorage.getItem('userToken') || localStorage.getItem('adminToken') ? "/profile" : "/login"} 
                                    className="text-lg font-bold flex items-center gap-2" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <User className="w-5 h-5" />
                                    {localStorage.getItem('userToken') || localStorage.getItem('adminToken') ? "Mi Perfil" : "Iniciar Sesión"}
                                </Link>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            {/* Cart Drawer — rendered outside the nav to avoid z-index issues */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Navbar;
