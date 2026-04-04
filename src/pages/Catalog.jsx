import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../layouts/Layout';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { Filter, SlidersHorizontal, ChevronDown, Grid, List, ArrowUpDown, Plus } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import { buildUploadUrl, PLACEHOLDER_IMAGE } from '../config/config';
import Button from '../components/Button';

const BASE_URL = 'https://labodegadelcomputador.com';

const ROUTE_TO_CATEGORIES = {
    '/laptops': ['LAPTOPS', 'TABLETS'],
    '/components': ['PROCESADORES', 'PLACAS BASE', 'MEMORIAS RAM', 'DISCOS DUROS', 'GABINETES', 'FUENTES DE PODER'],
    '/accessories': [
        'MOUSE', 'TECLADOS', 'AUDIO', 'AUDIO/PARLANTES',
        'CABLES', 'CABLES/HDMI', 'CABLES/USB', 'CABLES/VGA', 'CABLES/RED',
        'ADAPTADORES/CARGADORES', 'MONITORES',
        'REDES/ROUTER', 'REDES/SWITCH',
        'SEGURIDAD', 'UPS', 'BATERIAS',
        'PERIFERICOS/LECTORES',
        'ACCESORIOS/FUNDAS',
        'OTROS'
    ],
    '/printers': ['IMPRESORAS', 'ESCANERS', 'CONSUMIBLES/TINTAS', 'CONSUMIBLES/PAPEL'],
    '/furniture': ['MUEBLES', 'MUEBLES/BASES', 'MUEBLES/VENTILADORES'],
    '/gaming': ['MOUSE', 'TECLADOS', 'AUDIO', 'MONITORES'],
};

const CATEGORY_META = {
    LAPTOPS:     { title: 'Portátiles y Laptops',         description: 'Encuentra los mejores portátiles y laptops en La Bodega del Computador. Marcas líderes, garantía oficial y envío gratis.', path: '/laptops' },
    PROCESADORES:  { title: 'Componentes PC',               description: 'CPUs, GPUs, RAM, SSD y más componentes para armar o mejorar tu PC. Los mejores precios en La Bodega del Computador.', path: '/components' },
    MOUSE: { title: 'Accesorios y Periféricos',     description: 'Teclados, ratones, auriculares y todo tipo de periféricos y accesorios tecnológicos con envío gratis.', path: '/accessories' },
    IMPRESORAS:    { title: 'Impresoras y Escáneres',        description: 'Impresoras de tinta, láser y multifuncionales. Encuentra la impresora ideal para hogar u oficina.', path: '/printers' },
    MUEBLES:   { title: 'Mobiliario para Oficina',       description: 'Escritorios ergonómicos, sillas de oficina y mobiliario tecnológico para optimizar tu espacio de trabajo.', path: '/furniture' },
    MONITORES:      { title: 'Zona Gaming',                  description: 'PC gaming, periféricos, sillas gamer y todo lo que necesitas para tu setup. La mejor experiencia gaming.', path: '/gaming' },
    All:         { title: 'Catálogo Completo',            description: 'Explora el catálogo completo de La Bodega del Computador: portátiles, componentes, accesorios, impresoras y más.', path: '/catalog' },
    '/catalog':  { title: 'Catálogo Completo',            description: 'Explora el catálogo completo de La Bodega del Computador: portátiles, componentes, accesorios, impresoras y más.', path: '/catalog' },
};

