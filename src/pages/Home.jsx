import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Hero from '../components/Hero';
import CategoryGrid from '../components/CategoryGrid';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { useSettings } from '../context/SettingsContext';
import useSEO from '../hooks/useSEO';

const Home = () => {
    const { products } = useShop();
    const { settings } = useSettings();

    const featuredProducts = products.filter(p => p.featured).slice(0, 8);

    const jsonLd = React.useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'La Bodega del Computador',
        description: 'Tienda especializada en portátiles, componentes, impresoras, mobiliario y gaming.',
        url: 'https://labodegadelcomputador.com',
        priceRange: '$$',
        areaServed: 'CO',
        currenciesAccepted: 'COP',
        paymentAccepted: 'Cash, Credit Card',
    }), []);

    useSEO({
        title: 'Portátiles, Componentes y Tecnología',
        description: 'La Bodega del Computador: los mejores precios en laptops, componentes PC, impresoras, mobiliario de oficina y zona gaming. Envío gratis y garantía oficial.',
        canonical: 'https://labodegadelcomputador.com/',
        jsonLd
    });

    return (
        <Layout>
            <Hero />
            <CategoryGrid />

            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 animate-fade-in-up">
                        <span className="text-gray-400 font-medium tracking-widest text-sm uppercase">Selección Exclusiva</span>
                        <h2 className="text-4xl font-bold mt-2">Más Vendidos</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredProducts.map((product, index) => (
                            <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20 px-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div
                    className="container mx-auto bg-black text-white rounded-3xl p-12 md:p-24 relative overflow-hidden text-center md:text-left min-h-[400px] flex items-center"
                    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none"></div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">{settings.bannerTitle}</h2>
                        <p className="text-gray-300 text-lg mb-8">{settings.bannerSubtitle}</p>
                        <Link to="/catalog">
                            <Button variant="secondary" className="px-10 py-4 text-lg">Ver Nuevos Arribos</Button>
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Home;