const Catalog = () => {
    const { products } = useShop();
    const location = useLocation();
    
    // UI States
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [priceRange, setPriceRange] = useState(20000000);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [viewMode, setViewMode] = useState('grid');
    const [visibleCount, setVisibleCount] = useState(12);

    // 1. Estabilizar Categorías por Ruta
    const categoriesToShow = useMemo(() => {
        return ROUTE_TO_CATEGORIES[location.pathname] || [];
    }, [location.pathname]);

    // Resetear a "Ver Todo" al cambiar de ruta
    useEffect(() => {
        setSelectedCategory('ALL');
        setVisibleCount(12); // Resetear paginación al cambiar de sección
    }, [location.pathname]);

    // 2. Lógica de Filtrado Optimizada (useMemo en lugar de useEffect)
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filtro por categoría principal de la ruta
        if (categoriesToShow.length > 0 && selectedCategory === 'ALL') {
            result = result.filter(p => categoriesToShow.includes(p.category.toUpperCase()));
        } else if (selectedCategory !== 'ALL') {
            result = result.filter(p => p.category.toUpperCase() === selectedCategory.toUpperCase());
        }

        // Filtro por precio
        result = result.filter(p => p.price <= priceRange);

        // Sorting
        switch (sortBy) {
            case 'price-asc': result.sort((a, b) => a.price - b.price); break;
            case 'price-desc': result.sort((a, b) => b.price - a.price); break;
            case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
            default: break;
        }

        return result;
    }, [products, selectedCategory, categoriesToShow, priceRange, sortBy]);

    // Paginación
    const visibleProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    // Meta-data para SEO
    const meta = useMemo(() => {
        let key = 'All';
        if (CATEGORY_META[location.pathname]) {
            key = location.pathname;
        } else {
            key = selectedCategory === 'ALL' ? (categoriesToShow[0] || 'All') : selectedCategory;
        }
        return CATEGORY_META[key] || CATEGORY_META['All'];
    }, [location.pathname, selectedCategory, categoriesToShow]);

    // JSON-LD Dinámico estabilizado
    const itemListJsonLd = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: meta.title,
        numberOfItems: filteredProducts.length,
        itemListElement: filteredProducts.slice(0, 15).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${BASE_URL}/product/${p.id}`,
            name: p.name,
        })),
    }), [filteredProducts, meta.title]);

    useSEO({
        title: meta.title,
        description: meta.description,
        canonical: `${BASE_URL}${meta.path}`,
        jsonLd: itemListJsonLd,
    });

    const handleLoadMore = useCallback(() => {
        setVisibleCount(prev => prev + 12);
    }, []);

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 animate-fade-in-up">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Explora nuestro catálogo</p>
                            <h1 className="text-4xl font-bold text-gray-900">{meta.title}</h1>
                        </div>
                        <p className="text-gray-600 mt-4 md:mt-0 font-medium">
                            Mostrando {Math.min(visibleCount, filteredProducts.length)} de {filteredProducts.length} productos
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Mobile Filter Toggle */}
                        <button
                            className="lg:hidden flex items-center justify-between w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <span className="font-bold flex items-center gap-2 tracking-tight"><SlidersHorizontal className="w-5 h-5" /> Filtros Rápidos</span>
                            <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Sidebar Filters */}
                        <aside className={`lg:w-1/4 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-black text-xs uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
                                    <Filter className="w-3 h-3" /> Categorías
                                </h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setSelectedCategory('ALL')}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${selectedCategory === 'ALL' ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        Ver Todo
                                    </button>
                                    {categoriesToShow.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${selectedCategory === cat ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-black text-xs uppercase text-gray-400 tracking-widest mb-6">Precio Máximo</h3>
                                <div className="space-y-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="20000000"
                                        step="500000"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
                                    />
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span>$0</span>
                                        <span className="text-black bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                            Hasta $ {new Intl.NumberFormat('es-CO').format(priceRange)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </aside>

                        {/* Main Grid */}
                        <div className="lg:w-3/4 space-y-6">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-1 border-r border-gray-100 pr-4">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="text-xs bg-transparent font-bold focus:ring-0 cursor-pointer border-none py-1 h-8"
                                    >
                                        <option value="default">Relevancia</option>
                                        <option value="price-asc">Menor Precio</option>
                                        <option value="price-desc">Mayor Precio</option>
                                        <option value="name">Nombre A-Z</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pl-4">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        <Grid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {visibleProducts.length > 0 ? (
                                <>
                                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                                        {visibleProducts.map((product, index) => (
                                            <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index < 6 ? index * 0.05 : 0}s` }}>
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>

                                    {visibleCount < filteredProducts.length && (
                                        <div className="flex justify-center pt-12">
                                            <Button 
                                                variant="outline" 
                                                onClick={handleLoadMore}
                                                className="px-12 py-4 flex items-center gap-2 group border-2 border-gray-200 hover:border-black transition-all bg-white"
                                            >
                                                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                                                <span className="font-bold text-xs uppercase tracking-[0.2em]">Cargar más productos</span>
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white py-24 rounded-3xl border border-gray-100 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                                        <Filter className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No hay coincidencias</h3>
                                    <p className="text-gray-400 text-sm max-w-xs">Intenta ajustar el rango de precio o seleccionar otra categoría.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Catalog;
